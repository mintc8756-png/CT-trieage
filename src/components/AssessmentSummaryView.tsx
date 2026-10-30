import React from 'react';
import {
  Patient,
  Encounter,
  TriageAssessment
} from '../types/triage';
import { useI18n } from '../i18n';
import {
  Printer,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface AssessmentSummaryViewProps {
  patient: Patient;
  encounter: Encounter;
  assessment: TriageAssessment;
  isOnline: boolean;
  onPrintReceipt: () => void;
  onViewDetails: () => void;
  onReturnToQueue: () => void;
}

export const AssessmentSummaryView: React.FC<AssessmentSummaryViewProps> = ({
  patient,
  encounter,
  assessment,
  isOnline,
  onPrintReceipt,
  onViewDetails,
  onReturnToQueue
}) => {
  const { t, dict } = useI18n();

  const isEmergency = encounter.priority === 'EMERGENCY';
  const isHumanReviewRequired =
    encounter.assessmentStatus === 'HUMAN_REVIEW_REQUIRED' ||
    assessment.requiresHumanReview;

  const genderLabel = dict.gender[patient.gender] || patient.gender;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-10">
      {/* Top Status Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('assessmentSummary.badge')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              {t('assessmentSummary.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('assessmentSummary.subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1 font-mono text-xs">
            <div className="px-3 py-1 rounded bg-slate-100 text-slate-800 font-bold">
              {t('assessmentSummary.receiptNumberLabel')} {encounter.receiptId}
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('assessmentSummary.onlinePendingBadge')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('assessmentSummary.offlineSavedBadge')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Patient & Priority Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient Identity Box */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">{patient.fullName}</span>
              <span className="font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {patient.id}
              </span>
            </div>
            <div className="text-slate-600 font-mono">
              {patient.age} {t('patientDetail.yearsLabel')} · {genderLabel} · {patient.village}
            </div>
            <div className="pt-2 border-t border-slate-200/80 text-slate-700">
              <span className="font-semibold text-slate-500 block text-[11px]">
                {t('patientDetail.chiefComplaintLabel')}
              </span>
              <p className="font-medium text-slate-900 mt-0.5">{encounter.chiefComplaint}</p>
            </div>
          </div>

          {/* Two-Level Priority & Assessment Status Box */}
          <div
            className={`p-4 rounded-lg border space-y-2.5 ${
              isEmergency
                ? 'bg-red-50/80 border-red-300 text-red-950'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {t('assessmentSummary.triageOutcomeLabel')}
              </span>
              <span
                className={`px-3 py-1 rounded-md font-mono text-xs font-extrabold border ${
                  isEmergency
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-emerald-700 text-white border-emerald-800'
                }`}
              >
                {dict.priorities[encounter.priority] || encounter.priority}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/10 text-xs">
              <span className="font-semibold">{t('assessmentSummary.assessmentStateLabel')}</span>
              <span
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border ${
                  isHumanReviewRequired
                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                    : 'bg-white/80 text-slate-800 border-slate-300'
                }`}
              >
                {dict.assessmentStatus[encounter.assessmentStatus] || encounter.assessmentStatus}
              </span>
            </div>

            <p className="text-xs text-slate-700">
              {isEmergency
                ? t('patientDetail.priorityDescEmergency')
                : isHumanReviewRequired
                ? t('patientDetail.priorityDescHumanReview')
                : t('patientDetail.priorityDescRoutine')}
            </p>
          </div>
        </div>

        {/* Human Review Alert Banner (when applicable) */}
        {isHumanReviewRequired && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">{t('assessmentSummary.humanReviewAlertTitle')}</p>
              <p className="text-amber-900">
                {assessment.humanReviewReason || t('assessmentSummary.humanReviewAlertSub')}
              </p>
            </div>
          </div>
        )}

        {/* Triggered Rules */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t('assessmentSummary.triggeredRulesTitle')}
          </h2>
          {assessment.triggeredRules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assessment.triggeredRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md border border-slate-200 bg-slate-50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700 text-[11px]">
                      {rule.ruleId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        rule.severity === 'EMERGENCY'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {dict.priorities[rule.severity] || rule.severity}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900">{rule.criterion}</p>
                  <p className="text-[11px] font-mono text-slate-600">{rule.observedFinding}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">
              {t('assessmentSummary.noRulesTriggered')}
            </p>
          )}
        </div>

        {/* Primary Action Buttons: Print Receipt, View Details, Return to Queue */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReturnToQueue}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('assessmentSummary.returnToQueueBtn')}</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={onViewDetails}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>{t('assessmentSummary.viewDetailsBtn')}</span>
            </button>

            <button
              type="button"
              onClick={onPrintReceipt}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('assessmentSummary.printReceiptBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
