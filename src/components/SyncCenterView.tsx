import React, { useState } from 'react';
import { Patient, Encounter, TriageAssessment, AuditEvent } from '../types/triage';
import { useI18n } from '../i18n';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  HardDrive
} from 'lucide-react';

interface SyncCenterViewProps {
  isOnline: boolean;
  patients: Patient[];
  encounters: Encounter[];
  assessments: TriageAssessment[];
  auditLogs: AuditEvent[];
  onSyncNow: () => Promise<number>;
  onExportJSON: () => void;
  onResetDemo: () => Promise<void>;
}

export const SyncCenterView: React.FC<SyncCenterViewProps> = ({
  isOnline,
  patients,
  encounters,
  assessments,
  auditLogs,
  onSyncNow,
  onExportJSON,
  onResetDemo
}) => {
  const { t, dict } = useI18n();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const pendingSyncEncounters = encounters.filter(
    e =>
      e.syncStatus === 'LOCAL_ONLY' ||
      e.syncStatus === 'PENDING_SYNC' ||
      e.syncStatus === 'Pending Sync' ||
      e.syncStatus === 'Saved Locally'
  );
  const syncedEncounters = encounters.filter(
    e => e.syncStatus === 'SYNCED' || e.syncStatus === 'Synced'
  );

  const handleTriggerSync = async () => {
    if (!isOnline) {
      setSyncFeedback(t('syncCenter.feedbackOfflineError'));
      setTimeout(() => setSyncFeedback(null), 4000);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const count = await onSyncNow();
      setSyncFeedback(
        count > 0
          ? t('syncCenter.feedbackSyncSuccess', { count })
          : t('syncCenter.feedbackUpToDate')
      );
    } catch {
      setSyncFeedback(t('syncCenter.feedbackSyncError'));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleTriggerReset = async () => {
    await onResetDemo();
    setResetConfirm(false);
    setSyncFeedback(t('syncCenter.feedbackResetSuccess'));
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  return (
    <div className="w-full space-y-5 pb-10">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
          {t('syncCenter.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {t('syncCenter.subtitle')}
        </p>
      </div>

      {/* Connectivity Status & Simulator Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {isOnline ? t('syncCenter.onlineStatusTitle') : t('syncCenter.offlineStatusTitle')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isOnline ? t('syncCenter.onlineStatusDesc') : t('syncCenter.offlineStatusDesc')}
              </p>
            </div>
          </div>

          <div
            role="status"
            aria-live="polite"
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border whitespace-nowrap select-none ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>
              {isOnline ? t('syncCenter.onlineStatusTitle') : t('syncCenter.offlineStatusTitle')}
            </span>
          </div>
        </div>

        {/* Sync Action Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              {t('syncCenter.registrySyncTitle')}
            </span>
            <span className="text-xs text-slate-500">
              {t('syncCenter.registrySyncStats', {
                pending: pendingSyncEncounters.length,
                synced: syncedEncounters.length
              })}
            </span>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-md shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('syncCenter.syncingBtn') : t('syncCenter.syncNowBtn')}</span>
          </button>
        </div>

        {syncFeedback && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* IndexedDB Storage Diagnostics */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2 font-display">
          <HardDrive className="w-4 h-4 text-slate-500" />
          <span>{t('syncCenter.diagnosticsHeader')}</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-400 block text-[11px] font-mono">{t('syncCenter.storePatients')}</span>
            <span className="text-xl font-bold font-mono text-slate-800 tabular-nums">
              {patients.length}
            </span>
            <span className="text-[10px] text-slate-500 block">{t('syncCenter.storePatientsSub')}</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-400 block text-[11px] font-mono">{t('syncCenter.storeEncounters')}</span>
            <span className="text-xl font-bold font-mono text-slate-800 tabular-nums">
              {encounters.length}
            </span>
            <span className="text-[10px] text-slate-500 block">{t('syncCenter.storeEncountersSub')}</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-400 block text-[11px] font-mono">{t('syncCenter.storeAssessments')}</span>
            <span className="text-xl font-bold font-mono text-slate-800 tabular-nums">
              {assessments.length}
            </span>
            <span className="text-[10px] text-slate-500 block">{t('syncCenter.storeAssessmentsSub')}</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <span className="text-slate-400 block text-[11px] font-mono">{t('syncCenter.storeAuditLogs')}</span>
            <span className="text-xl font-bold font-mono text-slate-800 tabular-nums">
              {auditLogs.length}
            </span>
            <span className="text-[10px] text-slate-500 block">{t('syncCenter.storeAuditLogsSub')}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 font-mono space-y-1">
          <p>{t('syncCenter.dbNameLine')}</p>
          <p>{t('syncCenter.storageEngineLine')}</p>
          <p>{t('syncCenter.reconciliationLine')}</p>
        </div>
      </div>

      {/* Record Synchronization Queue Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>{t('syncCenter.queueHeader')}</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {t('syncCenter.totalEncountersCount', { count: encounters.length })}
          </span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase">
                <th className="py-2 px-2">{t('syncCenter.colPatientId')}</th>
                <th className="py-2 px-2">{t('syncCenter.colChiefComplaint')}</th>
                <th className="py-2 px-2">{t('syncCenter.colPriority')}</th>
                <th className="py-2 px-2">{t('syncCenter.colLocalUpdated')}</th>
                <th className="py-2 px-2 text-right">{t('syncCenter.colSyncState')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {encounters.map((enc) => {
                const pat = patients.find(p => p.id === enc.patientId);
                const isSynced = enc.syncStatus === 'SYNCED' || enc.syncStatus === 'Synced';

                return (
                  <tr key={enc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2 align-middle whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-900 leading-snug">
                        {pat?.fullName || t('queue.unknownPatient')}
                      </div>
                      <div className="text-[11px] font-mono font-medium text-slate-500 leading-tight mt-0.5 tabular-nums">
                        {enc.patientId}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700 max-w-xs truncate">
                      {enc.chiefComplaint}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        enc.priority === 'EMERGENCY'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {dict.priorities[enc.priority] || enc.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500">
                      {new Date(enc.updatedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {isSynced ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{dict.syncStatus['SYNCED']}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>{dict.syncStatus[enc.syncStatus] || enc.syncStatus}</span>
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

      {/* Data Management & Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          {t('syncCenter.backupHeader')}
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Export JSON */}
          <button
            onClick={onExportJSON}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('syncCenter.exportJsonBtn')}</span>
          </button>

          {/* Reset Demo Data */}
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-md border border-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('syncCenter.resetDemoBtn')}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-red-600 font-semibold">{t('syncCenter.confirmResetLabel')}</span>
              <button
                onClick={handleTriggerReset}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded cursor-pointer"
              >
                {t('syncCenter.confirmResetYes')}
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              >
                {t('syncCenter.cancelBtn')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
