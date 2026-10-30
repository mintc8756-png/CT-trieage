/**
 * AI Triage Assistant — Primary Health Centre Clinical Decision Support
 * Target Setting: Primary Health Centres (PHCs), Sub-Centres & CHCs in Rural India
 * Protocol: IN-PHC-TRIAGE-v2.4-DEMO
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
  VitalSigns
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
import { evaluateTriage } from './services/triageEngine';
import { I18nProvider, useI18n } from './i18n';

function AppShell() {
  const { t } = useI18n();
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('queue');

  // Staff and Connectivity
  const [currentStaff, setCurrentStaff] = useState<StaffProfile>(INITIAL_STAFF_MEMBERS[0]);
  const [isOnline, setIsOnline] = useState(true);

  // Core Data Collections
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [assessments, setAssessments] = useState<TriageAssessment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);

  // Selected patient for detail inspection
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);

  // Red-Flag Emergency Modal state
  const [pendingEmergencyModal, setPendingEmergencyModal] = useState<{
    patient: Patient;
    assessment: TriageAssessment;
    encounterId: string;
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

  // Handle Online / Offline toggle
  const handleToggleOnline = () => {
    setIsOnline(prev => !prev);
  };

  // Select patient to view details
  const handleSelectPatient = (patientId: string, encounterId: string) => {
    setSelectedPatientId(patientId);
    setSelectedEncounterId(encounterId);
    setActiveTab('queue');
  };

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
      details: `New patient registered. Initial CDS Priority: ${assessment.priority}. Findings: ${assessment.explanation[0] || 'Standard intake.'}`
    };

    await repository.addPatientWithEncounter(patient, encounter, assessment, auditEvent);
    refreshState();

    if (assessment.priority === 'EMERGENCY') {
      // Trigger mandatory emergency red-flag modal
      setPendingEmergencyModal({
        patient,
        assessment,
        encounterId: encounter.id
      });
    } else {
      setSelectedPatientId(patient.id);
      setSelectedEncounterId(encounter.id);
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
      actionNotes
    );

    refreshState();
    const pid = pendingEmergencyModal.patient.id;
    const eid = pendingEmergencyModal.encounterId;
    setPendingEmergencyModal(null);
    setSelectedPatientId(pid);
    setSelectedEncounterId(eid);
  };

  // Handle care status update
  const handleUpdateCareStatus = async (newStatus: CareStatus) => {
    if (!selectedEncounterId) return;
    await repository.updateCareStatus(
      selectedEncounterId,
      newStatus,
      currentStaff.name,
      currentStaff.role
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
      details: `Reassessment completed (Version ${newAssessment.version}). Priority: ${newAssessment.priority}. Reason/Notes: ${reasonNotes || 'Periodic observation'}`
    };

    await repository.recordReassessment(selectedEncounterId, newAssessment, auditEvent);
    refreshState();

    if (newAssessment.priority === 'EMERGENCY' && previousAssessment?.priority !== 'EMERGENCY') {
      // Escalated to Emergency! Trigger modal
      setPendingEmergencyModal({
        patient,
        assessment: newAssessment,
        encounterId: selectedEncounterId
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
      justification
    );
    refreshState();
  };

  // Handle Sync Now
  const handleSyncNow = async (): Promise<number> => {
    const { syncedCount } = await repository.syncPendingEncounters();
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
    a.download = `PHC_RampurKalan_Triage_Export_${new Date().toISOString().slice(0, 10)}.json`;
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
    refreshState();
  };

  // Selected encounter & patient object for details view
  const activeSelectedPatient = selectedPatientId ? repository.getPatient(selectedPatientId) : null;
  const activeSelectedEncounter = selectedEncounterId ? repository.getEncounter(selectedEncounterId) : null;

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentStaff={currentStaff}
        staffList={INITIAL_STAFF_MEMBERS}
        onSelectStaff={setCurrentStaff}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        onRegisterClick={() => {
          setSelectedPatientId(null);
          setSelectedEncounterId(null);
          setActiveTab('register');
        }}
      />

      {/* Primary Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedPatientId(null);
          setSelectedEncounterId(null);
          setActiveTab(tab);
        }}
        activeEmergencyCount={activeEmergencyCount}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 app-container py-4 sm:py-5">
        {activeSelectedPatient && activeSelectedEncounter ? (
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
            onNewRegistration={() => setActiveTab('register')}
          />
        ) : activeTab === 'register' ? (
          /* Screen 2: New Patient Registration */
          <RegistrationView
            currentStaff={currentStaff}
            onSaveSuccess={handleSaveRegistration}
            onCancel={() => setActiveTab('queue')}
          />
        ) : (
          /* Screen 5: Offline & Sync Center */
          <SyncCenterView
            isOnline={isOnline}
            onToggleOnline={handleToggleOnline}
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
