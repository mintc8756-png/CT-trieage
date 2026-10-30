import React, { useState } from 'react';
import {
  Patient,
  Encounter,
  StaffProfile,
  CareStatus,
  ClinicalPriority,
  VitalSigns,
  AuditEvent
} from '../types/triage';
import { evaluateVitalStatuses } from '../services/triageEngine';
import { useI18n } from '../i18n';
import {
  ArrowLeft,
  Printer,
  History,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Edit3,
  FileText,
  Info,
  Trash2
} from 'lucide-react';

interface PatientDetailViewProps {
  patient: Patient;
  encounter: Encounter;
  currentStaff: StaffProfile;
  auditLogs: AuditEvent[];
  onBack: () => void;
  onOpenReceipt: () => void;
  onDeletePatient: (patientId: string) => void;
  onUpdateStatus: (newStatus: CareStatus) => void;
  onRecordReassessment: (newVitals: VitalSigns, newSymptoms: string[], updatedNotes: string) => void;
  onClinicianOverride: (newPriority: ClinicalPriority, justification: string) => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patient,
  encounter,
  currentStaff,
  auditLogs,
  onBack,
  onOpenReceipt,
  onDeletePatient,
  onUpdateStatus,
  onRecordReassessment,
  onClinicianOverride
}) => {
  const { t, dict } = useI18n();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const currentAssessment =
    encounter.assessmentHistory.find(a => a.id === encounter.currentAssessmentId) ||
    encounter.assessmentHistory[encounter.assessmentHistory.length - 1];

  const vitalStatuses = evaluateVitalStatuses(encounter.vitalSigns);

  // Reassessment modal state
  const [showReassessmentModal, setShowReassessmentModal] = useState(false);
  const [reassessSbp, setReassessSbp] = useState(
    encounter.vitalSigns.systolicBP.value?.toString() || ''
  );
  const [reassessDbp, setReassessDbp] = useState(
    encounter.vitalSigns.diastolicBP.value?.toString() || ''
  );
  const [reassessSbpUnavail, setReassessSbpUnavail] = useState(
    encounter.vitalSigns.systolicBP.isUnavailable
  );
  const [reassessSpo2, setReassessSpo2] = useState(
    encounter.vitalSigns.oxygenSaturation.value?.toString() || ''
  );
  const [reassessSpo2Unavail, setReassessSpo2Unavail] = useState(
    encounter.vitalSigns.oxygenSaturation.isUnavailable
  );
  const [reassessPulse, setReassessPulse] = useState(
    encounter.vitalSigns.pulseRate.value?.toString() || ''
  );
  const [reassessPulseUnavail, setReassessPulseUnavail] = useState(
    encounter.vitalSigns.pulseRate.isUnavailable
  );
  const [reassessRr, setReassessRr] = useState(
    encounter.vitalSigns.respiratoryRate.value?.toString() || ''
  );
  const [reassessRrUnavail, setReassessRrUnavail] = useState(
    encounter.vitalSigns.respiratoryRate.isUnavailable
  );
  const [reassessTemp] = useState(
    encounter.vitalSigns.temperature.value?.toString() || ''
  );
  const [reassessTempUnavail] = useState(
    encounter.vitalSigns.temperature.isUnavailable
  );
  const [reassessNotes, setReassessNotes] = useState('');

  // Clinician override modal state (Two-Level Priority: EMERGENCY | ROUTINE)
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePriority, setOverridePriority] = useState<ClinicalPriority>(
    encounter.priority === 'EMERGENCY' ? 'ROUTINE' : 'EMERGENCY'
  );
  const [overrideJustification, setOverrideJustification] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const isEmergency = encounter.priority === 'EMERGENCY';
  const isHumanReviewRequired =
    encounter.assessmentStatus === 'HUMAN_REVIEW_REQUIRED' ||
    Boolean(currentAssessment?.requiresHumanReview);

  // Handle reassessment submission
  const handleExecuteReassessment = () => {
    const updatedVitals: VitalSigns = {
      systolicBP: {
        value: reassessSbpUnavail || !reassessSbp ? null : Number(reassessSbp),
        unit: 'mmHg',
        isUnavailable: reassessSbpUnavail,
        unavailableReason: reassessSbpUnavail ? 'Unmeasurable' : undefined
      },
      diastolicBP: {
        value: reassessSbpUnavail || !reassessDbp ? null : Number(reassessDbp),
        unit: 'mmHg',
        isUnavailable: reassessSbpUnavail
      },
      oxygenSaturation: {
        value: reassessSpo2Unavail || !reassessSpo2 ? null : Number(reassessSpo2),
        unit: '%',
        isUnavailable: reassessSpo2Unavail,
        unavailableReason: reassessSpo2Unavail ? 'Unmeasurable' : undefined
      },
      temperature: {
        value: reassessTempUnavail || !reassessTemp ? null : Number(reassessTemp),
        unit: '°F',
        isUnavailable: reassessTempUnavail
      },
      pulseRate: {
        value: reassessPulseUnavail || !reassessPulse ? null : Number(reassessPulse),
        unit: 'bpm',
        isUnavailable: reassessPulseUnavail,
        unavailableReason: reassessPulseUnavail ? 'Unpalpable' : undefined
      },
      respiratoryRate: {
        value: reassessRrUnavail || !reassessRr ? null : Number(reassessRr),
        unit: 'breaths/min',
        isUnavailable: reassessRrUnavail
      },
      measuredAt: new Date().toISOString(),
      measuredBy: currentStaff.name
    };

    onRecordReassessment(updatedVitals, encounter.symptoms, reassessNotes);
    setShowReassessmentModal(false);
  };

  // Handle clinician override submission
  const handleExecuteOverride = () => {
    if (!overrideJustification.trim()) {
      setOverrideError(t('patientDetail.justificationRequiredAlert'));
      return;
    }
    setOverrideError(null);
    onClinicianOverride(overridePriority, overrideJustification.trim());
    setShowOverrideModal(false);
  };

  const getPreferredLangLabel = (lang?: string) => {
    if (lang === 'hi') return t('registration.langHindi');
    if (lang === 'pa') return t('registration.langPunjabi');
    if (lang === 'en') return t('registration.langEnglish');
    return null;
  };

  const preferredLangText = getPreferredLangLabel(
    encounter.preferredLanguage || patient.preferredLanguage
  );

  const hasMultipleVersions = encounter.assessmentHistory.length > 1;

  return (
    <div className="w-full space-y-5 pb-10">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('patientDetail.backToQueue')}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Reassessment Action Button */}
          <button
            onClick={() => setShowReassessmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('patientDetail.recordReassessmentBtn')}</span>
          </button>

          {/* Clinician Override Button (Doctor Only) */}
          {currentStaff.roleCategory === 'DOCTOR' ||
          currentStaff.role === 'Medical Officer (Doctor)' ? (
            <button
              onClick={() => {
                setOverrideError(null);
                setOverridePriority(encounter.priority === 'EMERGENCY' ? 'ROUTINE' : 'EMERGENCY');
                setShowOverrideModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('patientDetail.clinicianOverrideBtn')}</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 px-2 py-1">
              {t('auth.doctorOnlyOverrideNotice')}
            </span>
          )}

          {/* Print Patient Receipt / Print Latest Receipt */}
          <button
            onClick={onOpenReceipt}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {hasMultipleVersions
                ? t('patientDetail.printLatestReceiptBtn')
                : t('patientDetail.printSlipBtn')}
            </span>
          </button>

          {/* Delete Patient Action */}
          {confirmingDelete ? (
            <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
              <span className="text-xs font-semibold text-red-800">
                {t('patientDetail.confirmDeleteLabel')}
              </span>
              <button
                type="button"
                onClick={() => onDeletePatient(patient.id)}
                className="px-2.5 py-1 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded transition-colors cursor-pointer"
              >
                {t('patientDetail.confirmDeleteYes')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="px-2.5 py-1 text-xs font-medium bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
              >
                {t('patientDetail.cancelDeleteBtn')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('patientDetail.deletePatientBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                {patient.fullName}
              </h1>
              <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {patient.id}
              </span>
              {encounter.receiptId && (
                <span className="font-mono text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  {encounter.receiptId}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
              <span>
                {patient.age} {t('patientDetail.yearsLabel')}
              </span>
              <span>·</span>
              <span>{dict.gender[patient.gender] || patient.gender}</span>
              <span>·</span>
              <span className="font-sans">{patient.village}</span>
              {patient.phone && (
                <>
                  <span>·</span>
                  <span>
                    {t('patientDetail.phonePrefix')} {patient.phone}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Priority, Assessment Status & Care Status Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Priority Badge (Two-Level: EMERGENCY or ROUTINE) */}
            {isEmergency ? (
              <div className="px-3 py-1.5 bg-red-100 text-red-800 border border-red-300 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span>{t('priorities.EMERGENCY')}</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>{t('priorities.ROUTINE')}</span>
              </div>
            )}

            {/* Separate Assessment Status Badge when HUMAN_REVIEW_REQUIRED */}
            {isHumanReviewRequired && (
              <div className="px-2.5 py-1.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{t('priorities.HUMAN_REVIEW')}</span>
              </div>
            )}

            {/* Care Status Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs">
              <span className="text-slate-500 font-medium">{t('patientDetail.careStatusLabel')}</span>
              <select
                value={encounter.status}
                onChange={(e) => onUpdateStatus(e.target.value as CareStatus)}
                className="bg-transparent font-semibold text-slate-800 border-none focus:outline-none cursor-pointer"
              >
                <option value="Awaiting Assessment">{dict.careStatus['Awaiting Assessment']}</option>
                <option value="Under Clinical Review">{dict.careStatus['Under Clinical Review']}</option>
                <option value="Reassessment Required">{dict.careStatus['Reassessment Required']}</option>
                <option value="Completed">{dict.careStatus['Completed']}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Legacy Migration Notice if migrated from removed Urgent priority */}
        {currentAssessment?.legacyPriorityFlag && (
          <div className="bg-amber-50 border border-amber-300 rounded-md p-3 text-xs text-amber-950 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{t('patientDetail.legacyUrgentNotice')}</p>
              <p className="text-amber-800 mt-0.5">{currentAssessment.legacyPriorityFlag}</p>
            </div>
          </div>
        )}

        {/* Override banner if applicable */}
        {currentAssessment?.isOverridden && currentAssessment.overrideDetails && (
          <div className="bg-amber-50 border border-amber-300 rounded-md p-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>{t('patientDetail.overrideBannerTitle')}</span>
            </div>
            <p className="mt-1 text-amber-950 font-sans">
              {t('patientDetail.overrideOriginal')}{' '}
              <strong className="font-mono">
                {dict.priorities[currentAssessment.overrideDetails.originalPriority] ||
                  currentAssessment.overrideDetails.originalPriority}
              </strong>{' '}
              ➔ {t('patientDetail.overrideNew')}{' '}
              <strong className="font-mono">
                {dict.priorities[currentAssessment.overrideDetails.overriddenPriority] ||
                  currentAssessment.overrideDetails.overriddenPriority}
              </strong>
            </p>
            <p className="mt-0.5 text-[11px] text-amber-800 italic">
              "{t('patientDetail.overrideJustificationPrefix')}{' '}
              {currentAssessment.overrideDetails.justification}" —{' '}
              {currentAssessment.overrideDetails.clinicianName}
            </p>
          </div>
        )}

        {/* Accompanying & Registration metadata */}
        <div
          className={`grid grid-cols-1 ${
            preferredLangText ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
          } gap-3 text-xs text-slate-600 pt-1`}
        >
          <div>
            <span className="text-slate-400 block text-[11px]">
              {t('patientDetail.accompanyingPerson')}
            </span>
            <span className="font-medium text-slate-800">
              {patient.accompanyingPerson || t('patientDetail.noneSelf')}
            </span>
          </div>
          {preferredLangText && (
            <div>
              <span className="text-slate-400 block text-[11px]">
                {t('patientDetail.preferredLangLabel')}
              </span>
              <span className="font-medium text-slate-800">{preferredLangText}</span>
            </div>
          )}
          <div>
            <span className="text-slate-400 block text-[11px]">
              {t('patientDetail.registeredBy')}
            </span>
            <span className="font-medium text-slate-800">{patient.registeredBy}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">
              {t('patientDetail.intakeTimestamp')}
            </span>
            <span className="font-mono text-slate-800">
              {new Date(patient.registeredAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left Column = Presentation & Vitals, Right Column = CDS Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Presentation & Recorded Vitals */}
        <div className="space-y-6">
          {/* Clinical Presentation Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              {t('patientDetail.presentationHeader')}
            </h2>

            {encounter.medicalHistoryUnavailable && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{t('patientDetail.historyUnavailableNotice')}</span>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">
                  {t('patientDetail.chiefComplaintLabel')}
                </span>
                <p className="font-bold text-slate-900 text-sm">{encounter.chiefComplaint}</p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">
                  {t('patientDetail.associatedSymptomsLabel')}
                </span>
                {encounter.symptoms.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {encounter.symptoms.map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium"
                      >
                        {dict.symptomsList[s as keyof typeof dict.symptomsList] || s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic mt-0.5">
                    {t('patientDetail.noSymptomsRecorded')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px]">
                    {t('patientDetail.onsetLabel')}
                  </span>
                  <p className="font-medium text-slate-800">{encounter.onset}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">
                    {t('patientDetail.durationLabel')}
                  </span>
                  <p className="font-medium text-slate-800">{encounter.duration}</p>
                </div>
              </div>

              {encounter.medicalHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-semibold text-[11px] block">
                    {t('patientDetail.pastHistoryLabel')}
                  </span>
                  <p className="text-slate-800 mt-0.5">
                    {encounter.medicalHistory
                      .map(h => dict.historyList[h as keyof typeof dict.historyList] || h)
                      .join(', ')}
                  </p>
                </div>
              )}

              {encounter.currentMedications && (
                <div>
                  <span className="text-slate-500 font-semibold text-[11px] block">
                    {t('patientDetail.medicationsLabel')}
                  </span>
                  <p className="text-slate-800 mt-0.5">{encounter.currentMedications}</p>
                </div>
              )}

              {encounter.allergies && (
                <div>
                  <span className="text-slate-500 font-semibold text-[11px] block text-red-600">
                    {t('patientDetail.allergiesLabel')}
                  </span>
                  <p className="text-red-700 mt-0.5 font-medium">{encounter.allergies}</p>
                </div>
              )}

              {encounter.clinicalNotes && (
                <div className="pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded text-slate-700">
                  <span className="text-slate-500 font-semibold text-[11px] block">
                    {t('patientDetail.clinicalNotesLabel')}
                  </span>
                  <p className="mt-0.5 italic">{encounter.clinicalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vital Signs Analysis Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('patientDetail.vitalsHeader')}
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">
                {t('patientDetail.assessedAtPrefix')}{' '}
                {new Date(encounter.vitalSigns.measuredAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase">
                    <th className="py-2 px-2">{t('patientDetail.colParameter')}</th>
                    <th className="py-2 px-2">{t('patientDetail.colObserved')}</th>
                    <th className="py-2 px-2">{t('patientDetail.colRefRange')}</th>
                    <th className="py-2 px-2 text-right">{t('patientDetail.colStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vitalStatuses.map((v, i) => {
                    const translatedName =
                      dict.vitalsNames[v.name as keyof typeof dict.vitalsNames] || v.name;
                    const translatedNote = v.ruleNotes
                      ? dict.vitalsNotes[v.ruleNotes as keyof typeof dict.vitalsNotes] ||
                        v.ruleNotes
                      : undefined;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-2 font-medium text-slate-800">
                          {translatedName}
                          {translatedNote && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {translatedNote}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 font-mono font-semibold tabular-nums text-slate-900">
                          {v.observed === 'UNAVAILABLE'
                            ? t('patientDetail.statusUnavailable')
                            : v.observed}
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-500 tabular-nums">
                          {v.normalRange}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {v.status === 'CRITICAL' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                              {t('patientDetail.statusCritical')}
                            </span>
                          ) : v.status === 'ABNORMAL' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                              {t('patientDetail.statusAbnormal')}
                            </span>
                          ) : v.status === 'MISSING' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-amber-900 border border-amber-300">
                              {t('patientDetail.statusUnavailable')}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {t('patientDetail.statusNormal')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Decision Support Report (CDS) */}
        <div className="space-y-6">
          {/* Active Triage Recommendation Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                  {t('patientDetail.cdsHeader')}
                </h2>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {t('patientDetail.protocolPrefix')} {currentAssessment?.protocolId} (
                  {currentAssessment?.protocolVersion}) · {t('patientDetail.versionPrefix')}
                  {currentAssessment?.version}
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {currentAssessment?.id}
              </span>
            </div>

            {/* Recommendation Priority Box */}
            <div
              className={`p-4 rounded-lg border ${
                isEmergency
                  ? 'bg-red-50/80 border-red-300 text-red-950'
                  : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight uppercase">
                    {t('patientDetail.recommendedPriority')}
                  </span>
                  <span className="font-mono font-bold text-base">
                    {dict.priorities[encounter.priority] || encounter.priority}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isHumanReviewRequired
                      ? 'bg-amber-100 text-amber-950 border-amber-400'
                      : 'bg-white/80 text-slate-700 border-slate-300'
                  }`}
                >
                  {dict.assessmentStatus[encounter.assessmentStatus] ||
                    encounter.assessmentStatus}
                </span>
              </div>
              <p className="text-xs mt-1.5 text-slate-700">
                {isEmergency
                  ? t('patientDetail.priorityDescEmergency')
                  : isHumanReviewRequired
                  ? t('patientDetail.priorityDescHumanReview')
                  : t('patientDetail.priorityDescRoutine')}
              </p>
            </div>

            {/* Deterministic Triggered Rules */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('patientDetail.ruleTracesHeader', {
                  count: currentAssessment?.triggeredRules.length || 0
                })}
              </h3>
              {currentAssessment && currentAssessment.triggeredRules.length > 0 ? (
                <div className="space-y-2">
                  {currentAssessment.triggeredRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md border text-xs bg-slate-50 border-slate-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-blue-700">
                          {rule.ruleId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            rule.severity === 'EMERGENCY'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {dict.priorities[rule.severity] || rule.severity}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 mt-1">{rule.criterion}</p>
                      <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                        {t('patientDetail.observedFindingPrefix')} {rule.observedFinding}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded">
                  {t('patientDetail.noRulesTriggered')}
                </p>
              )}
            </div>

            {/* Plain-Language Explanations */}
            {currentAssessment && currentAssessment.explanation.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  {t('patientDetail.engineRationaleHeader')}
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {currentAssessment.explanation.map((exp, i) => (
                    <li key={i}>{exp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Human Review / Missing Data Warnings */}
            {isHumanReviewRequired && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>{t('patientDetail.humanReviewBannerTitle')}</span>
                </div>
                <p>{currentAssessment?.humanReviewReason}</p>
              </div>
            )}

            {/* Red-Flag Acknowledgment Trace */}
            {currentAssessment?.acknowledgedAt && (
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {t('patientDetail.redFlagAckTitle')}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {t('patientDetail.byPrefix')} {currentAssessment.acknowledgedBy} ·{' '}
                    {new Date(currentAssessment.acknowledgedAt).toLocaleString()}
                  </p>
                  {currentAssessment.acknowledgmentNotes && (
                    <p className="text-[11px] text-slate-600 italic mt-0.5">
                      {t('patientDetail.notesPrefix')} "{currentAssessment.acknowledgmentNotes}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Clinical Disclaimer */}
            <div className="p-2.5 rounded bg-slate-50 text-[11px] text-slate-500 italic border border-slate-200">
              <strong>{t('app.disclaimerLabel')}</strong> {t('app.disclaimerText')}
            </div>
          </div>

          {/* Assessment Longitudinal History (v1, v2...) */}
          {encounter.assessmentHistory.length > 1 && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>
                  {t('patientDetail.revisionTimelineHeader', {
                    count: encounter.assessmentHistory.length
                  })}
                </span>
              </h2>

              <div className="space-y-3">
                {encounter.assessmentHistory.map((asm) => (
                  <div
                    key={asm.id}
                    className="p-3 rounded-md border border-slate-200 bg-slate-50/50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">
                        {t('patientDetail.versionLabel', {
                          version: asm.version,
                          priority: dict.priorities[asm.priority] || asm.priority
                        })}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(asm.assessedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      {t('patientDetail.assessedByPrefix')} {asm.assessedBy}
                    </p>
                    <p className="text-slate-700 text-xs italic">{asm.explanation[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Immutable Encounter Audit Trail */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>{t('patientDetail.auditLogHeader')}</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            {t('patientDetail.recordedEventsCount', {
              count: auditLogs.filter(a => a.encounterId === encounter.id).length
            })}
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs
            .filter(a => a.encounterId === encounter.id)
            .map((ev) => (
              <div
                key={ev.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{ev.action}</span>
                    <span className="text-[11px] text-slate-500 font-mono">[{ev.id}]</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 text-xs">{ev.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-medium text-slate-800 block text-[11px]">
                    {ev.actor}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* REASSESSMENT MODAL */}
      {showReassessmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {t('patientDetail.reassessModalTitle', { name: patient.fullName })}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('patientDetail.reassessModalSub')}
                </p>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                {t('patientDetail.newVersionBadge', {
                  version: encounter.assessmentHistory.length + 1
                })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* SpO2 */}
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    {t('queue.spo2Label')} ({t('registration.unitPercent')})
                  </label>
                  <label className="text-[11px] flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reassessSpo2Unavail}
                      onChange={(e) => setReassessSpo2Unavail(e.target.checked)}
                    />
                    <span>{t('patientDetail.unavailShort')}</span>
                  </label>
                </div>
                {!reassessSpo2Unavail ? (
                  <input
                    type="number"
                    value={reassessSpo2}
                    onChange={(e) => setReassessSpo2(e.target.value)}
                    placeholder={t('registration.spo2Placeholder')}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                  />
                ) : (
                  <p className="text-[11px] font-mono text-amber-800 bg-amber-50 p-1 rounded">
                    {t('patientDetail.statusUnavailable')}
                  </p>
                )}
              </div>

              {/* Blood Pressure */}
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">{t('registration.bpTitle')}</label>
                  <label className="text-[11px] flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reassessSbpUnavail}
                      onChange={(e) => setReassessSbpUnavail(e.target.checked)}
                    />
                    <span>{t('patientDetail.unavailShort')}</span>
                  </label>
                </div>
                {!reassessSbpUnavail ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={reassessSbp}
                      onChange={(e) => setReassessSbp(e.target.value)}
                      placeholder="SBP"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                    />
                    <span>/</span>
                    <input
                      type="number"
                      value={reassessDbp}
                      onChange={(e) => setReassessDbp(e.target.value)}
                      placeholder="DBP"
                      className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-amber-800 bg-amber-50 p-1 rounded">
                    {t('patientDetail.statusUnavailable')}
                  </p>
                )}
              </div>

              {/* Pulse */}
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    {t('queue.pulseLabel')} ({t('registration.unitBpm')})
                  </label>
                  <label className="text-[11px] flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reassessPulseUnavail}
                      onChange={(e) => setReassessPulseUnavail(e.target.checked)}
                    />
                    <span>{t('patientDetail.unavailShort')}</span>
                  </label>
                </div>
                {!reassessPulseUnavail ? (
                  <input
                    type="number"
                    value={reassessPulse}
                    onChange={(e) => setReassessPulse(e.target.value)}
                    placeholder={t('registration.pulsePlaceholder')}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                  />
                ) : (
                  <p className="text-[11px] font-mono text-amber-800 bg-amber-50 p-1 rounded">
                    {t('patientDetail.statusUnavailable')}
                  </p>
                )}
              </div>

              {/* Respiratory Rate */}
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">{t('registration.rrTitle')}</label>
                  <label className="text-[11px] flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reassessRrUnavail}
                      onChange={(e) => setReassessRrUnavail(e.target.checked)}
                    />
                    <span>{t('patientDetail.unavailShort')}</span>
                  </label>
                </div>
                {!reassessRrUnavail ? (
                  <input
                    type="number"
                    value={reassessRr}
                    onChange={(e) => setReassessRr(e.target.value)}
                    placeholder={t('registration.rrPlaceholder')}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                  />
                ) : (
                  <p className="text-[11px] font-mono text-amber-800 bg-amber-50 p-1 rounded">
                    {t('patientDetail.statusUnavailable')}
                  </p>
                )}
              </div>
            </div>

            {/* Reassessment Reason Notes */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-800">
                {t('patientDetail.reassessNotesLabel')}
              </label>
              <textarea
                rows={2}
                value={reassessNotes}
                onChange={(e) => setReassessNotes(e.target.value)}
                placeholder={t('patientDetail.reassessNotesPlaceholder')}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-xs"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReassessmentModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
              >
                {t('patientDetail.cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleExecuteReassessment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t('patientDetail.reassessSubmitBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLINICIAN OVERRIDE MODAL (Two-Level Priority: EMERGENCY | ROUTINE) */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>{t('patientDetail.overrideModalTitle')}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('patientDetail.overrideModalSub')}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  {t('patientDetail.targetPriorityLabel')}
                </label>
                <div className="flex items-center gap-2">
                  {(['EMERGENCY', 'ROUTINE'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setOverridePriority(p)}
                      className={`flex-1 py-2 px-3 rounded-md font-bold text-xs border transition-colors cursor-pointer ${
                        overridePriority === p
                          ? p === 'EMERGENCY'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dict.priorities[p] || p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block">
                  {t('patientDetail.justificationLabel')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideJustification}
                  onChange={(e) => {
                    setOverrideJustification(e.target.value);
                    if (overrideError) setOverrideError(null);
                  }}
                  placeholder={t('patientDetail.justificationPlaceholder')}
                  className={`w-full px-3 py-2 border rounded-md bg-white text-xs focus:ring-1 focus:ring-blue-500 ${
                    overrideError ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                />
                {overrideError && (
                  <p className="text-[11px] text-red-600 font-medium">{overrideError}</p>
                )}
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <strong>{t('patientDetail.clinicianSignatureLabel')}</strong> {currentStaff.name} (
                {dict.staffRoles[currentStaff.role] || currentStaff.role})
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
              >
                {t('patientDetail.cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleExecuteOverride}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {t('patientDetail.overrideSubmitBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
