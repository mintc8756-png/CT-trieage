/**
 * Pre-loaded Canonical Clinical Demonstration Scenarios
 * Protocol IN-PHC-TRIAGE-v2.4-DEMO (Two-Level Priority System: EMERGENCY | ROUTINE + HUMAN_REVIEW_REQUIRED)
 */

import { Patient, Encounter, TriageAssessment, AuditEvent, StaffProfile } from '../types/triage';

export const INITIAL_STAFF_MEMBERS: StaffProfile[] = [
  {
    id: 'STAFF-01',
    name: 'Sister Sunita Devi',
    role: 'ANM (Auxiliary Nurse Midwife)',
    roleCategory: 'ASHA_NURSE',
    registrationNumber: 'ANM-UP-84920',
    email: 'sunita@phc.in',
    password: 'nurse123'
  },
  {
    id: 'STAFF-02',
    name: 'Sister Anjali Rao',
    role: 'Staff Nurse',
    roleCategory: 'ASHA_NURSE',
    registrationNumber: 'RN-MH-11930',
    email: 'anjali@phc.in',
    password: 'nurse123'
  },
  {
    id: 'STAFF-03',
    name: 'Dr. Rajesh Sharma',
    role: 'Medical Officer (Doctor)',
    roleCategory: 'DOCTOR',
    registrationNumber: 'MCI-2015-88432',
    email: 'rajesh@phc.in',
    password: 'doctor123'
  },
  {
    id: 'STAFF-04',
    name: 'Rekha Ben',
    role: 'ASHA Worker',
    roleCategory: 'ASHA_NURSE',
    registrationNumber: 'ASHA-GJ-4412',
    email: 'rekha@phc.in',
    password: 'asha123'
  }
];

export const CANONICAL_PATIENTS: Patient[] = [
  {
    id: 'PHC-2026-0101',
    fullName: 'Ramesh Kumar',
    age: 58,
    gender: 'Male',
    village: 'Rampur Kalan (Ward 3)',
    phone: '+91 98765 43210',
    accompanyingPerson: 'Suresh Kumar (Son)',
    registeredAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    registeredBy: 'Sister Sunita Devi (ANM)'
  },
  {
    id: 'PHC-2026-0102',
    fullName: 'Priya Patel',
    age: 34,
    gender: 'Female',
    village: 'Belagavi Tanda',
    phone: '+91 94221 00987',
    accompanyingPerson: 'Manjula Patel (Mother-in-law)',
    registeredAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    registeredBy: 'Sister Sunita Devi (ANM)'
  },
  {
    id: 'PHC-2026-0103',
    fullName: 'Anil Sharma',
    age: 22,
    gender: 'Male',
    village: 'Shivpur Khurd',
    phone: '+91 98230 55431',
    accompanyingPerson: 'Self',
    registeredAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    registeredBy: 'Sister Anjali Rao (Staff Nurse)'
  },
  {
    id: 'PHC-2026-0104',
    fullName: 'Meena Bai',
    age: 45,
    gender: 'Female',
    village: 'Pipariya Majra',
    phone: '+91 97551 23490',
    accompanyingPerson: 'Gopal Bai (Husband)',
    registeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    registeredBy: 'Sister Sunita Devi (ANM)'
  },
  {
    id: 'PHC-2026-0105',
    fullName: 'Sunil Verma',
    age: 36,
    gender: 'Male',
    village: 'Dhamnod Sub-centre',
    phone: '+91 91122 33445',
    accompanyingPerson: 'Mohan Verma (Brother)',
    registeredAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    registeredBy: 'Rekha Ben (ASHA Worker)'
  },
  {
    id: 'PHC-2026-0106',
    fullName: 'Kavita Devi',
    age: 40,
    gender: 'Female',
    village: 'Rampur Kalan (Ward 1)',
    phone: '+91 98930 11223',
    accompanyingPerson: 'Pooja Devi (Daughter)',
    registeredAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    registeredBy: 'Sister Anjali Rao (Staff Nurse)'
  }
];

export const CANONICAL_ASSESSMENTS: TriageAssessment[] = [
  // Assessment 1: Ramesh Kumar (EMERGENCY)
  {
    id: 'ASM-0101-1',
    encounterId: 'ENC-2026-0101',
    patientId: 'PHC-2026-0101',
    version: 1,
    priority: 'EMERGENCY',
    assessmentStatus: 'ASSESSED',
    triggeredRules: [
      {
        ruleId: 'V-SPO2-EMERGENCY',
        criterion: 'SpO₂ < 90% (Severe hypoxemia)',
        observedFinding: 'SpO₂ recorded at 88%',
        severity: 'EMERGENCY',
        category: 'Vitals'
      },
      {
        ruleId: 'COMB-CHEST-HYPOXIA',
        criterion: 'Chest pain + SpO₂ < 94% (Suspected ACS / Pulmonary Embolism)',
        observedFinding: 'Retrosternal chest discomfort with SpO₂ at 88%',
        severity: 'EMERGENCY',
        category: 'Combination'
      },
      {
        ruleId: 'SYMP-CHEST-SEVERE',
        criterion: 'Severe radiating chest pain or diaphoresis',
        observedFinding: 'Pain radiating to left shoulder and arm with profuse sweating',
        severity: 'EMERGENCY',
        category: 'Symptom'
      }
    ],
    explanation: [
      'Critical hypoxemia: SpO₂ is 88% (<90%). Immediate oxygen therapy required.',
      'Dangerous combination: Retrosternal chest pain radiating to left arm with diaphoresis and hypoxemia strongly indicates Acute Coronary Syndrome (ACS).'
    ],
    missingInformation: [],
    requiresHumanReview: false,
    safetyWarnings: [
      'High-risk cardiac presentation: Immediate 12-lead ECG and emergency bed allocation indicated.'
    ],
    protocolId: 'IN-PHC-TRIAGE',
    protocolVersion: 'v2.4',
    assessedAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    assessedBy: 'Sister Sunita Devi (ANM)',
    acknowledgedAt: new Date(Date.now() - 46 * 60 * 1000).toISOString(),
    acknowledgedBy: 'Sister Sunita Devi (ANM)',
    acknowledgmentNotes: 'Oxygen administered @ 4L/min via nasal cannula. Medical Officer Dr. Sharma notified in OPD Room 1.'
  },

  // Assessment 2: Priya Patel (ROUTINE + HUMAN_REVIEW_REQUIRED due to Hyperpyrexia 103.3°F & Tachycardia 118 bpm)
  {
    id: 'ASM-0102-1',
    encounterId: 'ENC-2026-0102',
    patientId: 'PHC-2026-0102',
    version: 1,
    priority: 'ROUTINE',
    assessmentStatus: 'HUMAN_REVIEW_REQUIRED',
    triggeredRules: [
      {
        ruleId: 'V-TEMP-REVIEW-HIGH',
        criterion: 'Body Temperature ≥ 103.1°F (Hyperpyrexia)',
        observedFinding: 'Temperature recorded at 103.3°F',
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      },
      {
        ruleId: 'V-HR-REVIEW',
        criterion: 'Pulse 105–134 bpm',
        observedFinding: 'Pulse recorded at 118 bpm',
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      }
    ],
    explanation: [
      'High fever (Hyperpyrexia): 103.3°F with tachycardia (118 bpm) and persistent rigors.',
      'Flagged for direct Medical Officer clinical review to screen for malaria, typhoid, or acute bacteremia.'
    ],
    missingInformation: [],
    requiresHumanReview: true,
    humanReviewReason: 'Abnormal physiological parameters (Temp 103.3°F, Pulse 118 bpm) require direct clinician verification.',
    safetyWarnings: [],
    protocolId: 'IN-PHC-TRIAGE',
    protocolVersion: 'v2.4',
    assessedAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
    assessedBy: 'Sister Sunita Devi (ANM)'
  },

  // Assessment 3: Anil Sharma (ROUTINE · ASSESSED)
  {
    id: 'ASM-0103-1',
    encounterId: 'ENC-2026-0103',
    patientId: 'PHC-2026-0103',
    version: 1,
    priority: 'ROUTINE',
    assessmentStatus: 'ASSESSED',
    triggeredRules: [],
    explanation: [
      'All recorded vital signs within standard reference intervals.',
      'Subacute upper respiratory symptoms (dry cough, throat tickle) without signs of respiratory distress or red flags.'
    ],
    missingInformation: [],
    requiresHumanReview: false,
    safetyWarnings: [],
    protocolId: 'IN-PHC-TRIAGE',
    protocolVersion: 'v2.4',
    assessedAt: new Date(Date.now() - 64 * 60 * 1000).toISOString(),
    assessedBy: 'Sister Anjali Rao (Staff Nurse)'
  },

  // Assessment 4: Meena Bai (EMERGENCY)
  {
    id: 'ASM-0104-1',
    encounterId: 'ENC-2026-0104',
    patientId: 'PHC-2026-0104',
    version: 1,
    priority: 'EMERGENCY',
    assessmentStatus: 'ASSESSED',
    triggeredRules: [
      {
        ruleId: 'V-SPO2-EMERGENCY',
        criterion: 'SpO₂ < 90% (Severe hypoxemia)',
        observedFinding: 'SpO₂ recorded at 84%',
        severity: 'EMERGENCY',
        category: 'Vitals'
      },
      {
        ruleId: 'V-RR-EMERGENCY',
        criterion: 'Respiratory Rate ≥ 30 breaths/min',
        observedFinding: 'Respiratory rate recorded at 34 breaths/min',
        severity: 'EMERGENCY',
        category: 'Vitals'
      },
      {
        ruleId: 'SYMP-AIRWAY-EMERGENCY',
        criterion: 'Severe respiratory distress / Audible stridor',
        observedFinding: 'Audible stridor with intercostal retractions',
        severity: 'EMERGENCY',
        category: 'Symptom'
      }
    ],
    explanation: [
      'Critical respiratory compromise: SpO₂ 84%, RR 34 breaths/min with audible upper airway stridor.',
      'High risk of imminent respiratory arrest. Requires immediate airway stabilization, nebulization, and high-flow oxygen.'
    ],
    missingInformation: [],
    requiresHumanReview: false,
    safetyWarnings: [
      'Immediate airway intervention required: Prepare emergency suction and bag-valve mask.'
    ],
    protocolId: 'IN-PHC-TRIAGE',
    protocolVersion: 'v2.4',
    assessedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    assessedBy: 'Sister Sunita Devi (ANM)',
    acknowledgedAt: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
    acknowledgedBy: 'Sister Sunita Devi (ANM)',
    acknowledgmentNotes: 'High-flow face mask oxygen initiated. Medical Officer Dr. Sharma rushed to casualty bed.'
  },

  // Assessment 5: Sunil Verma (ROUTINE + HUMAN_REVIEW_REQUIRED due to missing vitals)
  {
    id: 'ASM-0105-1',
    encounterId: 'ENC-2026-0105',
    patientId: 'PHC-2026-0105',
    version: 1,
    priority: 'ROUTINE',
    assessmentStatus: 'HUMAN_REVIEW_REQUIRED',
    triggeredRules: [
      {
        ruleId: 'SAFETY-INCOMPLETE-DATA',
        criterion: 'Critical vital signs unavailable at intake',
        observedFinding: 'Missing parameters: Blood Pressure, Pulse Rate',
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'IncompleteData'
      }
    ],
    explanation: [
      'Conservative safety safeguard: Blood Pressure and Pulse Rate could not be palpated or recorded at intake.',
      'Missing vital signs safeguard flags this patient as HUMAN REVIEW REQUIRED so they are not silently treated as a normal Routine case.'
    ],
    missingInformation: ['Blood Pressure', 'Pulse Rate'],
    requiresHumanReview: true,
    humanReviewReason: 'Critical vitals are unavailable (Blood Pressure, Pulse Rate). Assessment cannot be completed safely without qualified clinical review.',
    safetyWarnings: [
      'Human Review Required: Immediate manual palpation or Doppler assessment needed to rule out hypovolemic shock.'
    ],
    protocolId: 'IN-PHC-TRIAGE',
    protocolVersion: 'v2.4',
    assessedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    assessedBy: 'Rekha Ben (ASHA Worker)'
  },

  // Assessment 6a: Kavita Devi initial (ROUTINE)
  {
    id: 'ASM-0106-1',
    encounterId: 'ENC-2026-0106',
    patientId: 'PHC-2026-0106',
    version: 1,
    priority: 'ROUTINE',
    assessmentStatus: 'ASSESSED',
    triggeredRules: [],
    explanation: [
      'Initial presentation: Mild low-grade fever with bodily aches.',
      'All vital signs initially recorded within normal limits (SpO₂ 96%, HR 78, RR 18).'
    ],
    missingInformation: [],
    requiresHumanReview: false,
    safetyWarnings: [],
    protocolId: 'IN-PHC-TRIAGE',
    protocolVersion: 'v2.4',
    assessedAt: new Date(Date.now() - 74 * 60 * 1000).toISOString(),
    assessedBy: 'Sister Anjali Rao (Staff Nurse)'
  },

  // Assessment 6b: Kavita Devi Reassessment v2 (EMERGENCY ESCALATION)
  {
    id: 'ASM-0106-2',
    encounterId: 'ENC-2026-0106',
    patientId: 'PHC-2026-0106',
    version: 2,
    priority: 'EMERGENCY',
    assessmentStatus: 'ASSESSED',
    triggeredRules: [
      {
        ruleId: 'V-SPO2-EMERGENCY',
        criterion: 'SpO₂ < 90% (Severe hypoxemia)',
        observedFinding: 'SpO₂ dropped to 89%',
        severity: 'EMERGENCY',
        category: 'Vitals'
      },
      {
        ruleId: 'V-RR-REVIEW',
        criterion: 'Respiratory Rate 22–29 breaths/min',
        observedFinding: 'Respiratory rate accelerated to 28 breaths/min',
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      }
    ],
    explanation: [
      'Deterioration observed during waiting period: SpO₂ dropped from 96% down to 89% with worsening tachypnea (28 breaths/min).',
      'Reassessment automatically escalated priority from Routine to EMERGENCY.'
    ],
    missingInformation: [],
    requiresHumanReview: false,
    safetyWarnings: [
      'Priority Escalated: Routine ➔ EMERGENCY due to acute clinical deterioration.'
    ],
    protocolId: 'IN-PHC-TRIAGE',
    protocolVersion: 'v2.4',
    assessedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    assessedBy: 'Sister Anjali Rao (Staff Nurse)',
    acknowledgedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    acknowledgedBy: 'Sister Anjali Rao (Staff Nurse)',
    acknowledgmentNotes: 'Escalation acknowledged. Patient transferred immediately to Resuscitation Bay.'
  }
];

export const CANONICAL_ENCOUNTERS: Encounter[] = [
  // 1. Ramesh Kumar
  {
    id: 'ENC-2026-0101',
    patientId: 'PHC-2026-0101',
    receiptId: 'RCP-2026-0101',
    arrivalTimestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    registeredAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    receiptGeneratedAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    receiptPrintStatus: 'PRINTED_CONFIRMED',
    chiefComplaint: 'Chest pain & shortness of breath',
    symptoms: ['Chest Pain', 'Shortness of Breath', 'Cold Sweats / Diaphoresis', 'Left Arm Radiation'],
    duration: '2 hours',
    onset: 'Sudden (within minutes/hours)',
    severity: 'Severe',
    medicalHistory: ['Hypertension'],
    currentMedications: 'Tab Amlodipine 5mg OD',
    allergies: 'None known',
    clinicalNotes: 'Profuse cold diaphoresis. Patient clutching chest. Immediate ECG required.',
    vitalSigns: {
      systolicBP: { value: 154, unit: 'mmHg', isUnavailable: false },
      diastolicBP: { value: 96, unit: 'mmHg', isUnavailable: false },
      oxygenSaturation: { value: 88, unit: '%', isUnavailable: false },
      temperature: { value: 98.6, unit: '°F', isUnavailable: false },
      pulseRate: { value: 98, unit: 'bpm', isUnavailable: false },
      respiratoryRate: { value: 24, unit: 'breaths/min', isUnavailable: false },
      measuredAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      measuredBy: 'Sister Sunita Devi (ANM)'
    },
    status: 'Under Clinical Review',
    priority: 'EMERGENCY',
    assessmentStatus: 'ASSESSED',
    syncStatus: 'SYNCED',
    currentAssessmentId: 'ASM-0101-1',
    assessmentHistory: [CANONICAL_ASSESSMENTS[0]],
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 46 * 60 * 1000).toISOString()
  },

  // 2. Priya Patel
  {
    id: 'ENC-2026-0102',
    patientId: 'PHC-2026-0102',
    receiptId: 'RCP-2026-0102',
    arrivalTimestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    registeredAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    receiptGeneratedAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
    receiptPrintStatus: 'RECEIPT_GENERATED',
    chiefComplaint: 'High fever with rigors',
    symptoms: ['High Fever', 'Chills & Rigors', 'Severe Headache'],
    duration: '3 days',
    onset: 'Gradual (over several days)',
    severity: 'Moderate',
    medicalHistory: [],
    currentMedications: 'Occasional paracetamol 500mg taken at home',
    allergies: 'Sulfa drugs (rash)',
    clinicalNotes: 'Flushed face, shivering. Advised rapid malaria test & CBC.',
    vitalSigns: {
      systolicBP: { value: 114, unit: 'mmHg', isUnavailable: false },
      diastolicBP: { value: 74, unit: 'mmHg', isUnavailable: false },
      oxygenSaturation: { value: 97, unit: '%', isUnavailable: false },
      temperature: { value: 103.3, unit: '°F', isUnavailable: false },
      pulseRate: { value: 118, unit: 'bpm', isUnavailable: false },
      respiratoryRate: { value: 20, unit: 'breaths/min', isUnavailable: false },
      measuredAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      measuredBy: 'Sister Sunita Devi (ANM)'
    },
    status: 'Awaiting Assessment',
    priority: 'ROUTINE',
    assessmentStatus: 'HUMAN_REVIEW_REQUIRED',
    syncStatus: 'SYNCED',
    currentAssessmentId: 'ASM-0102-1',
    assessmentHistory: [CANONICAL_ASSESSMENTS[1]],
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 31 * 60 * 1000).toISOString()
  },

  // 3. Anil Sharma
  {
    id: 'ENC-2026-0103',
    patientId: 'PHC-2026-0103',
    receiptId: 'RCP-2026-0103',
    arrivalTimestamp: new Date(Date.now() - 68 * 60 * 1000).toISOString(),
    registeredAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    receiptGeneratedAt: new Date(Date.now() - 64 * 60 * 1000).toISOString(),
    receiptPrintStatus: 'PRINTED_CONFIRMED',
    chiefComplaint: 'Mild cough and cold',
    symptoms: ['Cough'],
    duration: '5 days',
    onset: 'Gradual (over several days)',
    severity: 'Mild',
    medicalHistory: [],
    currentMedications: 'None',
    allergies: 'None',
    clinicalNotes: 'Throat mildly erythematous. Chest clear on auscultation.',
    vitalSigns: {
      systolicBP: { value: 118, unit: 'mmHg', isUnavailable: false },
      diastolicBP: { value: 76, unit: 'mmHg', isUnavailable: false },
      oxygenSaturation: { value: 98, unit: '%', isUnavailable: false },
      temperature: { value: 98.2, unit: '°F', isUnavailable: false },
      pulseRate: { value: 72, unit: 'bpm', isUnavailable: false },
      respiratoryRate: { value: 16, unit: 'breaths/min', isUnavailable: false },
      measuredAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      measuredBy: 'Sister Anjali Rao (Staff Nurse)'
    },
    status: 'Awaiting Assessment',
    priority: 'ROUTINE',
    assessmentStatus: 'ASSESSED',
    syncStatus: 'SYNCED',
    currentAssessmentId: 'ASM-0103-1',
    assessmentHistory: [CANONICAL_ASSESSMENTS[2]],
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 64 * 60 * 1000).toISOString()
  },

  // 4. Meena Bai
  {
    id: 'ENC-2026-0104',
    patientId: 'PHC-2026-0104',
    receiptId: 'RCP-2026-0104',
    arrivalTimestamp: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    registeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    receiptGeneratedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    receiptPrintStatus: 'RECEIPT_GENERATED',
    chiefComplaint: 'Severe breathlessness and audible stridor',
    symptoms: ['Shortness of Breath', 'Audible Stridor'],
    duration: '4 hours',
    onset: 'Sudden (within minutes/hours)',
    severity: 'Severe',
    medicalHistory: ['COPD / Asthma'],
    currentMedications: 'Inhaler Salbutamol SOS (lost inhaler 1 month ago)',
    allergies: 'None reported',
    clinicalNotes: 'Marked suprasternal and intercostal retractions. Central cyanosis noted around lips.',
    vitalSigns: {
      systolicBP: { value: 142, unit: 'mmHg', isUnavailable: false },
      diastolicBP: { value: 88, unit: 'mmHg', isUnavailable: false },
      oxygenSaturation: { value: 84, unit: '%', isUnavailable: false },
      temperature: { value: 98.8, unit: '°F', isUnavailable: false },
      pulseRate: { value: 126, unit: 'bpm', isUnavailable: false },
      respiratoryRate: { value: 34, unit: 'breaths/min', isUnavailable: false },
      measuredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      measuredBy: 'Sister Sunita Devi (ANM)'
    },
    status: 'Under Clinical Review',
    priority: 'EMERGENCY',
    assessmentStatus: 'ASSESSED',
    syncStatus: 'PENDING_SYNC',
    currentAssessmentId: 'ASM-0104-1',
    assessmentHistory: [CANONICAL_ASSESSMENTS[3]],
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 13 * 60 * 1000).toISOString()
  },

  // 5. Sunil Verma
  {
    id: 'ENC-2026-0105',
    patientId: 'PHC-2026-0105',
    receiptId: 'RCP-2026-0105',
    arrivalTimestamp: new Date(Date.now() - 27 * 60 * 1000).toISOString(),
    registeredAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    receiptGeneratedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    receiptPrintStatus: 'RECEIPT_GENERATED',
    chiefComplaint: 'Repeated vomiting & extreme dizziness',
    symptoms: ['Repeated Vomiting', 'Severe Dizziness'],
    duration: '1 day',
    onset: 'Sudden (within minutes/hours)',
    severity: 'Severe',
    medicalHistory: [],
    currentMedications: 'None',
    allergies: 'None',
    clinicalNotes: 'Severely dehydrated. Dry tongue, sunken eyes. Peripheral pulses very weak/thready; automated cuff failed twice.',
    vitalSigns: {
      systolicBP: { value: null, unit: 'mmHg', isUnavailable: true, unavailableReason: 'Cuff deflation error, radial pulse barely palpable' },
      diastolicBP: { value: null, unit: 'mmHg', isUnavailable: true, unavailableReason: 'Cuff deflation error' },
      oxygenSaturation: { value: 95, unit: '%', isUnavailable: false },
      temperature: { value: 97.9, unit: '°F', isUnavailable: false },
      pulseRate: { value: null, unit: 'bpm', isUnavailable: true, unavailableReason: 'Severe thready pulse, unpalpable manually' },
      respiratoryRate: { value: 20, unit: 'breaths/min', isUnavailable: false },
      measuredAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      measuredBy: 'Rekha Ben (ASHA Worker)'
    },
    status: 'Awaiting Assessment',
    priority: 'ROUTINE',
    assessmentStatus: 'HUMAN_REVIEW_REQUIRED',
    syncStatus: 'LOCAL_ONLY',
    currentAssessmentId: 'ASM-0105-1',
    assessmentHistory: [CANONICAL_ASSESSMENTS[4]],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString()
  },

  // 6. Kavita Devi (Reassessed & Escalated)
  {
    id: 'ENC-2026-0106',
    patientId: 'PHC-2026-0106',
    receiptId: 'RCP-2026-0106',
    arrivalTimestamp: new Date(Date.now() - 77 * 60 * 1000).toISOString(),
    registeredAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    receiptGeneratedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    receiptPrintStatus: 'RECEIPT_GENERATED',
    chiefComplaint: 'Viral fever with deterioration in waiting hall',
    symptoms: ['High Fever', 'Shortness of Breath'],
    duration: '2 days',
    onset: 'Sudden (within minutes/hours)',
    severity: 'Severe',
    medicalHistory: ['Type 2 Diabetes'],
    currentMedications: 'Tab Metformin 500mg BD',
    allergies: 'None',
    clinicalNotes: 'Initial intake was mild. Reassessment requested by daughter due to sudden gasping. SpO2 plunged from 96% to 89%.',
    vitalSigns: {
      systolicBP: { value: 138, unit: 'mmHg', isUnavailable: false },
      diastolicBP: { value: 86, unit: 'mmHg', isUnavailable: false },
      oxygenSaturation: { value: 89, unit: '%', isUnavailable: false },
      temperature: { value: 101.5, unit: '°F', isUnavailable: false },
      pulseRate: { value: 110, unit: 'bpm', isUnavailable: false },
      respiratoryRate: { value: 28, unit: 'breaths/min', isUnavailable: false },
      measuredAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      measuredBy: 'Sister Anjali Rao (Staff Nurse)'
    },
    status: 'Under Clinical Review',
    priority: 'EMERGENCY',
    assessmentStatus: 'ASSESSED',
    syncStatus: 'PENDING_SYNC',
    currentAssessmentId: 'ASM-0106-2',
    assessmentHistory: [CANONICAL_ASSESSMENTS[5], CANONICAL_ASSESSMENTS[6]],
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString()
  }
];

export const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: 'AUD-001',
    encounterId: 'ENC-2026-0101',
    patientId: 'PHC-2026-0101',
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    actor: 'Sister Sunita Devi',
    actorRole: 'ANM (Auxiliary Nurse Midwife)',
    action: 'Patient Registered & Vitals Recorded',
    details: 'Initial registration (Receipt RCP-2026-0101). SBP 154, SpO2 88%. Chief complaint: chest pain.'
  },
  {
    id: 'AUD-002',
    encounterId: 'ENC-2026-0101',
    patientId: 'PHC-2026-0101',
    timestamp: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    actor: 'IN-PHC-TRIAGE Engine (v2.4-DEMO)',
    actorRole: 'System CDS',
    action: 'Triage Recommendation Generated',
    details: 'Assigned EMERGENCY. Triggered rules: V-SPO2-EMERGENCY, COMB-CHEST-HYPOXIA, SYMP-CHEST-SEVERE.'
  },
  {
    id: 'AUD-003',
    encounterId: 'ENC-2026-0101',
    patientId: 'PHC-2026-0101',
    timestamp: new Date(Date.now() - 46 * 60 * 1000).toISOString(),
    actor: 'Sister Sunita Devi',
    actorRole: 'ANM (Auxiliary Nurse Midwife)',
    action: 'Red-Flag Alert Acknowledged',
    details: 'Staff acknowledged emergency red flag. Oxygen started. Doctor Sharma notified.'
  },
  {
    id: 'AUD-004',
    encounterId: 'ENC-2026-0104',
    patientId: 'PHC-2026-0104',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    actor: 'IN-PHC-TRIAGE Engine (v2.4-DEMO)',
    actorRole: 'System CDS',
    action: 'Triage Recommendation Generated',
    details: 'Assigned EMERGENCY. Triggered rules: V-SPO2-EMERGENCY (84%), V-RR-EMERGENCY (34), SYMP-AIRWAY-EMERGENCY.'
  },
  {
    id: 'AUD-005',
    encounterId: 'ENC-2026-0105',
    patientId: 'PHC-2026-0105',
    timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    actor: 'IN-PHC-TRIAGE Engine (v2.4-DEMO)',
    actorRole: 'System CDS',
    action: 'Missing Data Safeguard Flagged',
    details: 'Blood Pressure & Pulse marked UNAVAILABLE. Assigned HUMAN_REVIEW_REQUIRED safeguard status.'
  },
  {
    id: 'AUD-006',
    encounterId: 'ENC-2026-0106',
    patientId: 'PHC-2026-0106',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    actor: 'Sister Anjali Rao',
    actorRole: 'Staff Nurse',
    action: 'Patient Reassessment Recorded',
    details: 'Reassessment performed in waiting room. SpO2 fell from 96% to 89%. Status escalated from ROUTINE to EMERGENCY.'
  }
];
