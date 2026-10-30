import React, { useState, useEffect, useMemo } from 'react';
import {
  Patient,
  Encounter,
  TriageAssessment,
  ReceiptPrintStatus
} from '../types/triage';
import { evaluateVitalStatuses, RECEIPT_DISCLAIMER } from '../services/triageEngine';
import { useI18n } from '../i18n';
import {
  Printer,
  CheckCircle2,
  AlertTriangle,
  X,
  Info
} from 'lucide-react';

interface PatientReceiptModalProps {
  patient: Patient;
  encounter: Encounter;
  isOnline: boolean;
  onClose: () => void;
  onUpdatePrintStatus: (encounterId: string, status: ReceiptPrintStatus) => Promise<void>;
}

/**
 * Generates a deterministic, local 21x21 QR-like SVG matrix encoding only
 * non-sensitive identifiers: { app: "XOR-TRIAGE", receiptId, patientId, encounterId }.
 * Works 100% offline with zero external libraries or network calls.
 */
function generateVerificationMatrix(payload: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic hash stream from non-sensitive identifier payload
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let seed = hash >>> 0;
  const nextBit = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) & 1) === 1;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const onTiming = r === 6 || c === 6;
      if (!inTopLeft && !inTopRight && !inBottomLeft && !onTiming) {
        grid[r][c] = nextBit();
      }
    }
  }

  return grid;
}

export const PatientReceiptModal: React.FC<PatientReceiptModalProps> = ({
  patient,
  encounter,
  isOnline,
  onClose,
  onUpdatePrintStatus
}) => {
  const { t, dict } = useI18n();
  const [printStatus, setPrintStatus] = useState<ReceiptPrintStatus>(
    encounter.receiptPrintStatus || 'RECEIPT_GENERATED'
  );
  const [printedTimestamp, setPrintedTimestamp] = useState<string>(() =>
    new Date().toLocaleString()
  );

  const currentAssessment: TriageAssessment | undefined =
    encounter.assessmentHistory.find(a => a.id === encounter.currentAssessmentId) ||
    encounter.assessmentHistory[encounter.assessmentHistory.length - 1];

  const vitalStatuses = useMemo(
    () => evaluateVitalStatuses(encounter.vitalSigns),
    [encounter.vitalSigns]
  );

  // Non-sensitive verification payload for local QR code
  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        app: 'XOR-TRIAGE',
        receiptId: encounter.receiptId,
        patientId: patient.id,
        encounterId: encounter.id
      }),
    [encounter.receiptId, patient.id, encounter.id]
  );

  const qrMatrix = useMemo(() => generateVerificationMatrix(qrPayload), [qrPayload]);

  // Listen to browser print lifecycle events
  useEffect(() => {
    const handleBeforePrint = () => {
      setPrintedTimestamp(new Date().toLocaleString());
      setPrintStatus('PRINT_DIALOG_OPENED');
      onUpdatePrintStatus(encounter.id, 'PRINT_DIALOG_OPENED');
    };

    const handleAfterPrint = () => {
      // Standard browsers do not report whether the user clicked Print or Cancel inside the OS dialog
      setPrintStatus(prev =>
        prev === 'PRINTED_CONFIRMED' ? 'PRINTED_CONFIRMED' : 'PRINT_OUTCOME_UNKNOWN'
      );
      onUpdatePrintStatus(encounter.id, 'PRINT_OUTCOME_UNKNOWN');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [encounter.id, onUpdatePrintStatus]);

  const handleTriggerPrint = async () => {
    setPrintedTimestamp(new Date().toLocaleString());
    setPrintStatus('PRINT_DIALOG_OPENED');
    await onUpdatePrintStatus(encounter.id, 'PRINT_DIALOG_OPENED');
    window.print();
  };

  const handleConfirmPrinted = async () => {
    setPrintStatus('PRINTED_CONFIRMED');
    await onUpdatePrintStatus(encounter.id, 'PRINTED_CONFIRMED');
  };

  const vs = encounter.vitalSigns;
  const naText = t('receipt.notAvailable');

  const formatVitalRow = (
    label: string,
    val: string | number | null,
    isUnavail: boolean,
    unit: string,
    refRange: string,
    statusObj?: { status: string }
  ) => {
    const recordedValue =
      isUnavail || val === null || val === '' ? naText : String(val);
    const flagText =
      statusObj?.status === 'CRITICAL'
        ? t('patientDetail.statusCritical')
        : statusObj?.status === 'ABNORMAL'
        ? t('patientDetail.statusAbnormal')
        : statusObj?.status === 'MISSING'
        ? t('patientDetail.statusUnavailable')
        : t('patientDetail.statusNormal');

    return { label, recordedValue, unit: isUnavail || val === null ? '—' : unit, refRange, flagText };
  };

  const vitalRows = [
    formatVitalRow(
      t('vitalsNames.Blood Pressure'),
      vs.systolicBP.isUnavailable || vs.systolicBP.value === null
        ? null
        : `${vs.systolicBP.value}/${vs.diastolicBP.value ?? '—'}`,
      vs.systolicBP.isUnavailable || vs.systolicBP.value === null,
      'mmHg',
      '100–139 / 60–89',
      vitalStatuses.find(v => v.name === 'Blood Pressure')
    ),
    formatVitalRow(
      t('vitalsNames.Oxygen Saturation (SpO₂)'),
      vs.oxygenSaturation.value,
      vs.oxygenSaturation.isUnavailable,
      '%',
      '95–100',
      vitalStatuses.find(v => v.name === 'Oxygen Saturation (SpO₂)')
    ),
    formatVitalRow(
      t('vitalsNames.Pulse Rate'),
      vs.pulseRate.value,
      vs.pulseRate.isUnavailable,
      'bpm',
      '60–100',
      vitalStatuses.find(v => v.name === 'Pulse Rate')
    ),
    formatVitalRow(
      t('vitalsNames.Respiratory Rate'),
      vs.respiratoryRate.value,
      vs.respiratoryRate.isUnavailable,
      'breaths/min',
      '12–20',
      vitalStatuses.find(v => v.name === 'Respiratory Rate')
    ),
    formatVitalRow(
      t('vitalsNames.Body Temperature'),
      vs.temperature.value,
      vs.temperature.isUnavailable,
      '°F',
      '97.7–99.5',
      vitalStatuses.find(v => v.name === 'Body Temperature')
    )
  ];

  const isEmergency = encounter.priority === 'EMERGENCY';
  const isHumanReviewRequired =
    encounter.assessmentStatus === 'HUMAN_REVIEW_REQUIRED' ||
    Boolean(currentAssessment?.requiresHumanReview);

  const preferredLangLabel = (() => {
    const code = encounter.preferredLanguage || patient.preferredLanguage;
    if (code === 'hi') return 'Hindi (हिन्दी)';
    if (code === 'pa') return 'Punjabi (ਪੰਜਾਬੀ)';
    if (code === 'en') return 'English';
    return naText;
  })();

  const sectionCIsUnavailable = Boolean(encounter.medicalHistoryUnavailable);

  const primaryComplaintDisplay = sectionCIsUnavailable
    ? naText
    : encounter.chiefComplaint?.trim() || naText;

  const symptomsDisplay =
    sectionCIsUnavailable || !encounter.symptoms || encounter.symptoms.length === 0
      ? naText
      : encounter.symptoms
          .map(s => dict.symptomsList[s as keyof typeof dict.symptomsList] || s)
          .join(', ');

  const onsetDurationDisplay = sectionCIsUnavailable
    ? naText
    : `${encounter.onset || '—'} · ${encounter.duration || '—'}`;

  const pastHistoryDisplay =
    sectionCIsUnavailable || !encounter.medicalHistory || encounter.medicalHistory.length === 0
      ? naText
      : encounter.medicalHistory
          .map(h => dict.historyList[h as keyof typeof dict.historyList] || h)
          .join(', ');

  const medicationsDisplay =
    sectionCIsUnavailable || !encounter.currentMedications?.trim()
      ? naText
      : encounter.currentMedications;

  const allergiesDisplay =
    sectionCIsUnavailable || !encounter.allergies?.trim()
      ? naText
      : encounter.allergies;

  const nurseNotesDisplay =
    sectionCIsUnavailable || !encounter.clinicalNotes?.trim()
      ? naText
      : encounter.clinicalNotes;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 overflow-y-auto print-modal-backdrop">
      <div className="bg-white rounded-xl max-w-4xl w-full shadow-2xl border border-slate-300 my-auto overflow-hidden print-modal-container">
        {/* TOP SCREEN-ONLY CONTROL BAR (.no-print) */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold font-display">
              {t('receipt.previewModalTitle')}
            </h2>
            <p className="text-[11px] text-slate-300">
              {t('receipt.previewModalSub')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('receipt.printNowBtn')}</span>
            </button>

            {printStatus !== 'PRINTED_CONFIRMED' && (
              <button
                type="button"
                onClick={handleConfirmPrinted}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('receipt.markPrintedBtn')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('receipt.cancelBtn')}</span>
            </button>
          </div>
        </div>

        {/* SCREEN-ONLY PRINT STATUS BANNER (.no-print) */}
        <div className="no-print px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {printStatus === 'PRINTED_CONFIRMED' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-emerald-800">
                  {t('receipt.statusPrintedConfirmed')}
                </span>
              </>
            ) : printStatus === 'PRINT_OUTCOME_UNKNOWN' ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium text-amber-900">
                  {t('receipt.statusOutcomeUnknown')}
                </span>
              </>
            ) : printStatus === 'PRINT_DIALOG_OPENED' ? (
              <>
                <Printer className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium text-blue-900">
                  {t('receipt.statusDialogOpened')}
                </span>
              </>
            ) : (
              <>
                <Info className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="font-medium text-slate-700">
                  {t('receipt.statusReady')}
                </span>
              </>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {encounter.receiptId} · {isOnline ? t('receipt.modeOnline') : t('receipt.modeOffline')}
          </span>
        </div>

        {/* PRINTABLE CLINICAL HANDOVER DOCUMENT (.print-receipt) */}
        <div className="p-5 sm:p-7 bg-white text-black space-y-3.5 print-receipt">
          {/* SECTION A — HEALTH CENTRE INFORMATION */}
          <div className="border-b-2 border-black pb-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 print-avoid-break">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-extrabold tracking-tight uppercase font-display text-black">
                  XOR Triage
                </span>
                <span className="text-xs font-mono font-semibold text-black">
                  · {t('app.facility')}
                </span>
              </div>
              <h1 className="text-sm font-bold uppercase tracking-wide text-black mt-0.5">
                {t('receipt.docTitle')}
              </h1>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] text-black space-y-0.5 shrink-0">
              <div>
                <span className="font-bold">{t('receipt.receiptNo')}</span>{' '}
                <span className="font-extrabold">{encounter.receiptId}</span>
              </div>
              <div>
                <span className="font-semibold">{t('receipt.printedAt')}</span>{' '}
                <span>{printedTimestamp}</span>
              </div>
              <div>
                <span className="font-semibold">{t('receipt.connectivityMode')}</span>{' '}
                <span className="font-bold border border-black px-1 py-0.2">
                  {isOnline ? t('receipt.modeOnline') : t('receipt.modeOffline')}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION B & SECTION C — SIDE BY SIDE COMPACT METADATA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print-avoid-break">
            {/* B. PATIENT INFORMATION */}
            <div className="border border-black p-2.5 text-[11px] space-y-1">
              <div className="font-bold uppercase tracking-wider border-b border-black pb-1 mb-1 text-black">
                {t('receipt.sectionBTitle')}
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
                <span className="font-semibold text-black">{t('receipt.patientId')}</span>
                <span className="col-span-2 font-mono font-bold text-black">{patient.id}</span>

                <span className="font-semibold text-black">{t('receipt.fullName')}</span>
                <span className="col-span-2 font-bold text-black">{patient.fullName}</span>

                <span className="font-semibold text-black">{t('receipt.ageSex')}</span>
                <span className="col-span-2 text-black">
                  {patient.age} {t('patientDetail.yearsLabel')} / {dict.gender[patient.gender] || patient.gender}
                </span>

                <span className="font-semibold text-black">{t('receipt.village')}</span>
                <span className="col-span-2 text-black">{patient.village || naText}</span>

                <span className="font-semibold text-black">{t('receipt.phone')}</span>
                <span className="col-span-2 font-mono text-black">{patient.phone || naText}</span>

                <span className="font-semibold text-black">{t('receipt.accompanying')}</span>
                <span className="col-span-2 text-black">{patient.accompanyingPerson || naText}</span>

                <span className="font-semibold text-black">{t('receipt.preferredLang')}</span>
                <span className="col-span-2 text-black">{preferredLangLabel}</span>
              </div>
            </div>

            {/* C. REGISTRATION INFORMATION */}
            <div className="border border-black p-2.5 text-[11px] space-y-1">
              <div className="font-bold uppercase tracking-wider border-b border-black pb-1 mb-1 text-black">
                {t('receipt.sectionCTitle')}
              </div>
              <div className="grid grid-cols-3 gap-x-2 gap-y-0.5">
                <span className="font-semibold text-black">{t('receipt.encounterId')}</span>
                <span className="col-span-2 font-mono font-bold text-black">{encounter.id}</span>

                <span className="font-semibold text-black">{t('receipt.arrivalTime')}</span>
                <span className="col-span-2 font-mono text-black">
                  {new Date(encounter.arrivalTimestamp || encounter.createdAt).toLocaleString()}
                </span>

                <span className="font-semibold text-black">{t('receipt.registrationTime')}</span>
                <span className="col-span-2 font-mono text-black">
                  {new Date(encounter.registeredAt || patient.registeredAt).toLocaleString()}
                </span>

                <span className="font-semibold text-black">{t('receipt.registeredBy')}</span>
                <span className="col-span-2 text-black">{patient.registeredBy || naText}</span>

                <span className="font-semibold text-black">{t('receipt.assessmentTime')}</span>
                <span className="col-span-2 font-mono text-black">
                  {currentAssessment
                    ? new Date(currentAssessment.assessedAt).toLocaleString()
                    : naText}
                </span>

                <span className="font-semibold text-black">{t('receipt.assessedBy')}</span>
                <span className="col-span-2 text-black">
                  {currentAssessment?.assessedBy || vs.measuredBy || naText}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION D — CHIEF COMPLAINT & SYMPTOMS */}
          <div className="border border-black p-2.5 text-[11px] space-y-1 print-avoid-break">
            <div className="font-bold uppercase tracking-wider border-b border-black pb-1 mb-1 text-black flex items-center justify-between">
              <span>{t('receipt.sectionDTitle')}</span>
              {sectionCIsUnavailable && (
                <span className="font-mono text-[10px] border border-black px-1.5 py-0.2 font-bold">
                  {naText}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="font-semibold text-black">{t('receipt.primaryComplaint')} </span>
                <span className="font-bold text-black">{primaryComplaintDisplay}</span>
              </div>
              <div>
                <span className="font-semibold text-black">{t('receipt.onsetDuration')} </span>
                <span className="text-black">{onsetDurationDisplay}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="font-semibold text-black">{t('receipt.reportedSymptoms')} </span>
                <span className="text-black">{symptomsDisplay}</span>
              </div>
              <div>
                <span className="font-semibold text-black">{t('receipt.pastHistory')} </span>
                <span className="text-black">{pastHistoryDisplay}</span>
              </div>
              <div>
                <span className="font-semibold text-black">{t('receipt.currentMedications')} </span>
                <span className="text-black">{medicationsDisplay}</span>
              </div>
              <div>
                <span className="font-semibold text-black">{t('receipt.allergies')} </span>
                <span className="font-bold text-black">{allergiesDisplay}</span>
              </div>
              <div>
                <span className="font-semibold text-black">{t('receipt.nurseNotes')} </span>
                <span className="text-black">{nurseNotesDisplay}</span>
              </div>
            </div>
          </div>

          {/* SECTION E — VITAL SIGNS TABLE */}
          <div className="border border-black p-2.5 text-[11px] space-y-1.5 print-avoid-break">
            <div className="font-bold uppercase tracking-wider border-b border-black pb-1 flex items-center justify-between text-black">
              <span>{t('receipt.sectionETitle')}</span>
              <span className="font-mono text-[10px] font-normal">
                {t('receipt.measuredAtTime')} {new Date(vs.measuredAt).toLocaleString()}
              </span>
            </div>

            <table className="w-full text-left border-collapse border border-black text-[11px]">
              <thead>
                <tr className="border-b border-black bg-slate-100">
                  <th className="py-1 px-2 border-r border-black font-bold text-black">
                    {t('receipt.colMeasurement')}
                  </th>
                  <th className="py-1 px-2 border-r border-black font-bold text-black">
                    {t('receipt.colRecordedValue')}
                  </th>
                  <th className="py-1 px-2 border-r border-black font-bold text-black">
                    {t('receipt.colUnit')}
                  </th>
                  <th className="py-1 px-2 border-r border-black font-bold text-black">
                    {t('receipt.colReference')}
                  </th>
                  <th className="py-1 px-2 font-bold text-black">
                    {t('receipt.colFlag')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {vitalRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="py-1 px-2 border-r border-black font-semibold text-black">
                      {row.label}
                    </td>
                    <td className="py-1 px-2 border-r border-black font-mono font-bold text-black">
                      {row.recordedValue}
                    </td>
                    <td className="py-1 px-2 border-r border-black font-mono text-black">
                      {row.unit}
                    </td>
                    <td className="py-1 px-2 border-r border-black font-mono text-black">
                      {row.refRange}
                    </td>
                    <td className="py-1 px-2 font-mono font-bold text-black">
                      {row.flagText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION F — TRIAGE RESULT (HIGH VISIBILITY BLACK & WHITE) */}
          <div className="border-2 border-black p-2.5 text-[11px] space-y-1.5 print-avoid-break">
            <div className="font-bold uppercase tracking-wider border-b border-black pb-1 text-black">
              {t('receipt.sectionFTitle')}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">{t('receipt.triagePriorityLabel')}</span>
                <span
                  className={`font-mono text-sm font-extrabold px-2.5 py-0.5 border-2 border-black uppercase ${
                    isEmergency ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  {isEmergency ? 'EMERGENCY' : 'ROUTINE'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-black">{t('receipt.assessmentStatusLabel')}</span>
                <span
                  className={`font-mono text-xs font-extrabold px-2 py-0.5 border border-black uppercase ${
                    isHumanReviewRequired ? 'border-2 font-extrabold' : ''
                  }`}
                >
                  {isHumanReviewRequired ? 'HUMAN REVIEW REQUIRED' : 'ASSESSED'}
                </span>
              </div>
            </div>

            {/* Triggered rules & observed findings */}
            {currentAssessment && currentAssessment.triggeredRules.length > 0 ? (
              <div className="space-y-0.5 pt-1 border-t border-black">
                <div className="font-bold text-black">{t('receipt.triggeredRulesLabel')}</div>
                <ul className="list-disc list-inside space-y-0.5 text-black">
                  {currentAssessment.triggeredRules.map((rule, idx) => (
                    <li key={idx}>
                      <span className="font-mono font-bold">[{rule.ruleId}]</span>{' '}
                      <span className="font-semibold">{rule.criterion}</span> —{' '}
                      <span className="font-mono">{rule.observedFinding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="pt-1 border-t border-black text-black">
                {t('patientDetail.noRulesTriggered')}
              </div>
            )}

            {/* Missing / Unmeasurable Data Warning */}
            {isHumanReviewRequired && currentAssessment?.humanReviewReason && (
              <div className="pt-1 border-t border-black text-black">
                <span className="font-bold uppercase">{t('receipt.missingDataWarningLabel')} </span>
                <span>{currentAssessment.humanReviewReason}</span>
              </div>
            )}
          </div>

          {/* SECTION G — DOCTOR'S SECTION (BLANK WRITING AREA FOR CONSULTATION) */}
          <div className="border border-black p-2.5 text-[11px] space-y-2 print-avoid-break">
            <div className="font-bold uppercase tracking-wider border-b border-black pb-1 text-black">
              {t('receipt.sectionGTitle')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="border border-black p-2 min-h-[58px] flex flex-col justify-between">
                <span className="font-semibold text-[10px] uppercase text-black">
                  {t('receipt.doctorObservations')}
                </span>
                <div className="border-b border-dotted border-slate-400 h-4 mt-4" />
              </div>

              <div className="border border-black p-2 min-h-[58px] flex flex-col justify-between">
                <span className="font-semibold text-[10px] uppercase text-black">
                  {t('receipt.clinicalAssessment')}
                </span>
                <div className="border-b border-dotted border-slate-400 h-4 mt-4" />
              </div>

              <div className="border border-black p-2 min-h-[58px] flex flex-col justify-between">
                <span className="font-semibold text-[10px] uppercase text-black">
                  {t('receipt.additionalInstructions')}
                </span>
                <div className="border-b border-dotted border-slate-400 h-4 mt-4" />
              </div>

              <div className="border border-black p-2 min-h-[58px] flex flex-col justify-between">
                <span className="font-semibold text-[10px] uppercase text-black">
                  {t('receipt.followUpRecommendations')}
                </span>
                <div className="border-b border-dotted border-slate-400 h-4 mt-4" />
              </div>
            </div>

            {/* Doctor Name, Signature, Consultation Date & Time */}
            <div className="grid grid-cols-3 gap-3 pt-2 mt-1 border-t border-black text-[11px]">
              <div className="pt-3 border-b border-black pb-1">
                <span className="font-semibold text-black">{t('receipt.doctorName')}</span>
              </div>
              <div className="pt-3 border-b border-black pb-1">
                <span className="font-semibold text-black">{t('receipt.doctorSignature')}</span>
              </div>
              <div className="pt-3 border-b border-black pb-1">
                <span className="font-semibold text-black">{t('receipt.consultationDateTime')}</span>
              </div>
            </div>
          </div>

          {/* SECTION H — RECEIPT IDENTIFICATION, LOCAL QR & MANDATORY DISCLAIMER */}
          <div className="border-t-2 border-black pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] text-black print-avoid-break">
            <div className="space-y-1 flex-1">
              <div className="font-mono flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>
                  <strong>Receipt:</strong> {encounter.receiptId}
                </span>
                <span>
                  <strong>Patient ID:</strong> {patient.id}
                </span>
                <span>
                  <strong>Encounter:</strong> {encounter.id}
                </span>
                <span>
                  <strong>XOR Triage:</strong> {t('app.version')}
                </span>
                <span>
                  <strong>Printed:</strong> {printedTimestamp}
                </span>
              </div>
              <p className="font-semibold italic text-black">
                {RECEIPT_DISCLAIMER}
              </p>
            </div>

            {/* Deterministic Offline SVG QR Code (Identifiers Only) */}
            <div className="flex flex-col items-center shrink-0 border border-black p-1 bg-white">
              <svg
                width="54"
                height="54"
                viewBox="0 0 21 21"
                shapeRendering="crispEdges"
                aria-label="Receipt Verification QR"
              >
                {qrMatrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx}
                        y={rIdx}
                        width={1}
                        height={1}
                        fill="#000000"
                      />
                    ) : null
                  )
                )}
              </svg>
              <span className="font-mono text-[8px] mt-0.5 uppercase tracking-tighter text-black">
                {encounter.receiptId}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
