import React, { useState, useMemo } from 'react';
import { Patient, Encounter } from '../types/triage';
import { useI18n } from '../i18n';
import { Search, ArrowUpDown, ChevronRight, AlertTriangle, Printer, Trash2 } from 'lucide-react';

interface QueueViewProps {
  patients: Patient[];
  encounters: Encounter[];
  onSelectPatient: (patientId: string, encounterId: string) => void;
  onPrintReceipt: (patientId: string, encounterId: string) => void;
  onDeletePatient: (patientId: string) => void;
  onNewRegistration: () => void;
}

type QueueFilter =
  | 'ALL'
  | 'EMERGENCY'
  | 'ROUTINE'
  | 'AWAITING_ASSESSMENT'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'PENDING_SYNC';

export const QueueView: React.FC<QueueViewProps> = ({
  patients,
  encounters,
  onSelectPatient,
  onPrintReceipt,
  onDeletePatient
}) => {
  const { t, dict } = useI18n();
  const [filter, setFilter] = useState<QueueFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'URGENCY_FIRST' | 'WAITING_TIME'>('URGENCY_FIRST');
  const [confirmDeletePatientId, setConfirmDeletePatientId] = useState<string | null>(null);

  // Pair encounters with patients
  const pairedData = useMemo(() => {
    const patientMap = new Map<string, Patient>();
    patients.forEach(p => patientMap.set(p.id, p));

    return encounters.map(enc => {
      const patient = patientMap.get(enc.patientId);
      const currentAssessment =
        enc.assessmentHistory.find(a => a.id === enc.currentAssessmentId) ||
        enc.assessmentHistory[enc.assessmentHistory.length - 1];

      const isHumanReview =
        enc.assessmentStatus === 'HUMAN_REVIEW_REQUIRED' ||
        Boolean(currentAssessment?.requiresHumanReview);

      return {
        encounter: enc,
        assessment: currentAssessment,
        isHumanReview,
        patient: patient || {
          id: enc.patientId,
          fullName: t('queue.unknownPatient'),
          age: 0,
          gender: 'Other' as const,
          village: t('queue.unspecifiedVillage'),
          registeredAt: enc.createdAt,
          registeredBy: 'Staff'
        }
      };
    });
  }, [patients, encounters, t]);

  // Aggregate stats (two-level priority + awaiting assessment + human review required)
  const stats = useMemo(() => {
    let emergency = 0;
    let routine = 0;
    let awaitingReview = 0;
    let humanReview = 0;
    let pendingSync = 0;

    pairedData.forEach(({ encounter, isHumanReview }) => {
      const isCompleted = encounter.status === 'Completed';
      if (encounter.priority === 'EMERGENCY' && !isCompleted) emergency++;
      else if (encounter.priority === 'ROUTINE' && !isCompleted) routine++;

      if (
        encounter.status === 'Awaiting Assessment' ||
        encounter.status === 'Reassessment Required'
      ) {
        awaitingReview++;
      }

      if (isHumanReview && !isCompleted) {
        humanReview++;
      }

      if (
        encounter.syncStatus === 'LOCAL_ONLY' ||
        encounter.syncStatus === 'PENDING_SYNC' ||
        encounter.syncStatus === 'Pending Sync' ||
        encounter.syncStatus === 'Saved Locally'
      ) {
        pendingSync++;
      }
    });

    return {
      emergency,
      routine,
      awaitingReview,
      humanReview,
      pendingSync,
      total: pairedData.length
    };
  }, [pairedData]);

  // Filter & Search
  const filteredData = useMemo(() => {
    return pairedData.filter(({ encounter, patient, isHumanReview }) => {
      if (
        filter === 'EMERGENCY' &&
        (encounter.priority !== 'EMERGENCY' || encounter.status === 'Completed')
      ) {
        return false;
      }
      if (
        filter === 'ROUTINE' &&
        (encounter.priority !== 'ROUTINE' || encounter.status === 'Completed')
      ) {
        return false;
      }
      if (
        filter === 'AWAITING_ASSESSMENT' &&
        encounter.status !== 'Awaiting Assessment' &&
        encounter.status !== 'Reassessment Required'
      ) {
        return false;
      }
      if (
        filter === 'HUMAN_REVIEW_REQUIRED' &&
        (!isHumanReview || encounter.status === 'Completed')
      ) {
        return false;
      }
      if (
        filter === 'PENDING_SYNC' &&
        (encounter.syncStatus === 'SYNCED' || encounter.syncStatus === 'Synced')
      ) {
        return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = patient.fullName.toLowerCase().includes(q);
        const matchId = patient.id.toLowerCase().includes(q);
        const matchReceipt = (encounter.receiptId || '').toLowerCase().includes(q);
        const matchVillage = patient.village.toLowerCase().includes(q);
        const matchComplaint = encounter.chiefComplaint.toLowerCase().includes(q);
        const matchSymptoms = encounter.symptoms.some(s => s.toLowerCase().includes(q));
        if (
          !matchName &&
          !matchId &&
          !matchReceipt &&
          !matchVillage &&
          !matchComplaint &&
          !matchSymptoms
        ) {
          return false;
        }
      }

      return true;
    });
  }, [pairedData, filter, searchQuery]);

  // Sorting: Priority first (Emergency -> Routine with Human Review -> Standard Routine), then oldest registration time first
  const sortedData = useMemo(() => {
    const priorityWeight = { EMERGENCY: 1, ROUTINE: 2 };

    return [...filteredData].sort((a, b) => {
      if (sortBy === 'URGENCY_FIRST') {
        const pDiff =
          priorityWeight[a.encounter.priority] - priorityWeight[b.encounter.priority];
        if (pDiff !== 0) return pDiff;

        // Within Routine, surface cases requiring Human Review before standard Assessed cases
        if (a.isHumanReview !== b.isHumanReview) {
          return a.isHumanReview ? -1 : 1;
        }
      }
      // Oldest arrival/registration timestamp first
      return (
        new Date(a.encounter.createdAt).getTime() -
        new Date(b.encounter.createdAt).getTime()
      );
    });
  }, [filteredData, sortBy]);

  return (
    <div className="space-y-6">
      {/* Page Title & Clean Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
            {t('queue.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('queue.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSortBy(s => (s === 'URGENCY_FIRST' ? 'WAITING_TIME' : 'URGENCY_FIRST'))
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              {t('queue.sortLabel')}{' '}
              {sortBy === 'URGENCY_FIRST'
                ? t('queue.sortUrgencyFirst')
                : t('queue.sortWaitingTime')}
            </span>
          </button>
        </div>
      </div>

      {/* Summary Status Cards: Emergency Patients, Routine Patients, Awaiting Assessment, Human Review Required */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Emergency Patients */}
        <div
          onClick={() => setFilter(filter === 'EMERGENCY' ? 'ALL' : 'EMERGENCY')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filter === 'EMERGENCY' ? 'ring-2 ring-red-500' : ''
          } bg-red-50/70 border-red-200`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-red-900 uppercase tracking-wider">
              {t('queue.summaryEmergency')}
            </span>
            <span className="text-red-700 text-xs font-mono">
              {t('queue.summaryEmergencySub')}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-700 tabular-nums">
              {stats.emergency}
            </span>
            <span className="text-xs text-red-600 font-medium">
              {t('queue.patientsUnit')}
            </span>
          </div>
        </div>

        {/* 2. Routine Patients */}
        <div
          onClick={() => setFilter(filter === 'ROUTINE' ? 'ALL' : 'ROUTINE')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filter === 'ROUTINE' ? 'ring-2 ring-emerald-500' : ''
          } bg-emerald-50/70 border-emerald-200`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
              {t('queue.summaryRoutine')}
            </span>
            <span className="text-emerald-700 text-xs font-mono">
              {t('queue.summaryRoutineSub')}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {stats.routine}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {t('queue.patientsUnit')}
            </span>
          </div>
        </div>

        {/* 3. Awaiting Assessment */}
        <div
          onClick={() =>
            setFilter(filter === 'AWAITING_ASSESSMENT' ? 'ALL' : 'AWAITING_ASSESSMENT')
          }
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filter === 'AWAITING_ASSESSMENT' ? 'ring-2 ring-blue-500' : ''
          } bg-white border-slate-200`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t('queue.summaryAwaiting')}
            </span>
            <span className="text-slate-400 text-xs font-mono">
              {t('queue.summaryAwaitingSub')}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-800 tabular-nums">
              {stats.awaitingReview}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {t('queue.ofTotal', { total: stats.total })}
            </span>
          </div>
        </div>

        {/* 4. Human Review Required */}
        <div
          onClick={() =>
            setFilter(filter === 'HUMAN_REVIEW_REQUIRED' ? 'ALL' : 'HUMAN_REVIEW_REQUIRED')
          }
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filter === 'HUMAN_REVIEW_REQUIRED' ? 'ring-2 ring-amber-500' : ''
          } bg-amber-50/70 border-amber-200`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              {t('queue.summaryHumanReview')}
            </span>
            <span className="text-amber-700 text-xs font-mono">
              {t('queue.summaryHumanReviewSub')}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
              {stats.humanReview}
            </span>
            <span className="text-xs text-amber-700 font-medium">
              {t('queue.patientsUnit')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t('queue.filterAll', { count: stats.total })}
          </button>
          <button
            onClick={() => setFilter('EMERGENCY')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'EMERGENCY'
                ? 'bg-red-600 text-white font-semibold'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            {t('queue.filterEmergency', { count: stats.emergency })}
          </button>
          <button
            onClick={() => setFilter('ROUTINE')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'ROUTINE'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            {t('queue.filterRoutine', { count: stats.routine })}
          </button>
          <button
            onClick={() => setFilter('AWAITING_ASSESSMENT')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'AWAITING_ASSESSMENT'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('queue.filterAwaiting', { count: stats.awaitingReview })}
          </button>
          <button
            onClick={() => setFilter('HUMAN_REVIEW_REQUIRED')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'HUMAN_REVIEW_REQUIRED'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            {t('queue.filterHumanReview', { count: stats.humanReview })}
          </button>
          {stats.pendingSync > 0 && (
            <button
              onClick={() => setFilter('PENDING_SYNC')}
              className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'PENDING_SYNC'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t('queue.filterPendingSync', { count: stats.pendingSync })}
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('queue.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-7 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label={t('queue.clearSearch')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Queue: Desktop Table (6 columns) / Mobile Cards */}
      {sortedData.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-base font-semibold text-slate-700">{t('queue.emptyTitle')}</p>
          <p className="text-sm text-slate-500 mt-1">{t('queue.emptySubtext')}</p>
          <button
            onClick={() => {
              setFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium cursor-pointer"
          >
            {t('queue.clearFilters')}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View — 6 Columns: Priority & Status, Patient, Age / Sex, Key Vitals, Care Status, Action */}
          <div className="hidden lg:block bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-52">{t('queue.colPriority')}</th>
                    <th className="py-3.5 px-4 w-60">{t('queue.colPatient')}</th>
                    <th className="py-3.5 px-4 w-32">{t('queue.colAgeSex')}</th>
                    <th className="py-3.5 px-4">{t('queue.colKeyVitals')}</th>
                    <th className="py-3.5 px-4 w-52">{t('queue.colCareStatus')}</th>
                    <th className="py-3.5 px-4 w-44 text-right">{t('queue.colAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedData.map(({ encounter, patient, isHumanReview }) => {
                    const isEmergency = encounter.priority === 'EMERGENCY';
                    const vs = encounter.vitalSigns;

                    const genderShort =
                      dict.gender.short[patient.gender as keyof typeof dict.gender.short] ||
                      patient.gender[0];

                    const localizedCareStatus =
                      dict.careStatus[encounter.status as keyof typeof dict.careStatus] ||
                      encounter.status;

                    return (
                      <tr
                        key={encounter.id}
                        onClick={() => onSelectPatient(patient.id, encounter.id)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          isEmergency ? 'bg-red-50/40' : ''
                        }`}
                      >
                        {/* 1. Priority & Assessment Status */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1.5">
                            {isEmergency ? (
                              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-bold bg-red-100 text-red-800 border border-red-300 shadow-2xs">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                                {t('priorities.EMERGENCY')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                {t('priorities.ROUTINE')}
                              </span>
                            )}
                            {isHumanReview && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded shadow-2xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                {t('priorities.HUMAN_REVIEW')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Patient (Name and ID only, uniform two-line stack) */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                            {patient.fullName}
                          </div>
                          <div className="text-xs sm:text-sm font-mono font-semibold text-slate-600 leading-tight mt-1 tabular-nums">
                            {patient.id}
                          </div>
                        </td>

                        {/* 3. Age / Sex */}
                        <td className="py-4 px-4 align-middle text-slate-800 text-sm sm:text-base font-bold tabular-nums whitespace-nowrap">
                          {patient.age}
                          {t('queue.yearsShort')} / {genderShort}
                        </td>

                        {/* 4. Key Vitals */}
                        <td className="py-4 px-4 align-middle font-mono text-xs sm:text-sm font-semibold tabular-nums">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* SpO2 */}
                            {vs.oxygenSaturation.isUnavailable ||
                            vs.oxygenSaturation.value === null ? (
                              <span className="text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md shadow-2xs">
                                {t('queue.spo2Label')}: {t('queue.naShort')}
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-md border shadow-2xs ${
                                  vs.oxygenSaturation.value < 90
                                    ? 'bg-red-100 text-red-900 border-red-300 font-bold'
                                    : vs.oxygenSaturation.value <= 93
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {t('queue.spo2Label')}: {vs.oxygenSaturation.value}%
                              </span>
                            )}

                            {/* BP */}
                            {vs.systolicBP.isUnavailable || vs.systolicBP.value === null ? (
                              <span className="text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md shadow-2xs">
                                {t('queue.bpLabel')}: {t('queue.naShort')}
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-md border shadow-2xs ${
                                  vs.systolicBP.value >= 190 || vs.systolicBP.value < 90
                                    ? 'bg-red-100 text-red-900 border-red-300 font-bold'
                                    : vs.systolicBP.value >= 160
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {t('queue.bpLabel')}: {vs.systolicBP.value}/
                                {vs.diastolicBP.value ?? '-'} mmHg
                              </span>
                            )}

                            {/* Pulse */}
                            {vs.pulseRate.isUnavailable || vs.pulseRate.value === null ? (
                              <span className="text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md shadow-2xs">
                                {t('queue.pulseLabel')}: {t('queue.naShort')}
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-md border shadow-2xs ${
                                  vs.pulseRate.value >= 135 || vs.pulseRate.value <= 40
                                    ? 'bg-red-100 text-red-900 border-red-300 font-bold'
                                    : vs.pulseRate.value >= 105 || vs.pulseRate.value <= 50
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {t('queue.pulseLabel')}: {vs.pulseRate.value} bpm
                              </span>
                            )}

                            {/* Temp */}
                            {vs.temperature.isUnavailable || vs.temperature.value === null ? (
                              <span className="text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-md shadow-2xs">
                                {t('queue.tempLabel')}: {t('queue.naShort')}
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-md border shadow-2xs ${
                                  vs.temperature.value >= 103.1
                                    ? 'bg-red-100 text-red-900 border-red-300 font-bold'
                                    : vs.temperature.value >= 101.0 || vs.temperature.value <= 95.0
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {t('queue.tempLabel')}: {vs.temperature.value}°F
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Care Status */}
                        <td className="py-4 px-4 align-middle whitespace-nowrap">
                          <span
                            className={`inline-block px-3 py-1 rounded-md text-xs sm:text-sm font-semibold border shadow-2xs ${
                              encounter.status === 'Completed'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : encounter.status === 'Under Clinical Review'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : encounter.status === 'Reassessment Required'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {localizedCareStatus}
                          </span>
                        </td>

                        {/* 6. Action: Print Receipt + Delete + Details */}
                        <td className="py-4 px-4 align-middle text-right whitespace-nowrap">
                          {confirmDeletePatientId === patient.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-end gap-2 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-md"
                            >
                              <span className="text-xs font-semibold text-red-800">
                                {t('queue.confirmDeleteLabel')}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeletePatientId(null);
                                  onDeletePatient(patient.id);
                                }}
                                className="px-2.5 py-1 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded transition-colors cursor-pointer"
                              >
                                {t('queue.confirmDeleteYes')}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeletePatientId(null);
                                }}
                                className="px-2.5 py-1 text-xs font-medium bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer"
                              >
                                {t('queue.cancelDeleteBtn')}
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPrintReceipt(patient.id, encounter.id);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                                title={t('patientDetail.printSlipBtn')}
                              >
                                <Printer className="w-3.5 h-3.5 shrink-0" />
                                <span>{t('queue.printReceiptBtn')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeletePatientId(patient.id);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer"
                                title={t('queue.deletePatientTooltip')}
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span>{t('queue.deletePatientBtn')}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectPatient(patient.id, encounter.id);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              >
                                <span>{t('queue.detailsBtn')}</span>
                                <ChevronRight className="w-4 h-4 shrink-0" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="lg:hidden space-y-3">
            {sortedData.map(({ encounter, patient, isHumanReview }) => {
              const isEmergency = encounter.priority === 'EMERGENCY';
              const vs = encounter.vitalSigns;

              const genderShort =
                dict.gender.short[patient.gender as keyof typeof dict.gender.short] ||
                patient.gender[0];

              const localizedCareStatus =
                dict.careStatus[encounter.status as keyof typeof dict.careStatus] ||
                encounter.status;

              return (
                <div
                  key={encounter.id}
                  onClick={() => onSelectPatient(patient.id, encounter.id)}
                  className={`bg-white rounded-lg border p-4 shadow-xs transition-colors cursor-pointer ${
                    isEmergency ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEmergency ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                          {t('priorities.EMERGENCY')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          {t('priorities.ROUTINE')}
                        </span>
                      )}

                      {isHumanReview && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                          {t('priorities.HUMAN_REVIEW')}
                        </span>
                      )}
                    </div>

                    <span className="text-sm font-bold text-slate-700 tabular-nums">
                      {patient.age}
                      {t('queue.yearsShort')} / {genderShort}
                    </span>
                  </div>

                  {/* Patient Name and ID only */}
                  <div className="mt-2.5">
                    <div className="text-base font-bold text-slate-900 leading-snug">
                      {patient.fullName}
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-600 mt-0.5 tabular-nums">
                      {patient.id}
                    </div>
                  </div>

                  {/* Vitals row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs font-mono font-semibold tabular-nums">
                    <span className="text-slate-500 font-sans">{t('queue.vitalsLabel')}</span>
                    {vs.oxygenSaturation.isUnavailable || vs.oxygenSaturation.value === null ? (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {t('queue.spo2Label')}: {t('queue.naShort')}
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          vs.oxygenSaturation.value < 90
                            ? 'bg-red-100 text-red-900 border-red-300 font-bold'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {t('queue.spo2Label')}: {vs.oxygenSaturation.value}%
                      </span>
                    )}

                    {vs.systolicBP.isUnavailable || vs.systolicBP.value === null ? (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {t('queue.bpLabel')}: {t('queue.naShort')}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                        {t('queue.bpLabel')}: {vs.systolicBP.value}/{vs.diastolicBP.value ?? '-'} mmHg
                      </span>
                    )}

                    {vs.pulseRate.isUnavailable || vs.pulseRate.value === null ? (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {t('queue.pulseLabel')}: {t('queue.naShort')}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                        {t('queue.pulseLabel')}: {vs.pulseRate.value} bpm
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <span className="text-slate-500 text-[11px]">
                      {t('queue.statusPrefix')}{' '}
                      <strong className="text-slate-800">{localizedCareStatus}</strong>
                    </span>
                    {confirmDeletePatientId === patient.id ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-md"
                      >
                        <span className="text-[11px] font-semibold text-red-800">
                          {t('queue.confirmDeleteLabel')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeletePatientId(null);
                            onDeletePatient(patient.id);
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold bg-red-600 text-white hover:bg-red-700 rounded cursor-pointer"
                        >
                          {t('queue.confirmDeleteYes')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeletePatientId(null);
                          }}
                          className="px-2 py-0.5 text-[11px] font-medium bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded cursor-pointer"
                        >
                          {t('queue.cancelDeleteBtn')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrintReceipt(patient.id, encounter.id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>{t('queue.printReceiptBtn')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeletePatientId(patient.id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded cursor-pointer"
                          title={t('queue.deletePatientTooltip')}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('queue.deletePatientBtn')}</span>
                        </button>
                        <span className="text-blue-600 font-semibold flex items-center gap-0.5 ml-1">
                          {t('queue.detailsBtn')} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
