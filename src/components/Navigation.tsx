import React from 'react';
import { useI18n } from '../i18n';
import { Users, UserPlus } from 'lucide-react';

export type ActiveTab = 'queue' | 'register' | 'sync';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeEmergencyCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeEmergencyCount
}) => {
  const { t } = useI18n();

  const formatEmergencyLabel = (count: number) => {
    if (count <= 0) return t('nav.emergencyCountZero');
    if (count === 1) return t('nav.emergencyCountSingular');
    return t('nav.emergencyCountPlural', { count });
  };

  const tabs = [
    {
      id: 'queue' as ActiveTab,
      label: t('nav.liveQueue'),
      icon: Users,
      badge: formatEmergencyLabel(activeEmergencyCount),
      badgeColor:
        activeEmergencyCount > 0
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200'
    },
    {
      id: 'register' as ActiveTab,
      label: t('nav.newRegistration'),
      icon: UserPlus,
      badge: null,
      badgeColor: ''
    }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 no-print">
      <div className="app-container flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm tabular-nums ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
