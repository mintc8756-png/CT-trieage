import React, { useState, useMemo } from 'react';
import { Patient, Encounter } from '../types/triage';
import { useI18n } from '../i18n';
import { Search, ArrowUpDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface QueueViewProps {
  patients: Patient[];
  encounters: Encounter[];
  onSelectPatient: (patientId: string, encounterId: string) => void;
  onNewRegistration: () => void;
}

type PriorityFilter = 'ALL' | 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'PENDING_SYNC';

export const QueueView: React.FC<QueueViewProps> = ({
  patients,
  encounters,
  onSelectPatient
}) => {
  const { t, dict } = useI18n();
  const [filter, setFilter] = useState<PriorityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'URGENCY_FIRST' | 'WAITING_TIME'>('URGENCY_FIRST');

  // Pair encounters with patients
  const pairedData = useMemo(() => {
    const patientMap = new Map<string, Patient>();
    patients.forEach(p => patientMap.set(p.id, p));

    return encounters.map(enc => {
      const patient = patientMap.get(enc.patientId);
      const currentAssessment =
        enc.assessmentHistory.find(a => a.id === enc.currentAssessmentId) ||
        enc.assessmentHistory[enc.assessmentHistory.length - 1];

      return {
        encounter: enc,
        assessment: currentAssessment,
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

  // Aggregate stats (Exclude completed encounters from active emergency counts)
  const stats = useMemo(() => {
    let emergency = 0;
    let urgent = 0;
    let routine = 0;
    let awaitingReview = 0;
    let pendingSync = 0;

    pairedData.forEach(({ encounter }) => {
      const isCompleted = encounter.status === 'Completed';
      if (encounter.priority === 'EMERGENCY' && !isCompleted) emergency++;
      else if (encounter.priority === 'URGENT' && !isCompleted) urgent++;
      else if (encounter.priority === 'ROUTINE' && !isCompleted) routine++;

      if (encounter.status === 'Awaiting Assessment' || encounter.status === 'Reassessment Required') {
        awaitingReview++;
      }
      if (encounter.syncStatus === 'Pending Sync' || encounter.syncStatus === 'Saved Locally') {
        pendingSync++;
      }
    });

    return { emergency, urgent, routine, awaitingReview, pendingSync, total: pairedData.length };
  }, [pairedData]);

  // Filter & Search
  const filteredData = useMemo(() => {
    return pairedData.filter(({ encounter, patient }) => {
      // Filter tab check
      if (filter === 'EMERGENCY' && (encounter.priority !== 'EMERGENCY' || encounter.status === 'Completed')) return false;
      if (filter === 'URGENT' && (encounter.priority !== 'URGENT' || encounter.status === 'Completed')) return false;
      if (filter === 'ROUTINE' && (encounter.priority !== 'ROUTINE' || encounter.status === 'Completed')) return false;
      if (filter === 'PENDING_SYNC' && encounter.syncStatus === 'Synced') return false;

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = patient.fullName.toLowerCase().includes(q);
        const matchId = patient.id.toLowerCase().includes(q);
        const matchVillage = patient.village.toLowerCase().includes(q);
        const matchComplaint = encounter.chiefComplaint.toLowerCase().includes(q);
        const matchSymptoms = encounter.symptoms.some(s => s.toLowerCase().includes(q));
        if (!matchName && !matchId && !matchVillage && !matchComplaint && !matchSymptoms) {
          return false;
        }
      }

      return true;
    });
  }, [pairedData, filter, searchQuery]);

  // Sorting: Urgency first (Emergency -> Urgent -> Routine), then by oldest registration time first
  // Underlying timestamps remain preserved and active for fair queue ordering
  const sortedData = useMemo(() => {
    const priorityWeight = { EMERGENCY: 1, URGENT: 2, ROUTINE: 3 };

    return [...filteredData].sort((a, b) => {
      if (sortBy === 'URGENCY_FIRST') {
        const pDiff = priorityWeight[a.encounter.priority] - priorityWeight[b.encounter.priority];
        if (pDiff !== 0) return pDiff;
      }
      // Oldest arrival/registration timestamp first
      return new Date(a.encounter.createdAt).getTime() - new Date(b.encounter.createdAt).getTime();
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
            onClick={() => setSortBy(s => s === 'URGENCY_FIRST' ? 'WAITING_TIME' : 'URGENCY_FIRST')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              {t('queue.sortLabel')} {sortBy === 'URGENCY_FIRST' ? t('queue.sortUrgencyFirst') : t('queue.sortWaitingTime')}
            </span>
          </button>
        </div>
      </div>

      {/* Compact Summary Status Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Emergency Count */}
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
            <span className="text-red-700 text-xs font-mono">{t('queue.summaryEmergencySub')}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-700 tabular-nums">
              {stats.emergency}
            </span>
            <span className="text-xs text-red-600 font-medium">{t('queue.patientsUnit')}</span>
          </div>
        </div>

        {/* Urgent Count */}
        <div
          onClick={() => setFilter(filter === 'URGENT' ? 'ALL' : 'URGENT')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
            filter === 'URGENT' ? 'ring-2 ring-amber-500' : ''
          } bg-amber-50/70 border-amber-200`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              {t('queue.summaryUrgent')}
            </span>
            <span className="text-amber-700 text-xs font-mono">{t('queue.summaryUrgentSub')}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
              {stats.urgent}
            </span>
            <span className="text-xs text-amber-600 font-medium">{t('queue.patientsUnit')}</span>
          </div>
        </div>

        {/* Routine Count */}
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
            <span className="text-emerald-700 text-xs font-mono">{t('queue.summaryRoutineSub')}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {stats.routine}
            </span>
            <span className="text-xs text-emerald-600 font-medium">{t('queue.patientsUnit')}</span>
          </div>
        </div>

        {/* Total Waiting / Awaiting Assessment */}
        <div className="p-3.5 rounded-lg border bg-white border-slate-200">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {t('queue.summaryAwaiting')}
            </span>
            <span className="text-slate-400 text-xs font-mono">{t('queue.summaryAwaitingSub')}</span>
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
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t('queue.filterAll', { count: stats.total })}
          </button>
          <button
            onClick={() => setFilter('EMERGENCY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'EMERGENCY'
                ? 'bg-red-600 text-white font-semibold'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            {t('queue.filterEmergency', { count: stats.emergency })}
          </button>
          <button
            onClick={() => setFilter('URGENT')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'URGENT'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            {t('queue.filterUrgent', { count: stats.urgent })}
          </button>
          <button
            onClick={() => setFilter('ROUTINE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'ROUTINE'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            {t('queue.filterRoutine', { count: stats.routine })}
          </button>
          {stats.pendingSync > 0 && (
            <button
              onClick={() => setFilter('PENDING_SYNC')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
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
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('queue.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label={t('queue.clearSearch')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Queue: Desktop Table (6 columns) / Mobile Cards */}
      {sortedData.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">{t('queue.emptyTitle')}</p>
          <p className="text-xs text-slate-500 mt-1">{t('queue.emptySubtext')}</p>
          <button
            onClick={() => { setFilter('ALL'); setSearchQuery(''); }}
            className="mt-3 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium cursor-pointer"
          >
            {t('queue.clearFilters')}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View — Strictly 6 Columns: Priority, Patient, Age / Sex, Key Vitals, Care Status, Action */}
          <div className="hidden lg:block bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4 w-44">{t('queue.colPriority')}</th>
                    <th className="py-3 px-4">{t('queue.colPatient')}</th>
                    <th className="py-3 px-4 w-28">{t('queue.colAgeSex')}</th>
                    <th className="py-3 px-4">{t('queue.colKeyVitals')}</th>
                    <th className="py-3 px-4 w-44">{t('queue.colCareStatus')}</th>
                    <th className="py-3 px-4 w-28 text-right">{t('queue.colAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sortedData.map(({ encounter, patient, assessment }) => {
                    const isEmergency = encounter.priority === 'EMERGENCY';
                    const isUrgent = encounter.priority === 'URGENT';
                    const requiresHumanReview = assessment?.requiresHumanReview;
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
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isEmergency ? 'bg-red-50/30' : ''
                        }`}
                      >
                        {/* 1. Priority Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            {isEmergency ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                                {t('priorities.EMERGENCY')}
                              </span>
                            ) : isUrgent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                {t('priorities.URGENT')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                {t('priorities.ROUTINE')}
                              </span>
                            )}
                            {requiresHumanReview && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                {t('priorities.HUMAN_REVIEW')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Patient */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {patient.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                            <span>{patient.id}</span>
                            <span>·</span>
                            <span className="font-sans truncate max-w-[180px]">{patient.village}</span>
                          </div>
                        </td>

                        {/* 3. Age / Sex */}
                        <td className="py-3.5 px-4 text-slate-600 tabular-nums whitespace-nowrap">
                          {patient.age}{t('queue.yearsShort')} / {genderShort}
                        </td>

                        {/* 4. Key Vitals */}
                        <td className="py-3.5 px-4 font-mono text-[11px] tabular-nums">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* SpO2 */}
                            {vs.oxygenSaturation.isUnavailable || vs.oxygenSaturation.value === null ? (
                              <span className="text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                {t('queue.spo2Label')}: {t('queue.naShort')}
                              </span>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded ${
                                vs.oxygenSaturation.value < 90
                                  ? 'bg-red-100 text-red-800 font-bold'
                                  : vs.oxygenSaturation.value <= 93
                                  ? 'bg-amber-100 text-amber-800 font-medium'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {t('queue.spo2Label')}: {vs.oxygenSaturation.value}%
                              </span>
                            )}

                            {/* BP */}
                            {vs.systolicBP.isUnavailable || vs.systolicBP.value === null ? (
                              <span className="text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                {t('queue.bpLabel')}: {t('queue.naShort')}
                              </span>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded ${
                                vs.systolicBP.value >= 160 || vs.systolicBP.value < 90
                                  ? 'bg-red-100 text-red-800 font-bold'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {t('queue.bpLabel')}: {vs.systolicBP.value}/{vs.diastolicBP.value ?? '-'} mmHg
                              </span>
                            )}

                            {/* Pulse */}
                            {vs.pulseRate.isUnavailable || vs.pulseRate.value === null ? (
                              <span className="text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                {t('queue.pulseLabel')}: {t('queue.naShort')}
                              </span>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded ${
                                vs.pulseRate.value >= 135 || vs.pulseRate.value <= 40
                                  ? 'bg-red-100 text-red-800 font-bold'
                                  : vs.pulseRate.value >= 105 || vs.pulseRate.value <= 50
                                  ? 'bg-amber-100 text-amber-800 font-medium'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {t('queue.pulseLabel')}: {vs.pulseRate.value} bpm
                              </span>
                            )}

                            {/* Temp */}
                            {!vs.temperature.isUnavailable && vs.temperature.value !== null && (
                              <span className={`px-1.5 py-0.5 rounded ${
                                vs.temperature.value >= 38.3 || vs.temperature.value <= 35.0
                                  ? 'bg-amber-100 text-amber-800 font-medium'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {vs.temperature.value}°C
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Care Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-medium ${
                            encounter.status === 'Completed'
                              ? 'bg-slate-100 text-slate-600'
                              : encounter.status === 'Under Clinical Review'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : encounter.status === 'Reassessment Required'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {localizedCareStatus}
                          </span>
                        </td>

                        {/* 6. Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPatient(patient.id, encounter.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <span>{t('queue.detailsBtn')}</span>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards (Matched to simplified fields) */}
          <div className="lg:hidden space-y-3">
            {sortedData.map(({ encounter, patient, assessment }) => {
              const isEmergency = encounter.priority === 'EMERGENCY';
              const isUrgent = encounter.priority === 'URGENT';
              const requiresHumanReview = assessment?.requiresHumanReview;
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isEmergency ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                          🔴 {t('priorities.EMERGENCY')}
                        </span>
                      ) : isUrgent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                          🟡 {t('priorities.URGENT')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          🟢 {t('priorities.ROUTINE')}
                        </span>
                      )}

                      {requiresHumanReview && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded">
                          {t('priorities.HUMAN_REVIEW')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {patient.fullName} ({patient.age}{t('queue.yearsShort')} / {genderShort})
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {patient.id} · {patient.village}
                    </div>
                  </div>

                  {/* Vitals row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="text-slate-500">{t('queue.vitalsLabel')}</span>
                    {vs.oxygenSaturation.isUnavailable || vs.oxygenSaturation.value === null ? (
                      <span className="text-amber-800">{t('queue.spo2Label')}: {t('queue.naShort')}</span>
                    ) : (
                      <span className={`${vs.oxygenSaturation.value < 90 ? 'text-red-700 font-bold' : 'text-slate-700'}`}>
                        {t('queue.spo2Label')} {vs.oxygenSaturation.value}%
                      </span>
                    )}

                    {vs.systolicBP.isUnavailable || vs.systolicBP.value === null ? (
                      <span className="text-amber-800">{t('queue.bpLabel')}: {t('queue.naShort')}</span>
                    ) : (
                      <span className="text-slate-700">
                        {t('queue.bpLabel')} {vs.systolicBP.value}/{vs.diastolicBP.value ?? '-'} mmHg
                      </span>
                    )}

                    {vs.pulseRate.isUnavailable || vs.pulseRate.value === null ? (
                      <span className="text-amber-800">{t('queue.pulseLabel')}: {t('queue.naShort')}</span>
                    ) : (
                      <span className="text-slate-700">
                        {t('queue.pulseLabel')} {vs.pulseRate.value} bpm
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-slate-500 text-[11px]">
                      {t('queue.statusPrefix')} <strong className="text-slate-800">{localizedCareStatus}</strong>
                    </span>
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                      {t('queue.detailsBtn')} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
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
