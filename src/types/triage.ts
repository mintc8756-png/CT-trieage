/**
 * Types & Domain Models for AI Triage Assistant
 * Protocol: IN-PHC-TRIAGE-v2.4-DEMO
 */

export type ClinicalPriority = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

export type CareStatus = 
  | 'Awaiting Assessment'
  | 'Under Clinical Review'
  | 'Reassessment Required'
  | 'Completed';

export type SyncStatus = 'Saved Locally' | 'Pending Sync' | 'Synced' | 'Sync Failed';

export interface VitalMeasurement {
  value: number | null;
  unit: string;
  isUnavailable: boolean;
  unavailableReason?: string;
}

export interface VitalSigns {
  systolicBP: VitalMeasurement;
  diastolicBP: VitalMeasurement;
  oxygenSaturation: VitalMeasurement; // SpO2 in %
  temperature: VitalMeasurement;      // Celsius
  pulseRate: VitalMeasurement;        // bpm
  respiratoryRate: VitalMeasurement;  // breaths/min
  notes?: string;
  measuredAt: string;
  measuredBy: string;
}

export interface TriggeredRule {
  ruleId: string;
  criterion: string;
  observedFinding: string;
  severity: ClinicalPriority;
  category: 'Vitals' | 'Symptom' | 'Combination' | 'IncompleteData';
}

export interface TriageAssessment {
  id: string;
  encounterId: string;
  patientId: string;
  version: number;
  priority: ClinicalPriority;
  triggeredRules: TriggeredRule[];
  explanation: string[];
  missingInformation: string[];
  requiresHumanReview: boolean;
  humanReviewReason?: string;
  safetyWarnings: string[];
  protocolId: string;
  protocolVersion: string;
  assessedAt: string;
  assessedBy: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  acknowledgmentNotes?: string;
  isOverridden?: boolean;
  overrideDetails?: {
    originalPriority: ClinicalPriority;
    overriddenPriority: ClinicalPriority;
    clinicianName: string;
    justification: string;
    timestamp: string;
  };
}

export type SupportedLanguage = 'en' | 'hi' | 'pa';

export interface Patient {
  id: string;             // e.g. PHC-2026-0101
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  village: string;
  phone?: string;
  accompanyingPerson?: string;
  relationship?: string;
  preferredLanguage?: SupportedLanguage;
  registeredAt: string;
  registeredBy: string;
}

export interface Encounter {
  id: string;
  patientId: string;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  onset: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  medicalHistory: string[];
  medicalHistoryUnavailable?: boolean;
  currentMedications?: string;
  allergies?: string;
  clinicalNotes?: string;
  preferredLanguage?: SupportedLanguage;
  vitalSigns: VitalSigns;
  status: CareStatus;
  priority: ClinicalPriority;
  syncStatus: SyncStatus;
  currentAssessmentId: string;
  assessmentHistory: TriageAssessment[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  encounterId: string;
  patientId: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  details: string;
}

export interface StaffProfile {
  id: string;
  name: string;
  role: 'ANM (Auxiliary Nurse Midwife)' | 'Staff Nurse' | 'Medical Officer (Doctor)' | 'ASHA Worker';
  registrationNumber?: string;
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}
