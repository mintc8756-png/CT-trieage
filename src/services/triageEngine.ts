/**
 * Clinical Triage Engine — Protocol IN-PHC-TRIAGE-v2.4-DEMO
 * Fully transparent, deterministic clinical decision support for Rural Primary Health Centres.
 */

import {
  VitalSigns,
  ClinicalPriority,
  TriggeredRule,
  TriageAssessment
} from '../types/triage';

export const PROTOCOL_ID = 'IN-PHC-TRIAGE';
export const PROTOCOL_VERSION = 'v2.4-DEMO';
export const CLINICAL_DISCLAIMER =
  'This is a decision-support recommendation, not a diagnosis. A qualified clinician must assess the patient.';

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
  severityLevel: ClinicalPriority | 'NORMAL' | 'MISSING';
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
        severityLevel: 'URGENT',
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
        severityLevel: 'URGENT',
        ruleNotes: 'Stage 2 severe hypertension'
      });
    } else if (sbp < 100) {
      result.push({
        name: 'Blood Pressure',
        observed: `${sbp}/${dbp} mmHg`,
        normalRange: '100–139 / 60–89 mmHg',
        status: 'ABNORMAL',
        severityLevel: 'URGENT',
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
        severityLevel: 'URGENT',
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
        severityLevel: 'URGENT',
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

  // 5. Body Temperature
  if (vitals.temperature.isUnavailable || vitals.temperature.value === null) {
    result.push({
      name: 'Body Temperature',
      observed: 'UNAVAILABLE',
      normalRange: '36.5°C – 37.5°C (97.7°F – 99.5°F)',
      status: 'MISSING',
      severityLevel: 'MISSING',
      ruleNotes: 'Thermometer reading unavailable'
    });
  } else {
    const temp = vitals.temperature.value;
    const tempF = (temp * 9 / 5 + 32).toFixed(1);
    if (temp >= 39.5) {
      result.push({
        name: 'Body Temperature',
        observed: `${temp}°C (${tempF}°F)`,
        normalRange: '36.5°C – 37.5°C',
        status: 'CRITICAL',
        severityLevel: 'URGENT',
        ruleNotes: 'Hyperpyrexia (≥39.5°C / 103.1°F)'
      });
    } else if (temp >= 38.3) {
      result.push({
        name: 'Body Temperature',
        observed: `${temp}°C (${tempF}°F)`,
        normalRange: '36.5°C – 37.5°C',
        status: 'ABNORMAL',
        severityLevel: 'URGENT',
        ruleNotes: 'High fever (≥38.3°C / 101.0°F)'
      });
    } else if (temp <= 35.0) {
      result.push({
        name: 'Body Temperature',
        observed: `${temp}°C (${tempF}°F)`,
        normalRange: '36.5°C – 37.5°C',
        status: 'CRITICAL',
        severityLevel: 'URGENT',
        ruleNotes: 'Hypothermia (≤35.0°C / 95.0°F)'
      });
    } else {
      result.push({
        name: 'Body Temperature',
        observed: `${temp}°C (${tempF}°F)`,
        normalRange: '36.5°C – 37.5°C',
        status: 'NORMAL',
        severityLevel: 'NORMAL'
      });
    }
  }

  return result;
}

/**
 * Main Deterministic Triage Engine Execution
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
  let requiresHumanReview = false;
  let humanReviewReason = '';

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

  // 2. Critical Vitals Evaluation
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
        ruleId: 'V-SPO2-URGENT',
        criterion: 'SpO₂ 90–93% (Moderate hypoxemia)',
        observedFinding: `SpO₂ recorded at ${spo2}%`,
        severity: 'URGENT',
        category: 'Vitals'
      });
      explanations.push(`Moderate hypoxemia: SpO₂ is ${spo2}%. Clinical review needed within 30 minutes.`);
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
        ruleId: 'V-BP-URGENT-HIGH',
        criterion: 'Systolic BP 160–189 mmHg or Diastolic 100–119 mmHg',
        observedFinding: `BP is ${sbp}/${dbp} mmHg`,
        severity: 'URGENT',
        category: 'Vitals'
      });
      explanations.push(`Stage 2 severe hypertension: BP ${sbp}/${dbp} mmHg requires medical review.`);
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
      explanations.push(`Extreme tachycardia/bradycardia: Heart rate ${hr} bpm requires urgent ECG and stabilization.`);
    } else if (hr >= 105 || hr <= 50) {
      triggeredRules.push({
        ruleId: 'V-HR-URGENT',
        criterion: 'Pulse 105–134 bpm or 41–50 bpm',
        observedFinding: `Pulse is ${hr} bpm`,
        severity: 'URGENT',
        category: 'Vitals'
      });
      explanations.push(`Abnormal pulse rate: ${hr} bpm warrants medical assessment.`);
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
        ruleId: 'V-RR-URGENT',
        criterion: 'Respiratory Rate 22–29 breaths/min',
        observedFinding: `Respiratory rate is ${rr} breaths/min`,
        severity: 'URGENT',
        category: 'Vitals'
      });
      explanations.push(`Tachypnea: ${rr} breaths/min requires clinical evaluation.`);
    }
  }

  // Temperature
  if (!vs.temperature.isUnavailable && vs.temperature.value !== null) {
    const temp = vs.temperature.value;
    if (temp >= 39.5) {
      triggeredRules.push({
        ruleId: 'V-TEMP-URGENT-HIGH',
        criterion: 'Body Temperature ≥ 39.5°C (103.1°F)',
        observedFinding: `Temperature is ${temp}°C`,
        severity: 'URGENT',
        category: 'Vitals'
      });
      explanations.push(`High fever (Hyperpyrexia): ${temp}°C. Physician review within 30 minutes recommended.`);
    } else if (temp <= 35.0) {
      triggeredRules.push({
        ruleId: 'V-TEMP-URGENT-LOW',
        criterion: 'Body Temperature ≤ 35.0°C (Hypothermia)',
        observedFinding: `Temperature is ${temp}°C`,
        severity: 'URGENT',
        category: 'Vitals'
      });
      explanations.push(`Hypothermia: ${temp}°C requires warming and monitoring.`);
    }
  }

  // 3. Red-Flag Symptoms & Dangerous Combinations
  const textCorpus = (chiefComplaint + ' ' + symptoms.join(' ')).toLowerCase();
  const hasChestPain =
    textCorpus.includes('chest pain') ||
    textCorpus.includes('angina') ||
    textCorpus.includes('heart pain') ||
    textCorpus.includes('छाती में दर्द');
  const hasSevereBreathing =
    textCorpus.includes('breathless') ||
    textCorpus.includes('dyspnea') ||
    textCorpus.includes('stridor') ||
    textCorpus.includes('सांस लेने में तकलीफ') ||
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
        ruleId: 'SYMP-CHEST-URGENT',
        criterion: 'Acute chest pain presented',
        observedFinding: 'Chest pain reported',
        severity: 'URGENT',
        category: 'Symptom'
      });
      explanations.push('Acute chest discomfort requires rapid ECG and Medical Officer assessment.');
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
  // If multiple critical vitals are unavailable, or BP + Pulse are unmeasured
  const criticalVitalsMissing =
    (missingInformation.includes('Blood Pressure') && missingInformation.includes('Pulse Rate')) ||
    missingInformation.length >= 2;

  if (criticalVitalsMissing) {
    requiresHumanReview = true;
    humanReviewReason = `Critical vitals are unavailable (${missingInformation.join(', ')}). Patient cannot be triaged as Routine based on incomplete records.`;
    safetyWarnings.push(humanReviewReason);

    // Apply conservative escalation if no existing Emergency rule was triggered
    if (!triggeredRules.some(r => r.severity === 'EMERGENCY')) {
      triggeredRules.push({
        ruleId: 'SAFETY-INCOMPLETE-DATA',
        criterion: 'Multiple critical vitals unavailable in presenting patient',
        observedFinding: `Missing parameters: ${missingInformation.join(', ')}`,
        severity: 'URGENT',
        category: 'IncompleteData'
      });
      explanations.push('Conservative safety escalation: Missing vital signs prevent routine classification. In-person clinical assessment required.');
    }
  }

  // 5. Final Priority Determination
  let suggestedPriority: ClinicalPriority = 'ROUTINE';
  if (triggeredRules.some(r => r.severity === 'EMERGENCY')) {
    suggestedPriority = 'EMERGENCY';
  } else if (triggeredRules.some(r => r.severity === 'URGENT')) {
    suggestedPriority = 'URGENT';
  } else {
    suggestedPriority = 'ROUTINE';
    explanations.push('All recorded vital signs within standard reference intervals. No red-flag criteria met.');
  }

  // 6. Safety Guardrail: Prevent automatic downgrading of emergency patients
  if (previousAssessment && previousAssessment.priority === 'EMERGENCY' && suggestedPriority !== 'EMERGENCY') {
    suggestedPriority = 'EMERGENCY';
    safetyWarnings.push('Automatic downgrade blocked: Patient was previously designated EMERGENCY. Downgrade requires explicit registered clinician override.');
    triggeredRules.push({
      ruleId: 'SAFETY-NO-AUTO-DOWNGRADE',
      criterion: 'Preserve existing Emergency status across reassessment cycles',
      observedFinding: 'Previous assessment status was EMERGENCY',
      severity: 'EMERGENCY',
      category: 'IncompleteData'
    });
  }

  return {
    id: 'ASM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    encounterId,
    patientId,
    version: previousAssessment ? previousAssessment.version + 1 : 1,
    priority: suggestedPriority,
    triggeredRules,
    explanation: explanations,
    missingInformation,
    requiresHumanReview,
    humanReviewReason: requiresHumanReview ? humanReviewReason : undefined,
    safetyWarnings,
    protocolId: PROTOCOL_ID,
    protocolVersion: PROTOCOL_VERSION,
    assessedAt: new Date().toISOString(),
    assessedBy
  };
}
