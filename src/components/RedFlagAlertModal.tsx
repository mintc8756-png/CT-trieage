import React, { useState, useEffect } from 'react';
import { Patient, TriageAssessment, StaffProfile } from '../types/triage';
import { useI18n } from '../i18n';
import { AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';

interface RedFlagAlertModalProps {
  patient: Patient;
  assessment: TriageAssessment;
  currentStaff: StaffProfile;
  onAcknowledge: (notes: string) => void;
}

export const RedFlagAlertModal: React.FC<RedFlagAlertModalProps> = ({
  patient,
  assessment,
  currentStaff,
  onAcknowledge
}) => {
  const { t, dict } = useI18n();

  const [actionNotes, setActionNotes] = useState(() => t('redFlagModal.defaultActionNote'));

  useEffect(() => {
    setActionNotes(t('redFlagModal.defaultActionNote'));
  }, [t]);

  const genderShort =
    dict.gender.short[patient.gender as keyof typeof dict.gender.short] ||
    patient.gender[0];

  const localizedRole =
    dict.staffRoles[currentStaff.role as keyof typeof dict.staffRoles] ||
    currentStaff.role;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border-2 border-red-500 max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start gap-3.5 border-b border-red-100 pb-4">
          <div className="w-11 h-11 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 font-mono">
                {t('redFlagModal.badge')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {t('redFlagModal.protocolTag')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-red-950 font-display">
              {t('redFlagModal.title')}
            </h2>
            <p className="text-xs text-red-800 mt-0.5">
              {t('redFlagModal.subtitle')}
            </p>
          </div>
        </div>

        {/* Patient Summary Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-900 text-sm">{patient.fullName}</span>
            <span className="text-slate-500 ml-2 font-mono">
              ({patient.age}{t('queue.yearsShort')} / {genderShort})
            </span>
          </div>
          <div className="font-mono text-slate-600">
            {patient.id} · {patient.village}
          </div>
        </div>

        {/* Triggered Emergency Rules */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {t('redFlagModal.triggeredCriteriaHeader')}
          </h3>
          <div className="space-y-1.5">
            {assessment.triggeredRules
              .filter(r => r.severity === 'EMERGENCY')
              .map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2"
                >
                  <span className="font-mono font-bold text-red-700 shrink-0 text-[11px]">
                    [{rule.ruleId}]
                  </span>
                  <div>
                    <p className="font-semibold">{rule.criterion}</p>
                    <p className="text-[11px] text-red-700 mt-0.5 font-mono">
                      {t('redFlagModal.findingPrefix')} {rule.observedFinding}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Explanation points */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
          <span className="font-semibold">{t('redFlagModal.cdsExplanationHeader')}</span>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-950">
            {assessment.explanation.map((exp, i) => (
              <li key={i}>{exp}</li>
            ))}
          </ul>
        </div>

        {/* Clinical Disclaimer */}
        <div className="p-2.5 rounded bg-slate-100 text-[11px] text-slate-600 italic border border-slate-200">
          <strong>{t('redFlagModal.disclaimerPrefix')}</strong> {t('app.disclaimerText')}
        </div>

        {/* Staff Action Notes & Acknowledgment */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-800 block">
            {t('redFlagModal.actionNoteLabel')}
          </label>
          <input
            type="text"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-red-500 font-sans"
          />
          <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {t('redFlagModal.acknowledgedByLabel')} <strong>{currentStaff.name}</strong> ({typeof localizedRole === 'string' ? localizedRole : currentStaff.role})
            </span>
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onAcknowledge(actionNotes)}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{t('redFlagModal.acknowledgeBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
