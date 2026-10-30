import React, { useState } from 'react';
import {
  Patient,
  Encounter,
  VitalSigns,
  StaffProfile,
  TriageAssessment
} from '../types/triage';
import { evaluateTriage } from '../services/triageEngine';
import { useI18n } from '../i18n';
import {
  Check,
  ArrowLeft,
  Activity,
  AlertCircle
} from 'lucide-react';

interface RegistrationViewProps {
  currentStaff: StaffProfile;
  onSaveSuccess: (patient: Patient, encounter: Encounter, assessment: TriageAssessment) => void;
  onCancel: () => void;
}

const COMMON_SYMPTOM_TAGS = [
  'Chest Pain',
  'Shortness of Breath',
  'High Fever',
  'Chills & Rigors',
  'Audible Stridor',
  'Severe Dizziness',
  'Repeated Vomiting',
  'Cough',
  'Cold Sweats / Diaphoresis',
  'Left Arm Radiation',
  'Severe Headache',
  'Abdominal Pain',
  'Diarrhea',
  'Snake Bite / Sting',
  'Head Trauma',
  'Seizures / Convulsions',
  'Loss of Consciousness'
];

const MEDICAL_HISTORY_OPTIONS = [
  'Hypertension',
  'Type 2 Diabetes',
  'COPD / Asthma',
  'Coronary Artery Disease',
  'Prior Stroke / TIA',
  'Tuberculosis History',
  'Chronic Kidney Disease'
];

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  currentStaff,
  onSaveSuccess,
  onCancel
}) => {
  const { t, dict } = useI18n();

  // Generate random unique ID
  const [patientId] = useState(() => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PHC-2026-${randomNum}`;
  });

  // Section A — Demographics
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [accompanyingPerson, setAccompanyingPerson] = useState('');

  // Section B — Vital Signs (Placed BEFORE Section C)
  const [sbp, setSbp] = useState<string>('');
  const [dbp, setDbp] = useState<string>('');
  const [sbpUnavailable, setSbpUnavailable] = useState(false);

  const [spo2, setSpo2] = useState<string>('');
  const [spo2Unavailable, setSpo2Unavailable] = useState(false);

  const [temp, setTemp] = useState<string>('');
  const [tempUnavailable, setTempUnavailable] = useState(false);

  const [pulse, setPulse] = useState<string>('');
  const [pulseUnavailable, setPulseUnavailable] = useState(false);

  const [rr, setRr] = useState<string>('');
  const [rrUnavailable, setRrUnavailable] = useState(false);

  // Section C — Medical History & Additional Information (OPTIONAL + Information Unavailable toggle)
  const [sectionCUnavailable, setSectionCUnavailable] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [onset, setOnset] = useState('Sudden (within minutes/hours)');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Moderate');
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Errors & warnings
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCancelModal, setShowCancelModal] = useState(false);

  const toggleSymptom = (tag: string) => {
    setSymptoms((prev) =>
      prev.includes(tag) ? prev.filter((s) => s !== tag) : [...prev, tag]
    );
  };

  const toggleHistory = (item: string) => {
    setMedicalHistory((prev) =>
      prev.includes(item) ? prev.filter((h) => h !== item) : [...prev, item]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Section A required checks
    if (!fullName.trim()) newErrors.fullName = 'registration.errors.fullName';
    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge < 0 || parsedAge > 120) {
      newErrors.age = 'registration.errors.age';
    }
    if (!village.trim()) newErrors.village = 'registration.errors.village';

    // Section B Vitals validation bounds (Strictly enforced)
    if (!sbpUnavailable && sbp) {
      const v = Number(sbp);
      if (isNaN(v) || v < 40 || v > 300) newErrors.sbp = 'registration.errors.sbp';
    }
    if (!sbpUnavailable && dbp) {
      const v = Number(dbp);
      if (isNaN(v) || v < 20 || v > 200) newErrors.dbp = 'registration.errors.dbp';
    }
    if (!spo2Unavailable && spo2) {
      const v = Number(spo2);
      if (isNaN(v) || v < 40 || v > 100) newErrors.spo2 = 'registration.errors.spo2';
    }
    if (!tempUnavailable && temp) {
      const v = Number(temp);
      if (isNaN(v) || v < 30 || v > 44) newErrors.temp = 'registration.errors.temp';
    }
    if (!pulseUnavailable && pulse) {
      const v = Number(pulse);
      if (isNaN(v) || v < 20 || v > 240) newErrors.pulse = 'registration.errors.pulse';
    }
    if (!rrUnavailable && rr) {
      const v = Number(rr);
      if (isNaN(v) || v < 4 || v > 70) newErrors.rr = 'registration.errors.rr';
    }

    // Section C NEVER blocks patient registration (whether empty or marked unavailable)
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAssessAndSave = () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const patientRecord: Patient = {
      id: patientId,
      fullName: fullName.trim(),
      age: parseInt(age, 10),
      gender,
      village: village.trim(),
      phone: phone.trim() || undefined,
      accompanyingPerson: accompanyingPerson.trim() || undefined,
      registeredAt: new Date().toISOString(),
      registeredBy: `${currentStaff.name} (${currentStaff.role})`
    };

    const vitalSignsData: VitalSigns = {
      systolicBP: {
        value: sbpUnavailable || !sbp ? null : Number(sbp),
        unit: 'mmHg',
        isUnavailable: sbpUnavailable,
        unavailableReason: sbpUnavailable ? 'Unmeasurable at intake' : undefined
      },
      diastolicBP: {
        value: sbpUnavailable || !dbp ? null : Number(dbp),
        unit: 'mmHg',
        isUnavailable: sbpUnavailable
      },
      oxygenSaturation: {
        value: spo2Unavailable || !spo2 ? null : Number(spo2),
        unit: '%',
        isUnavailable: spo2Unavailable,
        unavailableReason: spo2Unavailable ? 'Pulse oximeter reading unmeasurable' : undefined
      },
      temperature: {
        value: tempUnavailable || !temp ? null : Number(temp),
        unit: '°C',
        isUnavailable: tempUnavailable
      },
      pulseRate: {
        value: pulseUnavailable || !pulse ? null : Number(pulse),
        unit: 'bpm',
        isUnavailable: pulseUnavailable,
        unavailableReason: pulseUnavailable ? 'Radial pulse impalpable' : undefined
      },
      respiratoryRate: {
        value: rrUnavailable || !rr ? null : Number(rr),
        unit: 'breaths/min',
        isUnavailable: rrUnavailable
      },
      measuredAt: new Date().toISOString(),
      measuredBy: currentStaff.name
    };

    const encounterId = 'ENC-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Respect distinct storage between empty vs marked unavailable for Section C
    const effectiveComplaint = sectionCUnavailable
      ? t('registration.defaults.unavailableComplaint')
      : chiefComplaint.trim() || symptoms.join(', ') || t('registration.defaults.unspecifiedComplaint');

    const effectiveSymptoms = sectionCUnavailable ? [] : symptoms;
    const effectiveHistory = sectionCUnavailable ? [] : medicalHistory;
    const effectiveMedications = sectionCUnavailable ? undefined : currentMedications.trim() || undefined;
    const effectiveAllergies = sectionCUnavailable ? undefined : allergies.trim() || undefined;
    const effectiveNotes = sectionCUnavailable ? undefined : clinicalNotes.trim() || undefined;

    // Run deterministic triage engine
    const assessment = evaluateTriage({
      encounterId,
      patientId,
      patientAge: patientRecord.age,
      chiefComplaint: sectionCUnavailable ? '' : chiefComplaint.trim() || symptoms.join(', '),
      symptoms: effectiveSymptoms,
      severity: sectionCUnavailable ? 'Moderate' : severity,
      vitalSigns: vitalSignsData,
      assessedBy: currentStaff.name
    });

    const encounterRecord: Encounter = {
      id: encounterId,
      patientId,
      chiefComplaint: effectiveComplaint,
      symptoms: effectiveSymptoms,
      duration: sectionCUnavailable ? t('registration.defaults.acuteDuration') : duration.trim() || t('registration.defaults.acuteDuration'),
      onset: sectionCUnavailable ? t('registration.defaults.acuteDuration') : onset,
      severity: sectionCUnavailable ? 'Moderate' : severity,
      medicalHistory: effectiveHistory,
      medicalHistoryUnavailable: sectionCUnavailable,
      currentMedications: effectiveMedications,
      allergies: effectiveAllergies,
      clinicalNotes: effectiveNotes,
      vitalSigns: vitalSignsData,
      status: 'Awaiting Assessment',
      priority: assessment.priority,
      syncStatus: 'Pending Sync',
      currentAssessmentId: assessment.id,
      assessmentHistory: [assessment],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveSuccess(patientRecord, encounterRecord, assessment);
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <button
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('registration.backToQueue')}</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
            {t('registration.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('registration.subtitle')}
          </p>
        </div>
      </div>

      {/* SECTION A: PATIENT INFORMATION (4-column desktop grid, 2-column tablet, 1-column mobile) */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
            {t('registration.sectionA')}
          </h2>
          <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {t('registration.idPrefix')} {patientId}
          </span>
        </div>

        <div className="registration-grid-section-a text-xs">
          {/* Full Name: 2 columns on tablet & desktop */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-2 min-w-0">
            <label className="font-semibold text-slate-800 block">
              {t('registration.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={t('registration.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 ${
                errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.fullName && <p className="text-red-600 text-[11px]">{t(errors.fullName)}</p>}
          </div>

          {/* Age: 1 column */}
          <div className="space-y-1 min-w-0">
            <label className="font-semibold text-slate-800 block">
              {t('registration.age')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder={t('registration.agePlaceholder')}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 ${
                errors.age ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.age && <p className="text-red-600 text-[11px]">{t(errors.age)}</p>}
          </div>

          {/* Gender: 1 column */}
          <div className="space-y-1 min-w-0">
            <label className="font-semibold text-slate-800 block">
              {t('registration.gender')} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-2 px-2 text-xs font-medium rounded-md border transition-colors cursor-pointer truncate ${
                    gender === g
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {dict.gender[g]}
                </button>
              ))}
            </div>
          </div>

          {/* Village / Locality: 1 column on desktop */}
          <div className="space-y-1 min-w-0">
            <label className="font-semibold text-slate-800 block">
              {t('registration.village')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={t('registration.villagePlaceholder')}
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 ${
                errors.village ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            {errors.village && <p className="text-red-600 text-[11px]">{t(errors.village)}</p>}
          </div>

          {/* Mobile Contact: 1 column on desktop */}
          <div className="space-y-1 min-w-0">
            <label className="font-medium text-slate-700 block">
              {t('registration.phone')}
            </label>
            <input
              type="tel"
              placeholder={t('registration.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Accompanying Person: 2 columns on desktop & tablet so the row is balanced without wasted empty columns */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-2 min-w-0">
            <label className="font-medium text-slate-700 block">
              {t('registration.accompanyingPerson')}
            </label>
            <input
              type="text"
              placeholder={t('registration.accompanyingPlaceholder')}
              value={accompanyingPerson}
              onChange={(e) => setAccompanyingPerson(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION B: VITAL SIGNS (3 columns on desktop, 2 on tablet, 1 on mobile) */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
              {t('registration.sectionB')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('registration.sectionBSub')}
            </p>
          </div>
        </div>

        <div className="registration-grid-section-b text-xs">
          {/* Blood Pressure */}
          <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 truncate">{t('registration.bpTitle')}</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={sbpUnavailable}
                  onChange={(e) => setSbpUnavailable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>{t('registration.unavailableCheck')}</span>
              </label>
            </div>
            {!sbpUnavailable ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <input
                  type="number"
                  placeholder={t('registration.sbpPlaceholder')}
                  value={sbp}
                  onChange={(e) => setSbp(e.target.value)}
                  className="min-w-0 flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                />
                <span className="text-slate-400 font-bold shrink-0">/</span>
                <input
                  type="number"
                  placeholder={t('registration.dbpPlaceholder')}
                  value={dbp}
                  onChange={(e) => setDbp(e.target.value)}
                  className="min-w-0 flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                />
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{t('registration.unitMmhg')}</span>
              </div>
            ) : (
              <div className="py-1.5 text-[11px] font-mono text-amber-800 bg-amber-50 p-2 rounded">
                {t('registration.markedUnavailable')}
              </div>
            )}
            {errors.sbp && <p className="text-red-600 text-[11px]">{t(errors.sbp)}</p>}
            {errors.dbp && <p className="text-red-600 text-[11px]">{t(errors.dbp)}</p>}
            <p className="text-[10px] text-slate-400">{t('registration.bpRef')}</p>
          </div>

          {/* Oxygen Saturation (SpO2) */}
          <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 truncate">{t('registration.spo2Title')}</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={spo2Unavailable}
                  onChange={(e) => setSpo2Unavailable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>{t('registration.unavailableCheck')}</span>
              </label>
            </div>
            {!spo2Unavailable ? (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="number"
                  placeholder={t('registration.spo2Placeholder')}
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="min-w-0 flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                />
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{t('registration.unitPercent')}</span>
              </div>
            ) : (
              <div className="py-1.5 text-[11px] font-mono text-amber-800 bg-amber-50 p-2 rounded">
                {t('registration.markedUnavailable')}
              </div>
            )}
            {errors.spo2 && <p className="text-red-600 text-[11px]">{t(errors.spo2)}</p>}
            <p className="text-[10px] text-slate-400">{t('registration.spo2Ref')}</p>
          </div>

          {/* Pulse Rate */}
          <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 truncate">{t('registration.pulseTitle')}</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={pulseUnavailable}
                  onChange={(e) => setPulseUnavailable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>{t('registration.unavailableCheck')}</span>
              </label>
            </div>
            {!pulseUnavailable ? (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="number"
                  placeholder={t('registration.pulsePlaceholder')}
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="min-w-0 flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                />
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{t('registration.unitBpm')}</span>
              </div>
            ) : (
              <div className="py-1.5 text-[11px] font-mono text-amber-800 bg-amber-50 p-2 rounded">
                {t('registration.markedUnavailable')}
              </div>
            )}
            {errors.pulse && <p className="text-red-600 text-[11px]">{t(errors.pulse)}</p>}
            <p className="text-[10px] text-slate-400">{t('registration.pulseRef')}</p>
          </div>

          {/* Respiratory Rate */}
          <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 truncate">{t('registration.rrTitle')}</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={rrUnavailable}
                  onChange={(e) => setRrUnavailable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>{t('registration.unavailableCheck')}</span>
              </label>
            </div>
            {!rrUnavailable ? (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="number"
                  placeholder={t('registration.rrPlaceholder')}
                  value={rr}
                  onChange={(e) => setRr(e.target.value)}
                  className="min-w-0 flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                />
                <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap shrink-0">{t('registration.unitBreaths')}</span>
              </div>
            ) : (
              <div className="py-1.5 text-[11px] font-mono text-amber-800 bg-amber-50 p-2 rounded">
                {t('registration.markedUnavailable')}
              </div>
            )}
            {errors.rr && <p className="text-red-600 text-[11px]">{t(errors.rr)}</p>}
            <p className="text-[10px] text-slate-400">{t('registration.rrRef')}</p>
          </div>

          {/* Body Temperature */}
          <div className="space-y-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-800 truncate">{t('registration.tempTitle')}</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={tempUnavailable}
                  onChange={(e) => setTempUnavailable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>{t('registration.unavailableCheck')}</span>
              </label>
            </div>
            {!tempUnavailable ? (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="number"
                  step="0.1"
                  placeholder={t('registration.tempPlaceholder')}
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="min-w-0 flex-1 px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                />
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{t('registration.unitCelsius')}</span>
              </div>
            ) : (
              <div className="py-1.5 text-[11px] font-mono text-amber-800 bg-amber-50 p-2 rounded">
                {t('registration.markedUnavailable')}
              </div>
            )}
            {errors.temp && <p className="text-red-600 text-[11px]">{t(errors.temp)}</p>}
            <p className="text-[10px] text-slate-400">{t('registration.tempRef')}</p>
          </div>
        </div>
      </div>

      {/* SECTION C: MEDICAL HISTORY & ADDITIONAL INFORMATION (OPTIONAL + Information Unavailable toggle) */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
              {t('registration.sectionC')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('registration.sectionCSub')}
            </p>
          </div>

          {/* Explicit "Information Unavailable" Checkbox/Toggle */}
          <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
            sectionCUnavailable
              ? 'bg-amber-100 text-amber-950 border-amber-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}>
            <input
              type="checkbox"
              checked={sectionCUnavailable}
              onChange={(e) => setSectionCUnavailable(e.target.checked)}
              className="rounded text-amber-600 focus:ring-0"
            />
            <span>{t('registration.infoUnavailableToggle')}</span>
          </label>
        </div>

        {sectionCUnavailable ? (
          /* Clearly display unavailable status while preserving entered state in memory */
          <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">{t('registration.infoUnavailableBannerTitle')}</p>
              <p className="text-amber-900">{t('registration.infoUnavailableBannerDesc')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column (7 cols on desktop): Reported Symptoms, Chief Complaint & Timeline/Severity */}
            <div className="lg:col-span-7 space-y-4">
              {/* Group 1: Reported Symptoms & Chief Complaint */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-3.5">
                {/* Multi-select symptom tags */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-800 block">
                    {t('registration.symptomsLabel')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_SYMPTOM_TAGS.map((tag) => {
                      const active = symptoms.includes(tag);
                      const translatedTag =
                        dict.symptomsList[tag as keyof typeof dict.symptomsList] || tag;
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleSymptom(tag)}
                          className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {active && <Check className="w-3 h-3 text-white shrink-0" />}
                          <span>{translatedTag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chief Complaint Input */}
                <div className="space-y-1.5 pt-3 border-t border-slate-200/80">
                  <label className="text-xs font-semibold text-slate-800 block">
                    {t('registration.chiefComplaintLabel')}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t('registration.chiefComplaintPlaceholder')}
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Group 2: Symptom Onset, Duration & Severity */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/40">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="space-y-1 min-w-0">
                    <label className="font-semibold text-slate-800 block">{t('registration.onsetLabel')}</label>
                    <select
                      value={onset}
                      onChange={(e) => setOnset(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Sudden (within minutes/hours)">{t('registration.onsetSudden')}</option>
                      <option value="Gradual (over several days)">{t('registration.onsetGradual')}</option>
                      <option value="Chronic / Recurrent">{t('registration.onsetChronic')}</option>
                    </select>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <label className="font-semibold text-slate-800 block">{t('registration.durationLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('registration.durationPlaceholder')}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <label className="font-semibold text-slate-800 block">{t('registration.severityLabel')}</label>
                    <div className="flex items-center gap-1.5">
                      {(['Mild', 'Moderate', 'Severe'] as const).map((sev) => (
                        <button
                          type="button"
                          key={sev}
                          onClick={() => setSeverity(sev)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-md border transition-colors cursor-pointer truncate ${
                            severity === sev
                              ? sev === 'Severe'
                                ? 'bg-red-600 text-white border-red-600'
                                : sev === 'Moderate'
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {dict.severity[sev]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols on desktop): Past Medical History, Medications, Allergies & Notes */}
            <div className="lg:col-span-5 p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-3.5 h-full">
              {/* Medical History */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800 block">
                  {t('registration.pastHistoryLabel')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MEDICAL_HISTORY_OPTIONS.map((item) => {
                    const active = medicalHistory.includes(item);
                    const translatedItem =
                      dict.historyList[item as keyof typeof dict.historyList] || item;
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleHistory(item)}
                        className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          active
                            ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-white shrink-0" />}
                        <span>{translatedItem}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Medications, Allergies & Clinical Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 pt-3 border-t border-slate-200/80 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 block">{t('registration.medicationsLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('registration.medicationsPlaceholder')}
                    value={currentMedications}
                    onChange={(e) => setCurrentMedications(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 block">{t('registration.allergiesLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('registration.allergiesPlaceholder')}
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="font-medium text-slate-700 block">{t('registration.clinicalNotesLabel')}</label>
                  <textarea
                    rows={2}
                    placeholder={t('registration.clinicalNotesPlaceholder')}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION D: ACTIONS */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
        >
          {t('registration.cancelBtn')}
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleAssessAndSave}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>{t('registration.submitBtn')}</span>
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">
              {t('registration.discardModalTitle')}
            </h3>
            <p className="text-xs text-slate-600">
              {t('registration.discardModalDesc')}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
              >
                {t('registration.continueEditing')}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer"
              >
                {t('registration.discardAndReturn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
