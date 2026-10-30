/**
 * Types & Domain Models for XOR Triage
 * Protocol: IN-PHC-TRIAGE-v2.4-DEMO
 * Two-Level Priority System (EMERGENCY | ROUTINE) + Separate AssessmentStatus
 */

export type TriagePriority = 'EMERGENCY' | 'ROUTINE';
export type ClinicalPriority = TriagePriority;

export type AssessmentStatus = 'ASSESSED' | 'HUMAN_REVIEW_REQUIRED';

export type RuleSeverity = 'EMERGENCY' | 'HUMAN_REVIEW_REQUIRED';

export type CareStatus =
  | 'Awaiting Assessment'
  | 'Under Clinical Review'
  | 'Reassessment Required'
  | 'Completed';

export type SyncStatus =
  | 'LOCAL_ONLY'
  | 'PENDING_SYNC'
  | 'SYNCED'
  | 'SYNC_FAILED'
  | 'Saved Locally'
  | 'Pending Sync'
  | 'Synced'
  | 'Sync Failed';

export type ReceiptPrintStatus =
  | 'NOT_PRINTED'
  | 'RECEIPT_GENERATED'
  | 'PRINT_DIALOG_OPENED'
  | 'PRINT_OUTCOME_UNKNOWN'
  | 'PRINTED_CONFIRMED';

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
  severity: RuleSeverity;
  category: 'Vitals' | 'Symptom' | 'Combination' | 'IncompleteData';
}

export interface TriageAssessment {
  id: string;
  encounterId: string;
  patientId: string;
  version: number;
  priority: TriagePriority;
  assessmentStatus: AssessmentStatus;
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
  legacyPriorityFlag?: string;
  isOverridden?: boolean;
  overrideDetails?: {
    originalPriority: TriagePriority;
    overriddenPriority: TriagePriority;
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
  receiptId: string;
  arrivalTimestamp: string;
  registeredAt: string;
  receiptGeneratedAt: string;
  receiptPrintStatus?: ReceiptPrintStatus;
  lastPrintAttemptAt?: string;
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
  priority: TriagePriority;
  assessmentStatus: AssessmentStatus;
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

export type StaffRoleCategory = 'ASHA_NURSE' | 'DOCTOR';

export interface StaffProfile {
  id: string;
  name: string;
  role: 'ANM (Auxiliary Nurse Midwife)' | 'Staff Nurse' | 'Medical Officer (Doctor)' | 'ASHA Worker';
  roleCategory?: StaffRoleCategory;
  registrationNumber?: string;
  email?: string;
  password?: string;
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}
