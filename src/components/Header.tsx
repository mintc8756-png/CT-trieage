import React from 'react';
import { StaffProfile, SupportedLanguage } from '../types/triage';
import { useI18n } from '../i18n';
import { Wifi, WifiOff, Plus, User, Globe } from 'lucide-react';

interface HeaderProps {
  currentStaff: StaffProfile;
  staffList: StaffProfile[];
  onSelectStaff: (staff: StaffProfile) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  onRegisterClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStaff,
  staffList,
  onSelectStaff,
  isOnline,
  onToggleOnline,
  onRegisterClick
}) => {
  const { language, setLanguage, t, dict } = useI18n();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 py-3 no-print shadow-xs">
      <div className="app-container flex flex-wrap items-center justify-between gap-3">
        {/* Brand Zone (No Logo Icon) */}
        <div className="flex items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 font-display">
                {t('app.title')}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {t('app.version')}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {t('app.facility')}
            </p>
          </div>
        </div>

        {/* Connectivity & Operational Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Connectivity Status Toggle */}
          <button
            onClick={onToggleOnline}
            title={isOnline ? t('header.toggleOnlineTitle') : t('header.toggleOfflineTitle')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border cursor-pointer ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('header.onlineFull')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{t('header.offlineFull')}</span>
              </>
            )}
          </button>

          {/* Global Application Language Selector (English / हिन्दी / ਪੰਜਾਬੀ) */}
          <div className="relative">
            <label htmlFor="global-lang-select" className="sr-only">
              {t('header.languageLabel')}
            </label>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                id="global-lang-select"
                aria-label={t('header.languageLabel')}
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
              </select>
            </div>
          </div>

          {/* Staff Switcher */}
          <div className="relative min-w-0">
            <label htmlFor="staff-select" className="sr-only">
              {t('header.activeClinician')}
            </label>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                id="staff-select"
                aria-label={t('header.activeClinician')}
                value={currentStaff.id}
                onChange={(e) => {
                  const found = staffList.find(s => s.id === e.target.value);
                  if (found) onSelectStaff(found);
                }}
                className="bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-1 max-w-[160px] sm:max-w-none truncate"
              >
                {staffList.map((st) => {
                  const shortRole =
                    dict.staffRoles.short[st.role as keyof typeof dict.staffRoles.short] ||
                    st.role.split(' ')[0];
                  return (
                    <option key={st.id} value={st.id}>
                      {st.name} ({shortRole})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onRegisterClick}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t('header.registerPatient')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
