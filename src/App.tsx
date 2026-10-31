/**
 * XOR Triage — Primary Health Centre Clinical Decision Support
 * Target Setting: Primary Health Centres (PHCs), Sub-Centres & CHCs in Rural India
 * Protocol: IN-PHC-TRIAGE-v2.4-DEMO (Two-Level Priority: EMERGENCY | ROUTINE)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Patient,
  Encounter,
  TriageAssessment,
  AuditEvent,
  StaffProfile,
  CareStatus,
  ClinicalPriority,
  VitalSigns,
  ReceiptPrintStatus
} from './types/triage';

import { repository } from './services/patientRepository';
import { INITIAL_STAFF_MEMBERS } from './utils/mockData';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { QueueView } from './components/QueueView';
import { RegistrationView } from './components/RegistrationView';
import { PatientDetailView } from './components/PatientDetailView';
import { SyncCenterView } from './components/SyncCenterView';
import { RedFlagAlertModal } from './components/RedFlagAlertModal';
import { AssessmentSummaryView } from './components/AssessmentSummaryView';
import { PatientReceiptModal } from './components/PatientReceiptModal';
import { AuthView, isDoctorRole } from './components/AuthView';
import { evaluateTriage } from './services/triageEngine';
import { I18nProvider, useI18n } from './i18n';
import {
  signOutFromFirebase,
  subscribeToFirebaseAuth,
  checkActualInternetConnection,
  setFirestoreNetworkState
} from './services/firebase';

const STAFF_ACCOUNTS_STORAGE_KEY = 'XOR_Triage_StaffAccounts_v1';
const ACTIVE_STAFF_SESSION_KEY = 'XOR_Triage_ActiveSession_v1';

function loadStoredStaffAccounts(): StaffProfile[] {
  if (typeof window === 'undefined') return INITIAL_STAFF_MEMBERS;
  try {
    const raw = window.localStorage.getItem(STAFF_ACCOUNTS_STORAGE_KEY);
    if (!raw) return INITIAL_STAFF_MEMBERS;
    const parsed = JSON.parse(raw) as StaffProfile[];
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_STAFF_MEMBERS;
    // Merge initial staff members with any newly signed-up accounts
    const map = new Map<string, StaffProfile>();
    INITIAL_STAFF_MEMBERS.forEach(s => map.set(s.id, s));
    parsed.forEach(s => map.set(s.id, s));
    return Array.from(map.values());
  } catch {
    return INITIAL_STAFF_MEMBERS;
  }
}

function loadActiveSession(accounts: StaffProfile[]): StaffProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const storedId = window.localStorage.getItem(ACTIVE_STAFF_SESSION_KEY);
    if (!storedId) return null;
    return accounts.find(a => a.id === storedId) || null;
  } catch {
    return null;
  }
}

function AppShell() {
  const { t } = useI18n();
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('queue');

  // Staff Accounts & Authenticated User State
  const [staffAccounts, setStaffAccounts] = useState<StaffProfile[]>(() =>
    loadStoredStaffAccounts()
  );
  const [authenticatedStaff, setAuthenticatedStaff] = useState<StaffProfile | null>(() =>
    loadActiveSession(loadStoredStaffAccounts())
  );
  const currentStaff = authenticatedStaff || staffAccounts[0];

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Core Data Collections
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [assessments, setAssessments] = useState<TriageAssessment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);

  // Selected patient for detail inspection
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);

  // Post-Registration Assessment Summary state (Print Receipt, View Details, Return to Queue)
  const [postRegistrationSummary, setPostRegistrationSummary] = useState<{
    patientId: string;
    encounterId: string;
  } | null>(null);

  // Active Printable Receipt Preview Modal target
  const [activeReceiptTarget, setActiveReceiptTarget] = useState<{
    patientId: string;
    encounterId: string;
  } | null>(null);

  // Red-Flag Emergency Modal state
  const [pendingEmergencyModal, setPendingEmergencyModal] = useState<{
    patient: Patient;
    assessment: TriageAssessment;
    encounterId: string;
    fromRegistration?: boolean;
  } | null>(null);

  // Refresh reactive state from repository
  const refreshState = useCallback(() => {
    const allEncounters = repository.getAllEncounters();
    setPatients(repository.getAllPatients());
    setEncounters(allEncounters);
    setAssessments(allEncounters.flatMap(e => e.assessmentHistory));
    setAuditLogs(repository.getAllAuditLogs());
  }, []);

  // Initialize repository on mount
  useEffect(() => {
    const init = async () => {
      await repository.init();
      refreshState();
      setIsReady(true);
    };
    init();
  }, [refreshState]);

  // Automatically sync pending local records to Firestore when Firebase Auth or session becomes ready
  useEffect(() => {
    if (!isReady || !authenticatedStaff) return;
    const unsubscribe = subscribeToFirebaseAuth(async () => {
      if (isOnline) {
        try {
          await repository.syncPendingEncounters();
          refreshState();
        } catch {
          // Handled by structured Firestore error handler
        }
      }
    });
    return () => unsubscribe();
  }, [isReady, authenticatedStaff, isOnline, refreshState]);

  // Monitor real internet connectivity (navigator.onLine + window online/offline events + active network reachability probe)
  useEffect(() => {
    let isMounted = true;

    const applyNetworkState = async (online: boolean) => {
      if (!isMounted) return;
      setIsOnline(online);
      await setFirestoreNetworkState(online);
      if (online && isReady && authenticatedStaff) {
        try {
          await repository.syncPendingEncounters();
          if (isMounted) refreshState();
        } catch {
          // Handled by structured Firestore error handler
        }
      }
    };

    const verifyConnectivity = async () => {
      const reachable = await checkActualInternetConnection();
      await applyNetworkState(reachable);
    };

    const handleBrowserOnline = () => {
      void verifyConnectivity();
    };

    const handleBrowserOffline = () => {
      void applyNetworkState(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verifyConnectivity();
      }
    };

    // Initial check on mount
    void verifyConnectivity();

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('focus', handleBrowserOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      void verifyConnectivity();
    }, 8000);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('focus', handleBrowserOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [isReady, authenticatedStaff, refreshState]);

  // Handle Login
  const handleAuthenticated = (staff: StaffProfile) => {
    setAuthenticatedStaff(staff);
    setSelectedPatientId(null);
    setSelectedEncounterId(null);
    setPostRegistrationSummary(null);
    setActiveTab('queue');
    try {
      window.localStorage.setItem(ACTIVE_STAFF_SESSION_KEY, staff.id);
    } catch {
      // ignore storage errors
    }
  };

  // Handle Sign Up / Google Auth Registration
  const handleRegisterStaff = (newStaff: StaffProfile) => {
    const filtered = staffAccounts.filter(s => s.id !== newStaff.id);
    const updated = [...filtered, newStaff];
    setStaffAccounts(updated);
    try {
      window.localStorage.setItem(STAFF_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
    handleAuthenticated(newStaff);
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    setAuthenticatedStaff(null);
    setSelectedPatientId(null);
    setSelectedEncounterId(null);
    setPostRegistrationSummary(null);
    setActiveTab('queue');
    try {
      window.localStorage.removeItem(ACTIVE_STAFF_SESSION_KEY);
    } catch {
      // ignore storage errors
    }
    await signOutFromFirebase();
  };

  // Select patient to view details
  const handleSelectPatient = (patientId: string, encounterId: string) => {
    setPostRegistrationSummary(null);
    setSelectedPatientId(patientId);
    setSelectedEncounterId(encounterId);
    setActiveTab('queue');
  };

  // Open Receipt Preview modal for any patient encounter
  const handleOpenReceipt = (patientId: string, encounterId: string) => {
    setActiveReceiptTarget({ patientId, encounterId });
  };

  // Update Receipt Print Status in IndexedDB
  const handleUpdateReceiptPrintStatus = useCallback(
    async (encounterId: string, status: ReceiptPrintStatus) => {
      await repository.updateReceiptPrintStatus(
        encounterId,
        status,
        currentStaff.name,
        currentStaff.role
      );
      refreshState();
    },
    [currentStaff.name, currentStaff.role, refreshState]
  );

  // Handle new patient registration submission
  const handleSaveRegistration = async (
    patient: Patient,
    encounter: Encounter,
    assessment: TriageAssessment
  ) => {
    const auditEvent: AuditEvent = {
      id: 'AUD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      encounterId: encounter.id,
      patientId: patient.id,
      timestamp: new Date().toISOString(),
      actor: currentStaff.name,
      actorRole: currentStaff.role,
      action: 'Patient Registered & Triaged',
      details: `New patient registered (${encounter.receiptId}). Priority: ${assessment.priority} (${assessment.assessmentStatus}). Findings: ${assessment.explanation[0] || 'Standard intake.'}`
    };

    await repository.addPatientWithEncounter(patient, encounter, assessment, auditEvent, isOnline);
    refreshState();

    if (assessment.priority === 'EMERGENCY') {
      // Trigger mandatory emergency red-flag modal first, then show Assessment Summary
      setPendingEmergencyModal({
        patient,
        assessment,
        encounterId: encounter.id,
        fromRegistration: true
      });
    } else {
      setSelectedPatientId(null);
      setSelectedEncounterId(null);
      setPostRegistrationSummary({
        patientId: patient.id,
        encounterId: encounter.id
      });
    }
  };

  // Handle emergency red-flag acknowledgment
  const handleAcknowledgeEmergency = async (actionNotes: string) => {
    if (!pendingEmergencyModal) return;

    await repository.acknowledgeEmergency(
      pendingEmergencyModal.encounterId,
      pendingEmergencyModal.assessment.id,
      currentStaff.name,
      currentStaff.role,
      actionNotes,
      isOnline
    );

    refreshState();
    const pid = pendingEmergencyModal.patient.id;
    const eid = pendingEmergencyModal.encounterId;
    const wasFromRegistration = pendingEmergencyModal.fromRegistration;
    setPendingEmergencyModal(null);

    if (wasFromRegistration) {
      setSelectedPatientId(null);
      setSelectedEncounterId(null);
      setPostRegistrationSummary({ patientId: pid, encounterId: eid });
    } else {
      setSelectedPatientId(pid);
      setSelectedEncounterId(eid);
    }
  };

  // Handle care status update
  const handleUpdateCareStatus = async (newStatus: CareStatus) => {
    if (!selectedEncounterId) return;
    await repository.updateCareStatus(
      selectedEncounterId,
      newStatus,
      currentStaff.name,
      currentStaff.role,
      isOnline
    );
    refreshState();
  };

  // Handle recording a reassessment
  const handleRecordReassessment = async (
    newVitals: VitalSigns,
    newSymptoms: string[],
    reasonNotes: string
  ) => {
    if (!selectedEncounterId || !selectedPatientId) return;
    const patient = repository.getPatient(selectedPatientId);
    const encounter = repository.getEncounter(selectedEncounterId);
    if (!patient || !encounter) return;

    const previousAssessment = repository.getAssessment(encounter.currentAssessmentId);

    // Re-evaluate triage engine
    const newAssessment = evaluateTriage({
      encounterId: selectedEncounterId,
      patientId: selectedPatientId,
      patientAge: patient.age,
      chiefComplaint: encounter.chiefComplaint,
      symptoms: newSymptoms,
      severity: encounter.severity,
      vitalSigns: newVitals,
      assessedBy: currentStaff.name,
      previousAssessment
    });

    const auditEvent: AuditEvent = {
      id: 'AUD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      encounterId: selectedEncounterId,
      patientId: selectedPatientId,
      timestamp: new Date().toISOString(),
      actor: currentStaff.name,
      actorRole: currentStaff.role,
      action: 'Reassessment Recorded',
      details: `Reassessment completed (Version ${newAssessment.version}). Priority: ${newAssessment.priority} (${newAssessment.assessmentStatus}). Reason/Notes: ${reasonNotes || 'Periodic observation'}`
    };

    await repository.recordReassessment(selectedEncounterId, newAssessment, auditEvent, isOnline);
    refreshState();

    if (newAssessment.priority === 'EMERGENCY' && previousAssessment?.priority !== 'EMERGENCY') {
      // Escalated to Emergency! Trigger modal
      setPendingEmergencyModal({
        patient,
        assessment: newAssessment,
        encounterId: selectedEncounterId,
        fromRegistration: false
      });
    }
  };

  // Handle clinician override
  const handleClinicianOverride = async (
    newPriority: ClinicalPriority,
    justification: string
  ) => {
    if (!selectedEncounterId) return;
    await repository.applyClinicianOverride(
      selectedEncounterId,
      newPriority,
      currentStaff.name,
      justification,
      isOnline
    );
    refreshState();
  };

  // Handle Sync Now
  const handleSyncNow = async (): Promise<number> => {
    const { syncedCount } = await repository.syncPendingEncounters(true);
    refreshState();
    return syncedCount;
  };

  // Handle Export JSON
  const handleExportJSON = () => {
    const jsonStr = repository.exportFullJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `XOR_Triage_RampurKalan_Export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Reset to Demo
  const handleResetDemo = async () => {
    await repository.resetToCanonicalDemo();
    setSelectedPatientId(null);
    setSelectedEncounterId(null);
    setPostRegistrationSummary(null);
    setActiveReceiptTarget(null);
    refreshState();
  };

  // Handle Delete Patient
  const handleDeletePatient = async (patientId: string) => {
    await repository.deletePatient(patientId, currentStaff.name, currentStaff.role, isOnline);
    if (selectedPatientId === patientId) {
      setSelectedPatientId(null);
      setSelectedEncounterId(null);
    }
    if (postRegistrationSummary?.patientId === patientId) {
      setPostRegistrationSummary(null);
    }
    if (activeReceiptTarget?.patientId === patientId) {
      setActiveReceiptTarget(null);
    }
    refreshState();
  };

  // Selected encounter & patient object for details view
  const activeSelectedPatient = selectedPatientId ? repository.getPatient(selectedPatientId) : null;
  const activeSelectedEncounter = selectedEncounterId ? repository.getEncounter(selectedEncounterId) : null;

  // Post-registration summary objects
  const summaryPatient = postRegistrationSummary
    ? repository.getPatient(postRegistrationSummary.patientId)
    : null;
  const summaryEncounter = postRegistrationSummary
    ? repository.getEncounter(postRegistrationSummary.encounterId)
    : null;
  const summaryAssessment = summaryEncounter
    ? summaryEncounter.assessmentHistory.find(a => a.id === summaryEncounter.currentAssessmentId) ||
      summaryEncounter.assessmentHistory[summaryEncounter.assessmentHistory.length - 1]
    : null;

  // Active receipt preview modal objects
  const receiptPatient = activeReceiptTarget
    ? repository.getPatient(activeReceiptTarget.patientId)
    : null;
  const receiptEncounter = activeReceiptTarget
    ? repository.getEncounter(activeReceiptTarget.encounterId)
    : null;

  // Active emergency count (excludes Completed encounters)
  const activeEmergencyCount = encounters.filter(
    e => e.priority === 'EMERGENCY' && e.status !== 'Completed'
  ).length;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700 font-display">
            {t('app.initializing')}
          </p>
          <p className="text-xs text-slate-400">{t('app.loadingSubtext')}</p>
        </div>
      </div>
    );
  }

  if (!authenticatedStaff) {
    return (
      <AuthView
        staffList={staffAccounts}
        onAuthenticated={handleAuthenticated}
        onRegisterStaff={handleRegisterStaff}
        isOnline={isOnline}
      />
    );
  }

  const isDoctor = isDoctorRole(authenticatedStaff);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentStaff={authenticatedStaff}
        isOnline={isOnline}
        onRegisterClick={() => {
          setSelectedPatientId(null);
          setSelectedEncounterId(null);
          setPostRegistrationSummary(null);
          setActiveTab('register');
        }}
        onSignOut={handleSignOut}
      />

      {/* Primary Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedPatientId(null);
          setSelectedEncounterId(null);
          setPostRegistrationSummary(null);
          setActiveTab(tab);
        }}
        activeEmergencyCount={activeEmergencyCount}
        isDoctor={isDoctor}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 app-container py-4 sm:py-5 no-print">
        {summaryPatient && summaryEncounter && summaryAssessment ? (
          /* Post-Registration Assessment Summary Screen (Print Receipt, View Details, Return to Queue) */
          <AssessmentSummaryView
            patient={summaryPatient}
            encounter={summaryEncounter}
            assessment={summaryAssessment}
            isOnline={isOnline}
            onPrintReceipt={() =>
              handleOpenReceipt(summaryPatient.id, summaryEncounter.id)
            }
            onViewDetails={() => {
              const pid = summaryPatient.id;
              const eid = summaryEncounter.id;
              setPostRegistrationSummary(null);
              setSelectedPatientId(pid);
              setSelectedEncounterId(eid);
            }}
            onReturnToQueue={() => {
              setPostRegistrationSummary(null);
              setSelectedPatientId(null);
              setSelectedEncounterId(null);
              setActiveTab('queue');
            }}
          />
        ) : activeSelectedPatient && activeSelectedEncounter ? (
          /* Screen 3 & 4: Patient Details, CDS Report, Reassessment, & Audit Trail */
          <PatientDetailView
            patient={activeSelectedPatient}
            encounter={activeSelectedEncounter}
            currentStaff={currentStaff}
            auditLogs={auditLogs}
            onBack={() => {
              setSelectedPatientId(null);
              setSelectedEncounterId(null);
            }}
            onOpenReceipt={() =>
              handleOpenReceipt(activeSelectedPatient.id, activeSelectedEncounter.id)
            }
            onDeletePatient={handleDeletePatient}
            onUpdateStatus={handleUpdateCareStatus}
            onRecordReassessment={handleRecordReassessment}
            onClinicianOverride={handleClinicianOverride}
          />
        ) : activeTab === 'queue' ? (
          /* Screen 1: Live Triage Queue */
          <QueueView
            patients={patients}
            encounters={encounters}
            onSelectPatient={handleSelectPatient}
            onPrintReceipt={handleOpenReceipt}
            onDeletePatient={handleDeletePatient}
            onNewRegistration={() => setActiveTab('register')}
          />
        ) : activeTab === 'register' ? (
          /* Screen 2: New Patient Registration */
          <RegistrationView
            currentStaff={currentStaff}
            isOnline={isOnline}
            onSaveSuccess={handleSaveRegistration}
            onCancel={() => setActiveTab('queue')}
          />
        ) : (
          /* Screen 5: Offline & Sync Center */
          <SyncCenterView
            isOnline={isOnline}
            patients={patients}
            encounters={encounters}
            assessments={assessments}
            auditLogs={auditLogs}
            onSyncNow={handleSyncNow}
            onExportJSON={handleExportJSON}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Emergency Red-Flag Modal with mandatory acknowledgment */}
      {pendingEmergencyModal && (
        <RedFlagAlertModal
          patient={pendingEmergencyModal.patient}
          assessment={pendingEmergencyModal.assessment}
          currentStaff={currentStaff}
          onAcknowledge={handleAcknowledgeEmergency}
        />
      )}

      {/* Printable A4 Patient Receipt Modal (Accessible from Assessment Summary, Patient Details, and Live Queue) */}
      {receiptPatient && receiptEncounter && (
        <PatientReceiptModal
          patient={receiptPatient}
          encounter={receiptEncounter}
          isOnline={isOnline}
          onClose={() => setActiveReceiptTarget(null)}
          onUpdatePrintStatus={handleUpdateReceiptPrintStatus}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}
