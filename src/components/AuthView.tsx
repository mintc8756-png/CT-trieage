import React, { useState } from 'react';
import { StaffProfile, StaffRoleCategory, SupportedLanguage } from '../types/triage';
import { useI18n } from '../i18n';
import { signInStaffWithGoogle } from '../services/firebase';
import {
  Globe,
  Wifi,
  WifiOff,
  Stethoscope,
  HeartHandshake,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthViewProps {
  staffList: StaffProfile[];
  onAuthenticated: (staff: StaffProfile) => void;
  onRegisterStaff: (newStaff: StaffProfile) => void;
  isOnline: boolean;
}

export const isDoctorRole = (staff: StaffProfile): boolean =>
  staff.roleCategory === 'DOCTOR' || staff.role === 'Medical Officer (Doctor)';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthView: React.FC<AuthViewProps> = ({
  staffList,
  onAuthenticated,
  onRegisterStaff,
  isOnline
}) => {
  const { language, setLanguage, t, dict } = useI18n();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [roleCategory, setRoleCategory] = useState<StaffRoleCategory>('ASHA_NURSE');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up form state
  const [fullName, setFullName] = useState('');
  const [subRole, setSubRole] = useState<
    'ANM (Auxiliary Nurse Midwife)' | 'Staff Nurse' | 'ASHA Worker'
  >('Staff Nurse');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const profile = await signInStaffWithGoogle(roleCategory, subRole);
      onRegisterStaff(profile);
    } catch (err: unknown) {
      const errCode =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (
        errCode === 'auth/popup-closed-by-user' ||
        errCode === 'auth/cancelled-popup-request'
      ) {
        // User closed the popup window; no error banner needed
        return;
      }
      if (errCode === 'auth/unauthorized-domain') {
        setError(
          'For Google Sign-In when running locally, please open http://localhost:3000 in your browser (or use Email / Registration ID sign-in below).'
        );
        return;
      }
      setError(t('auth.errorGoogleSignIn'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    if (error) setError(null);

    const cleanId = value.trim().toLowerCase();
    if (!cleanId) return;

    const matchedUser = staffList.find(
      s =>
        (s.email && s.email.toLowerCase() === cleanId) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase() === cleanId) ||
        s.id.toLowerCase() === cleanId
    );

    if (matchedUser) {
      setRoleCategory(isDoctorRole(matchedUser) ? 'DOCTOR' : 'ASHA_NURSE');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setError(t('auth.errorRequiredFields'));
      return;
    }

    const matchedUser = staffList.find(
      s =>
        (s.email && s.email.toLowerCase() === cleanId) ||
        (s.registrationNumber && s.registrationNumber.toLowerCase() === cleanId) ||
        s.id.toLowerCase() === cleanId ||
        s.name.toLowerCase() === cleanId
    );

    if (!matchedUser) {
      setError(t('auth.errorAccountNotFound'));
      return;
    }

    if (matchedUser.password && matchedUser.password !== cleanPass) {
      setError(t('auth.errorInvalidCredentials'));
      return;
    }

    const userIsDoctor = isDoctorRole(matchedUser);
    if (roleCategory === 'DOCTOR' && !userIsDoctor) {
      setError(t('auth.errorRoleMismatchDoctor'));
      return;
    }
    if (roleCategory === 'ASHA_NURSE' && userIsDoctor) {
      setError(t('auth.errorRoleMismatchNurse'));
      return;
    }

    onAuthenticated(matchedUser);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = signUpPassword.trim();
    const cleanConfirm = confirmPassword.trim();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const defaultPrefix =
      roleCategory === 'DOCTOR'
        ? 'MCI'
        : subRole === 'ASHA Worker'
        ? 'ASHA'
        : subRole === 'ANM (Auxiliary Nurse Midwife)'
        ? 'ANM'
        : 'RN';
    const cleanReg =
      regNumber.trim().toUpperCase() || `${defaultPrefix}-2026-${randomSuffix}`;

    if (!cleanName || !cleanEmail || !cleanPass) {
      setError(t('auth.errorSignUpFields'));
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError(t('auth.errorInvalidEmail'));
      return;
    }

    if (cleanPass.length < 6) {
      setError(t('auth.errorPasswordShort'));
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }

    const exists = staffList.some(
      s =>
        (s.email && s.email.toLowerCase() === cleanEmail) ||
        (regNumber.trim() &&
          s.registrationNumber &&
          s.registrationNumber.toUpperCase() === cleanReg)
    );

    if (exists) {
      setError(t('auth.errorDuplicateUser'));
      return;
    }

    const newStaff: StaffProfile = {
      id: 'STAFF-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      name: cleanName,
      role: roleCategory === 'DOCTOR' ? 'Medical Officer (Doctor)' : subRole,
      roleCategory,
      registrationNumber: cleanReg,
      email: cleanEmail,
      password: cleanPass
    };

    onRegisterStaff(newStaff);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Top Minimal Bar */}
      <header className="bg-white border-b border-slate-200 py-3">
        <div className="app-container flex items-center justify-between gap-3">
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 font-display block">
              {t('app.title')}
            </span>
            <p className="text-xs text-slate-500">{t('app.facility')}</p>
          </div>

          <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-700">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                aria-label={t('header.languageLabel')}
                value={language}
                onChange={e => setLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-5">
          {/* Login / Sign Up Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('auth.signInTab')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('auth.signUpTab')}
            </button>
          </div>

          {/* Role Selection: ASHA / Nurse vs Doctor */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              {t('auth.roleLabel')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRoleCategory('ASHA_NURSE');
                  setError(null);
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  roleCategory === 'ASHA_NURSE'
                    ? 'border-blue-600 bg-blue-50/60 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                  <HeartHandshake
                    className={`w-4 h-4 shrink-0 ${
                      roleCategory === 'ASHA_NURSE' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{t('auth.roleAshaNurse')}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {t('auth.roleAshaNurseDesc')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoleCategory('DOCTOR');
                  setError(null);
                }}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  roleCategory === 'DOCTOR'
                    ? 'border-blue-600 bg-blue-50/60 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                  <Stethoscope
                    className={`w-4 h-4 shrink-0 ${
                      roleCategory === 'DOCTOR' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{t('auth.roleDoctor')}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {t('auth.roleDoctorDesc')}
                </p>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
              {error}
            </div>
          )}

          {/* Firebase Google Sign-In */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{t('auth.googleSignInBtn')}</span>
            </button>

            <div className="relative flex items-center py-0.5">
              <div className="grow border-t border-slate-200" />
              <span className="shrink-0 mx-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {t('auth.orDivider')}
              </span>
              <div className="grow border-t border-slate-200" />
            </div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.identifierLabel')}
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={e => handleIdentifierChange(e.target.value)}
                  placeholder={t('auth.identifierPlaceholder')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowLoginPassword(prev => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{t('auth.signInBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>{t('auth.noAccountPrompt')} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  {t('auth.signUpTab')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              {roleCategory === 'ASHA_NURSE' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('auth.subRoleLabel')}
                  </label>
                  <select
                    value={subRole}
                    onChange={e =>
                      setSubRole(
                        e.target.value as
                          | 'ANM (Auxiliary Nurse Midwife)'
                          | 'Staff Nurse'
                          | 'ASHA Worker'
                      )
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white text-slate-900"
                  >
                    <option value="Staff Nurse">
                      {dict.staffRoles['Staff Nurse']}
                    </option>
                    <option value="ANM (Auxiliary Nurse Midwife)">
                      {dict.staffRoles['ANM (Auxiliary Nurse Midwife)']}
                    </option>
                    <option value="ASHA Worker">
                      {dict.staffRoles['ASHA Worker']}
                    </option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.fullNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={e => {
                    setFullName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('auth.emailLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t('auth.regNumberLabel')}
                  </label>
                  <input
                    type="text"
                    value={regNumber}
                    onChange={e => {
                      setRegNumber(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t('auth.regNumberPlaceholder')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.passwordLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={signUpPassword}
                    onChange={e => {
                      setSignUpPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowSignUpPassword(prev => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSignUpPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('auth.confirmPasswordLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-white text-slate-900"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{t('auth.signUpBtn')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <span>{t('auth.haveAccountPrompt')} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  {t('auth.signInTab')}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Minimal Footer Disclaimer */}
      <footer className="py-3 text-center text-[11px] text-slate-400 border-t border-slate-200 bg-white">
        <div className="app-container">
          <strong>{t('app.disclaimerLabel')}</strong> {t('app.disclaimerText')}
        </div>
      </footer>
    </div>
  );
};
