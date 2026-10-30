/**
 * Clinical Triage Engine — Protocol IN-PHC-TRIAGE-v2.4-DEMO
 * Two-Level Priority System (EMERGENCY | ROUTINE) with separate AssessmentStatus (ASSESSED | HUMAN_REVIEW_REQUIRED)
 */

import {
  VitalSigns,
  TriagePriority,
  AssessmentStatus,
  RuleSeverity,
  TriggeredRule,
  TriageAssessment
} from '../types/triage';

export const PROTOCOL_ID = 'IN-PHC-TRIAGE';
export const PROTOCOL_VERSION = 'v2.4';
export const CLINICAL_DISCLAIMER =
  'This is a decision-support recommendation, not a diagnosis. A qualified clinician must assess the patient.';

export const RECEIPT_DISCLAIMER =
  'This document contains initial registration and triage information. It is not a diagnosis or a substitute for clinical examination.';

export interface AssessmentInput {
  encounterId: string;
  patientId: string;
  patientAge: number;
  chiefComplaint: string;
  symptoms: string[];
  severity: 'Mild' | 'Moderate' | 'Severe';
  vitalSigns: VitalSigns;
  assessedBy: string;
  previousAssessment?: TriageAssessment;
}

export interface VitalStatus {
  name: string;
  observed: string;
  normalRange: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | 'MISSING';
  severityLevel: RuleSeverity | 'NORMAL' | 'MISSING';
  ruleNotes?: string;
}

/**
 * Evaluates individual vital signs against clinical reference bounds
 */
export function evaluateVitalStatuses(vitals: VitalSigns): VitalStatus[] {
  const result: VitalStatus[] = [];

  // 1. Oxygen Saturation (SpO2)
  if (vitals.oxygenSaturation.isUnavailable || vitals.oxygenSaturation.value === null) {
    result.push({
      name: 'Oxygen Saturation (SpO₂)',
      observed: 'UNAVAILABLE',
      normalRange: '95% – 100%',
      status: 'MISSING',
      severityLevel: 'MISSING',
      ruleNotes: 'Measurement unavailable'
    });
  } else {
    const val = vitals.oxygenSaturation.value;
    if (val < 90) {
      result.push({
        name: 'Oxygen Saturation (SpO₂)',
        observed: `${val}%`,
        normalRange: '95% – 100%',
        status: 'CRITICAL',
        severityLevel: 'EMERGENCY',
        ruleNotes: 'Severe hypoxemia (<90%)'
      });
    } else if (val <= 93) {
      result.push({
        name: 'Oxygen Saturation (SpO₂)',
        observed: `${val}%`,
        normalRange: '95% – 100%',
        status: 'ABNORMAL',
        severityLevel: 'HUMAN_REVIEW_REQUIRED',
        ruleNotes: 'Moderate hypoxemia (90–93%)'
      });
    } else {
      result.push({
        name: 'Oxygen Saturation (SpO₂)',
        observed: `${val}%`,
        normalRange: '95% – 100%',
        status: 'NORMAL',
        severityLevel: 'NORMAL'
      });
    }
  }

  // 2. Blood Pressure
  if (vitals.systolicBP.isUnavailable || vitals.systolicBP.value === null) {
    result.push({
      name: 'Blood Pressure',
      observed: 'UNAVAILABLE',
      normalRange: '100–139 / 60–89 mmHg',
      status: 'MISSING',
      severityLevel: 'MISSING',
      ruleNotes: 'Cuff measurement unavailable'
    });
  } else {
    const sbp = vitals.systolicBP.value;
    const dbp = vitals.diastolicBP.value ?? 80;
    if (sbp >= 190 || dbp >= 120) {
      result.push({
        name: 'Blood Pressure',
        observed: `${sbp}/${dbp} mmHg`,
        normalRange: '100–139 / 60–89 mmHg',
        status: 'CRITICAL',
        severityLevel: 'EMERGENCY',
        ruleNotes: 'Hypertensive crisis (≥190 or ≥120)'
      });
    } else if (sbp < 90) {
      result.push({
        name: 'Blood Pressure',
        observed: `${sbp}/${dbp} mmHg`,
        normalRange: '100–139 / 60–89 mmHg',
        status: 'CRITICAL',
        severityLevel: 'EMERGENCY',
        ruleNotes: 'Severe hypotension / shock (<90 mmHg)'
      });
    } else if (sbp >= 160 || dbp >= 100) {
      result.push({
        name: 'Blood Pressure',
        observed: `${sbp}/${dbp} mmHg`,
        normalRange: '100–139 / 60–89 mmHg',
        status: 'ABNORMAL',
        severityLevel: 'HUMAN_REVIEW_REQUIRED',
        ruleNotes: 'Stage 2 severe hypertension'
      });
    } else if (sbp < 100) {
      result.push({
        name: 'Blood Pressure',
        observed: `${sbp}/${dbp} mmHg`,
        normalRange: '100–139 / 60–89 mmHg',
        status: 'ABNORMAL',
        severityLevel: 'HUMAN_REVIEW_REQUIRED',
        ruleNotes: 'Borderline low systolic pressure'
      });
    } else {
      result.push({
        name: 'Blood Pressure',
        observed: `${sbp}/${dbp} mmHg`,
        normalRange: '100–139 / 60–89 mmHg',
        status: 'NORMAL',
        severityLevel: 'NORMAL'
      });
    }
  }

  // 3. Pulse / Heart Rate
  if (vitals.pulseRate.isUnavailable || vitals.pulseRate.value === null) {
    result.push({
      name: 'Pulse Rate',
      observed: 'UNAVAILABLE',
      normalRange: '60 – 100 bpm',
      status: 'MISSING',
      severityLevel: 'MISSING',
      ruleNotes: 'Pulse palpation unavailable'
    });
  } else {
    const hr = vitals.pulseRate.value;
    if (hr >= 135 || hr <= 40) {
      result.push({
        name: 'Pulse Rate',
        observed: `${hr} bpm`,
        normalRange: '60 – 100 bpm',
        status: 'CRITICAL',
        severityLevel: 'EMERGENCY',
        ruleNotes: 'Extreme tachycardia (≥135) or bradycardia (≤40)'
      });
    } else if (hr >= 105 || hr <= 50) {
      result.push({
        name: 'Pulse Rate',
        observed: `${hr} bpm`,
        normalRange: '60 – 100 bpm',
        status: 'ABNORMAL',
        severityLevel: 'HUMAN_REVIEW_REQUIRED',
        ruleNotes: 'Tachycardia (105–134) or Bradycardia (41–50)'
      });
    } else {
      result.push({
        name: 'Pulse Rate',
        observed: `${hr} bpm`,
        normalRange: '60 – 100 bpm',
        status: 'NORMAL',
        severityLevel: 'NORMAL'
      });
    }
  }

  // 4. Respiratory Rate
  if (vitals.respiratoryRate.isUnavailable || vitals.respiratoryRate.value === null) {
    result.push({
      name: 'Respiratory Rate',
      observed: 'UNAVAILABLE',
      normalRange: '12 – 20 breaths/min',
      status: 'MISSING',
      severityLevel: 'MISSING',
      ruleNotes: 'Rate not observed'
    });
  } else {
    const rr = vitals.respiratoryRate.value;
    if (rr >= 30 || rr <= 8) {
      result.push({
        name: 'Respiratory Rate',
        observed: `${rr} breaths/min`,
        normalRange: '12 – 20 breaths/min',
        status: 'CRITICAL',
        severityLevel: 'EMERGENCY',
        ruleNotes: 'Critical tachypnea (≥30) or bradypnea (≤8)'
      });
    } else if (rr >= 22) {
      result.push({
        name: 'Respiratory Rate',
        observed: `${rr} breaths/min`,
        normalRange: '12 – 20 breaths/min',
        status: 'ABNORMAL',
        severityLevel: 'HUMAN_REVIEW_REQUIRED',
        ruleNotes: 'Tachypnea (22–29 breaths/min)'
      });
    } else {
      result.push({
        name: 'Respiratory Rate',
        observed: `${rr} breaths/min`,
        normalRange: '12 – 20 breaths/min',
        status: 'NORMAL',
        severityLevel: 'NORMAL'
      });
    }
  }

  // 5. Body Temperature (°F)
  if (vitals.temperature.isUnavailable || vitals.temperature.value === null) {
    result.push({
      name: 'Body Temperature',
      observed: 'UNAVAILABLE',
      normalRange: '97.7°F – 99.5°F',
      status: 'MISSING',
      severityLevel: 'MISSING',
      ruleNotes: 'Thermometer reading unavailable'
    });
  } else {
    const rawTemp = vitals.temperature.value;
    const temp = rawTemp < 60 ? Number(((rawTemp * 9) / 5 + 32).toFixed(1)) : rawTemp;
    if (temp >= 103.1) {
      result.push({
        name: 'Body Temperature',
        observed: `${temp}°F`,
        normalRange: '97.7°F – 99.5°F',
        status: 'CRITICAL',
        severityLevel: 'HUMAN_REVIEW_REQUIRED',
        ruleNotes: 'Hyperpyrexia (≥103.1°F)'
      });
    } else if (temp >= 101.0) {
      result.push({
        name: 'Body Temperature',
        observed: `${temp}°F`,
        normalRange: '97.7°F – 99.5°F',
        status: 'ABNORMAL',
        severityLevel: 'HUMAN_REVIEW_REQUIRED',
        ruleNotes: 'High fever (≥101.0°F)'
      });
    } else if (temp <= 95.0) {
      result.push({
        name: 'Body Temperature',
        observed: `${temp}°F`,
        normalRange: '97.7°F – 99.5°F',
        status: 'CRITICAL',
        severityLevel: 'HUMAN_REVIEW_REQUIRED',
        ruleNotes: 'Hypothermia (≤95.0°F)'
      });
    } else {
      result.push({
        name: 'Body Temperature',
        observed: `${temp}°F`,
        normalRange: '97.7°F – 99.5°F',
        status: 'NORMAL',
        severityLevel: 'NORMAL'
      });
    }
  }

  return result;
}

/**
 * Main Deterministic Two-Level Triage Engine Execution
 * Returns TriagePriority ('EMERGENCY' | 'ROUTINE') + AssessmentStatus ('ASSESSED' | 'HUMAN_REVIEW_REQUIRED')
 */
export function evaluateTriage(input: AssessmentInput): TriageAssessment {
  const {
    encounterId,
    patientId,
    chiefComplaint,
    symptoms,
    severity,
    vitalSigns,
    assessedBy,
    previousAssessment
  } = input;

  const triggeredRules: TriggeredRule[] = [];
  const explanations: string[] = [];
  const missingInformation: string[] = [];
  const safetyWarnings: string[] = [];
  const humanReviewReasons: string[] = [];

  const vs = vitalSigns;

  // 1. Audit missing or unavailable vital signs (never assume normal)
  if (vs.systolicBP.isUnavailable || vs.systolicBP.value === null) {
    missingInformation.push('Blood Pressure');
  }
  if (vs.oxygenSaturation.isUnavailable || vs.oxygenSaturation.value === null) {
    missingInformation.push('Oxygen Saturation (SpO₂)');
  }
  if (vs.temperature.isUnavailable || vs.temperature.value === null) {
    missingInformation.push('Body Temperature');
  }
  if (vs.pulseRate.isUnavailable || vs.pulseRate.value === null) {
    missingInformation.push('Pulse Rate');
  }
  if (vs.respiratoryRate.isUnavailable || vs.respiratoryRate.value === null) {
    missingInformation.push('Respiratory Rate');
  }

  // 2. Critical & Borderline Vitals Evaluation
  // SpO2
  if (!vs.oxygenSaturation.isUnavailable && vs.oxygenSaturation.value !== null) {
    const spo2 = vs.oxygenSaturation.value;
    if (spo2 < 90) {
      triggeredRules.push({
        ruleId: 'V-SPO2-EMERGENCY',
        criterion: 'SpO₂ < 90% (Severe hypoxemia)',
        observedFinding: `SpO₂ recorded at ${spo2}%`,
        severity: 'EMERGENCY',
        category: 'Vitals'
      });
      explanations.push(`Critical hypoxemia: SpO₂ is ${spo2}% (<90%). Immediate supplemental oxygen therapy and doctor review required.`);
    } else if (spo2 <= 93) {
      triggeredRules.push({
        ruleId: 'V-SPO2-REVIEW',
        criterion: 'SpO₂ 90–93% (Moderate hypoxemia)',
        observedFinding: `SpO₂ recorded at ${spo2}%`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      });
      const reason = `Moderate hypoxemia: SpO₂ is ${spo2}% (90–93%). Cannot be safely classified as standard Routine without clinical verification.`;
      explanations.push(reason);
      humanReviewReasons.push(reason);
    }
  }

  // Blood Pressure
  if (!vs.systolicBP.isUnavailable && vs.systolicBP.value !== null) {
    const sbp = vs.systolicBP.value;
    const dbp = vs.diastolicBP.value ?? 80;
    if (sbp >= 190 || dbp >= 120) {
      triggeredRules.push({
        ruleId: 'V-BP-EMERGENCY-HIGH',
        criterion: 'Systolic BP ≥ 190 mmHg or Diastolic ≥ 120 mmHg (Hypertensive Crisis)',
        observedFinding: `BP is ${sbp}/${dbp} mmHg`,
        severity: 'EMERGENCY',
        category: 'Vitals'
      });
      explanations.push(`Hypertensive crisis alert: BP ${sbp}/${dbp} mmHg poses immediate cardiovascular risk.`);
    } else if (sbp < 90) {
      triggeredRules.push({
        ruleId: 'V-BP-EMERGENCY-LOW',
        criterion: 'Systolic BP < 90 mmHg (Hypotensive shock danger)',
        observedFinding: `Systolic BP is ${sbp} mmHg`,
        severity: 'EMERGENCY',
        category: 'Vitals'
      });
      explanations.push(`Severe hypotension: SBP ${sbp} mmHg (<90 mmHg) suggests hemodynamic shock.`);
    } else if (sbp >= 160 || dbp >= 100) {
      triggeredRules.push({
        ruleId: 'V-BP-REVIEW-HIGH',
        criterion: 'Systolic BP 160–189 mmHg or Diastolic 100–119 mmHg',
        observedFinding: `BP is ${sbp}/${dbp} mmHg`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      });
      const reason = `Stage 2 severe hypertension: BP ${sbp}/${dbp} mmHg requires clinical evaluation.`;
      explanations.push(reason);
      humanReviewReasons.push(reason);
    } else if (sbp < 100) {
      triggeredRules.push({
        ruleId: 'V-BP-REVIEW-LOW',
        criterion: 'Borderline low Systolic BP (90–99 mmHg)',
        observedFinding: `BP is ${sbp}/${dbp} mmHg`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      });
      const reason = `Borderline low systolic pressure (${sbp} mmHg) requires clinical review.`;
      explanations.push(reason);
      humanReviewReasons.push(reason);
    }
  }

  // Pulse & Respiration
  if (!vs.pulseRate.isUnavailable && vs.pulseRate.value !== null) {
    const hr = vs.pulseRate.value;
    if (hr >= 135 || hr <= 40) {
      triggeredRules.push({
        ruleId: 'V-HR-EMERGENCY',
        criterion: 'Pulse ≥ 135 bpm or ≤ 40 bpm',
        observedFinding: `Pulse is ${hr} bpm`,
        severity: 'EMERGENCY',
        category: 'Vitals'
      });
      explanations.push(`Extreme tachycardia/bradycardia: Heart rate ${hr} bpm requires immediate ECG and stabilization.`);
    } else if (hr >= 105 || hr <= 50) {
      triggeredRules.push({
        ruleId: 'V-HR-REVIEW',
        criterion: 'Pulse 105–134 bpm or 41–50 bpm',
        observedFinding: `Pulse is ${hr} bpm`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      });
      const reason = `Abnormal pulse rate (${hr} bpm) requires clinician verification.`;
      explanations.push(reason);
      humanReviewReasons.push(reason);
    }
  }

  if (!vs.respiratoryRate.isUnavailable && vs.respiratoryRate.value !== null) {
    const rr = vs.respiratoryRate.value;
    if (rr >= 30 || rr <= 8) {
      triggeredRules.push({
        ruleId: 'V-RR-EMERGENCY',
        criterion: 'Respiratory Rate ≥ 30 or ≤ 8 breaths/min',
        observedFinding: `Respiratory rate is ${rr} breaths/min`,
        severity: 'EMERGENCY',
        category: 'Vitals'
      });
      explanations.push(`Critical respiratory compromise: ${rr} breaths/min indicates imminent respiratory exhaustion.`);
    } else if (rr >= 22) {
      triggeredRules.push({
        ruleId: 'V-RR-REVIEW',
        criterion: 'Respiratory Rate 22–29 breaths/min',
        observedFinding: `Respiratory rate is ${rr} breaths/min`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      });
      const reason = `Tachypnea (${rr} breaths/min) requires clinical evaluation.`;
      explanations.push(reason);
      humanReviewReasons.push(reason);
    }
  }

  // Temperature (°F)
  if (!vs.temperature.isUnavailable && vs.temperature.value !== null) {
    const rawTemp = vs.temperature.value;
    const temp = rawTemp < 60 ? Number(((rawTemp * 9) / 5 + 32).toFixed(1)) : rawTemp;
    if (temp >= 103.1) {
      triggeredRules.push({
        ruleId: 'V-TEMP-REVIEW-HIGH',
        criterion: 'Body Temperature ≥ 103.1°F (Hyperpyrexia)',
        observedFinding: `Temperature is ${temp}°F`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      });
      const reason = `Hyperpyrexia (${temp}°F) requires direct clinician review.`;
      explanations.push(reason);
      humanReviewReasons.push(reason);
    } else if (temp >= 101.0) {
      triggeredRules.push({
        ruleId: 'V-TEMP-REVIEW-FEVER',
        criterion: 'High Fever (101.0°F – 103.0°F)',
        observedFinding: `Temperature is ${temp}°F`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      });
      const reason = `High fever (${temp}°F) flagged for clinician review.`;
      explanations.push(reason);
      humanReviewReasons.push(reason);
    } else if (temp <= 95.0) {
      triggeredRules.push({
        ruleId: 'V-TEMP-REVIEW-LOW',
        criterion: 'Body Temperature ≤ 95.0°F (Hypothermia)',
        observedFinding: `Temperature is ${temp}°F`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Vitals'
      });
      const reason = `Hypothermia (${temp}°F) requires warming and clinician review.`;
      explanations.push(reason);
      humanReviewReasons.push(reason);
    }
  }

  // 3. Red-Flag Symptoms & Dangerous Combinations
  const textCorpus = (chiefComplaint + ' ' + symptoms.join(' ')).toLowerCase();
  const hasChestPain =
    textCorpus.includes('chest pain') ||
    textCorpus.includes('angina') ||
    textCorpus.includes('heart pain') ||
    textCorpus.includes('छाती में दर्द') ||
    textCorpus.includes('ਛਾਤੀ ਵਿੱਚ ਦਰਦ');
  const hasSevereBreathing =
    textCorpus.includes('breathless') ||
    textCorpus.includes('dyspnea') ||
    textCorpus.includes('stridor') ||
    textCorpus.includes('shortness of breath') ||
    textCorpus.includes('सांस लेने में तकलीफ') ||
    textCorpus.includes('ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼') ||
    textCorpus.includes('gasping');

  if (hasChestPain) {
    const spo2 = vs.oxygenSaturation.value;
    if (spo2 !== null && spo2 < 94) {
      triggeredRules.push({
        ruleId: 'COMB-CHEST-HYPOXIA',
        criterion: 'Chest pain + SpO₂ < 94% (Suspected ACS / Pulmonary Embolism)',
        observedFinding: `Chest pain reported with SpO₂ at ${spo2}%`,
        severity: 'EMERGENCY',
        category: 'Combination'
      });
      explanations.push(`Dangerous combination: Retrosternal chest discomfort combined with low oxygen saturation (${spo2}%) triggers immediate emergency escalation.`);
    } else if (severity === 'Severe' || textCorpus.includes('radiat') || textCorpus.includes('sweat') || textCorpus.includes('left arm')) {
      triggeredRules.push({
        ruleId: 'SYMP-CHEST-SEVERE',
        criterion: 'Severe radiating chest pain or diaphoresis',
        observedFinding: 'Severe radiating chest pain with diaphoresis',
        severity: 'EMERGENCY',
        category: 'Symptom'
      });
      explanations.push('Immediate acute coronary syndrome protocol indicated due to severe radiating chest pain with diaphoresis.');
    } else {
      triggeredRules.push({
        ruleId: 'SYMP-CHEST-REVIEW',
        criterion: 'Acute chest pain presented',
        observedFinding: 'Chest pain reported',
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'Symptom'
      });
      const reason = 'Acute chest discomfort requires rapid ECG and Medical Officer verification.';
      explanations.push(reason);
      humanReviewReasons.push(reason);
    }
  }

  if (textCorpus.includes('stridor') || (hasSevereBreathing && severity === 'Severe')) {
    triggeredRules.push({
      ruleId: 'SYMP-AIRWAY-EMERGENCY',
      criterion: 'Severe respiratory distress / Audible stridor',
      observedFinding: 'Severe breathlessness / stridor reported',
      severity: 'EMERGENCY',
      category: 'Symptom'
    });
    explanations.push('Emergency airway evaluation required: severe dyspnea and stridor detected.');
  }

  // Critical Red Flags: Convulsions, Altered Mental Status, Snake Bite, Severe Bleeding
  if (
    textCorpus.includes('convulsion') ||
    textCorpus.includes('seizure') ||
    textCorpus.includes('unconscious') ||
    textCorpus.includes('loss of consciousness') ||
    textCorpus.includes('snake bite') ||
    textCorpus.includes('severe bleeding') ||
    textCorpus.includes('head trauma')
  ) {
    triggeredRules.push({
      ruleId: 'SYMP-CRITICAL-RED-FLAG',
      criterion: 'Critical acute presentation (Altered consciousness / Snake bite / Severe hemorrhage)',
      observedFinding: 'High-risk acute symptom detected',
      severity: 'EMERGENCY',
      category: 'Symptom'
    });
    explanations.push('Immediate red-flag clinical condition: requires prompt intervention by Medical Officer.');
  }

  // 4. Missing Data Safeguard
  // Any missing critical vital (SpO2, BP, Pulse, RR) or >= 2 missing vitals requires human review
  const hasMissingCriticalVitals =
    missingInformation.includes('Blood Pressure') ||
    missingInformation.includes('Oxygen Saturation (SpO₂)') ||
    missingInformation.includes('Pulse Rate') ||
    missingInformation.includes('Respiratory Rate') ||
    missingInformation.length >= 2;

  if (hasMissingCriticalVitals) {
    const missingMsg = `Critical vital signs are unavailable (${missingInformation.join(', ')}). Assessment cannot be completed safely as normal Routine without clinician review.`;
    humanReviewReasons.push(missingMsg);
    safetyWarnings.push(missingMsg);

    if (!triggeredRules.some(r => r.severity === 'EMERGENCY')) {
      triggeredRules.push({
        ruleId: 'SAFETY-INCOMPLETE-DATA',
        criterion: 'Critical vital signs unavailable at intake',
        observedFinding: `Missing parameters: ${missingInformation.join(', ')}`,
        severity: 'HUMAN_REVIEW_REQUIRED',
        category: 'IncompleteData'
      });
      explanations.push('Conservative safety safeguard: Missing vital signs prevent unreviewed Routine classification. Direct clinician review required.');
    }
  }

  // 5. Final Two-Level Priority & AssessmentStatus Determination
  const hasEmergencyRule = triggeredRules.some(r => r.severity === 'EMERGENCY');
  const hasHumanReviewRule =
    triggeredRules.some(r => r.severity === 'HUMAN_REVIEW_REQUIRED') ||
    humanReviewReasons.length > 0;

  let suggestedPriority: TriagePriority = hasEmergencyRule ? 'EMERGENCY' : 'ROUTINE';
  let assessmentStatus: AssessmentStatus =
    !hasEmergencyRule && hasHumanReviewRule ? 'HUMAN_REVIEW_REQUIRED' : 'ASSESSED';
  let requiresHumanReview = assessmentStatus === 'HUMAN_REVIEW_REQUIRED' || hasMissingCriticalVitals;

  if (!hasEmergencyRule && !hasHumanReviewRule) {
    explanations.push('All recorded vital signs within standard reference intervals. No emergency red-flag criteria met.');
  }

  // 6. Safety Guardrail: Prevent automatic downgrading of emergency patients
  if (previousAssessment && previousAssessment.priority === 'EMERGENCY' && suggestedPriority !== 'EMERGENCY') {
    suggestedPriority = 'EMERGENCY';
    assessmentStatus = 'ASSESSED';
    safetyWarnings.push('Automatic downgrade blocked: Patient was previously designated EMERGENCY. Downgrade requires explicit registered clinician override.');
    triggeredRules.push({
      ruleId: 'SAFETY-NO-AUTO-DOWNGRADE',
      criterion: 'Preserve existing Emergency status across reassessment cycles',
      observedFinding: 'Previous assessment status was EMERGENCY',
      severity: 'EMERGENCY',
      category: 'IncompleteData'
    });
  }

  const combinedHumanReviewReason =
    humanReviewReasons.length > 0 ? humanReviewReasons.join(' ') : undefined;

  return {
    id: 'ASM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    encounterId,
    patientId,
    version: previousAssessment ? previousAssessment.version + 1 : 1,
    priority: suggestedPriority,
    assessmentStatus,
    triggeredRules,
    explanation: explanations,
    missingInformation,
    requiresHumanReview,
    humanReviewReason: requiresHumanReview ? combinedHumanReviewReason : undefined,
    safetyWarnings,
    protocolId: PROTOCOL_ID,
    protocolVersion: PROTOCOL_VERSION,
    assessedAt: new Date().toISOString(),
    assessedBy
  };
}
