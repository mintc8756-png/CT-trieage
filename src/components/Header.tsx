import React from 'react';
import { StaffProfile, SupportedLanguage } from '../types/triage';
import { useI18n } from '../i18n';
import { isDoctorRole } from './AuthView';
import { Wifi, WifiOff, Plus, User, Globe, LogOut, Presentation } from 'lucide-react';

interface HeaderProps {
  currentStaff: StaffProfile;
  isOnline: boolean;
  onRegisterClick: () => void;
  onSignOut: () => void;
  onOpenPitchDeck?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStaff,
  isOnline,
  onRegisterClick,
  onSignOut,
  onOpenPitchDeck
}) => {
  const { language, setLanguage, t, dict } = useI18n();
  const isDoctor = isDoctorRole(currentStaff);
  const shortRole =
    dict.staffRoles.short[currentStaff.role as keyof typeof dict.staffRoles.short] ||
    currentStaff.role.split(' ')[0];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 py-3 no-print shadow-xs">
      <div className="app-container flex flex-wrap items-center justify-between gap-3">
        {/* Brand Zone (No Logo Icon) */}
        <div className="flex items-center shrink-0">
          <div>
            <div className="flex items-center">
              <span className="text-base font-bold tracking-tight text-slate-900 font-display">
                {t('app.title')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {t('app.facility')}
            </p>
          </div>
        </div>

        {/* Connectivity & Operational Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Hackathon Pitch Deck (6 Slides) Button */}
          {onOpenPitchDeck && (
            <button
              type="button"
              onClick={onOpenPitchDeck}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Open Hackathon Pitch Deck (6 Slides, Speaker Notes, Print)"
            >
              <Presentation className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>Pitch Deck</span>
              <span className="hidden sm:inline-block text-[10px] bg-purple-200/80 text-purple-800 px-1 py-0.2 rounded font-mono">
                6 Slides
              </span>
            </button>
          )}

          {/* Live Network Connectivity Status Indicator */}
          <div
            role="status"
            aria-live="polite"
            title={isOnline ? t('header.toggleOnlineTitle') : t('header.toggleOfflineTitle')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border select-none ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('header.onlineFull')}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{t('header.offlineFull')}</span>
              </>
            )}
          </div>

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

          {/* Logged-in Staff Identity & Sign Out */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-none">
              {currentStaff.name}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 font-medium">{shortRole}</span>
            <button
              type="button"
              onClick={onSignOut}
              title={t('auth.signOutBtn')}
              className="ml-1 inline-flex items-center gap-1 text-slate-500 hover:text-red-600 font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('auth.signOutBtn')}</span>
            </button>
          </div>

          {/* Primary Action Button (ASHA / Nurse intake CTA) */}
          {!isDoctor && (
            <button
              onClick={onRegisterClick}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{t('header.registerPatient')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
