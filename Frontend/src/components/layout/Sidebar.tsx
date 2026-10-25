import React from 'react';
import {
  LayoutDashboard,
  History,
  Bell,
  LifeBuoy,
  Banknote,
  FlaskConical,
  ClipboardCheck,
  CalendarClock,
  ClipboardList,
  ChevronRight,
  X,
} from 'lucide-react';
import type { OperationalMode } from '@/types/domain';
import { getAllowedModules, SHARED_MODULES, type ModuleKey } from '@/utils/moduleAccess';

interface SidebarProps {
  currentMode: OperationalMode;
  onSelectMode: (mode: OperationalMode) => void;
  isHistoricalView: boolean;
  onSelectHistoricalView: (isHistory: boolean) => void;
  isNotificationView?: boolean;
  onSelectNotificationView?: (isNotification: boolean) => void;
  onOpenAlerts: () => void;
  alertsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  roleId?: string | number;
  roleName?: string;
  roleLevel?: number;
}

interface ModuleItem {
  mode: ModuleKey;
  label: string;
  subtitle: string;
  icon: React.ElementType;
}

const MODULE_ITEMS: ModuleItem[] = [
  { mode: 'overview', label: 'Dashboard', subtitle: 'Overview of current situation', icon: LayoutDashboard },
  { mode: 'history', label: 'Historical Disasters', subtitle: 'Past incidents and records', icon: History },
  { mode: 'alerts', label: 'Notifications', subtitle: 'Alerts and updates', icon: Bell },
  { mode: 'threat', label: 'Disaster Assessment', subtitle: 'Threats and risk screening', icon: ClipboardCheck },
  { mode: 'tasks', label: 'Response Planning & Tasks', subtitle: 'Plans, assignments and evacuation', icon: CalendarClock },
  { mode: 'fieldOps', label: 'Field Operations & Reporting', subtitle: 'Ground execution and field updates', icon: ClipboardList },
  { mode: 'landfall', label: 'Rescue & Relief Operations', subtitle: 'Deployment, rescue and shelters', icon: LifeBuoy },
  { mode: 'recovery', label: 'Recovery & Compensation', subtitle: 'Damage and claims', icon: Banknote },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  isHistoricalView,
  onSelectHistoricalView,
  isNotificationView = false,
  onSelectNotificationView,
  onOpenAlerts,
  alertsCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  roleId,
  roleName,
  roleLevel,
}) => {
  const allowedModules = getAllowedModules(roleId, roleName, roleLevel);

  const goToMode = (mode: OperationalMode) => {
    onSelectHistoricalView(false);
    onSelectNotificationView?.(false);
    onSelectMode(mode);
    onCloseMobile?.();
  };

  const handleHistoryClick = () => {
    onSelectHistoricalView(true);
    onSelectNotificationView?.(false);
    onCloseMobile?.();
  };

  const handleNotificationsClick = () => {
    if (onSelectNotificationView) {
      onSelectNotificationView(true);
      onSelectHistoricalView(false);
      onCloseMobile?.();
    } else {
      onCloseMobile?.();
      onOpenAlerts();
    }
  };

  const sharedItems = MODULE_ITEMS.filter((item) => SHARED_MODULES.includes(item.mode));
  const operationalItems = MODULE_ITEMS.filter(
    (item) => !SHARED_MODULES.includes(item.mode) && allowedModules.includes(item.mode),
  );

  const itemClass = (active: boolean) =>
    `group flex w-full items-center gap-3 border-l-[3px] px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-800 ${active
      ? 'border-l-[#17365d] bg-[#eaf0f7] font-semibold text-[#17365d]'
      : 'border-l-transparent text-slate-700 hover:border-l-slate-400 hover:bg-slate-100'
    }`;

  const renderItem = (item: ModuleItem) => {
    const Icon = item.icon;
    let active = false;
    let onClick: () => void;

    if (item.mode === 'history') {
      active = isHistoricalView;
      onClick = handleHistoryClick;
    } else if (item.mode === 'alerts') {
      active = isNotificationView;
      onClick = handleNotificationsClick;
    } else {
      active = !isHistoricalView && !isNotificationView && currentMode === item.mode;
      onClick = () => goToMode(item.mode as OperationalMode);
    }

    return (
      <button
        type="button"
        key={item.mode}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={itemClass(active)}
      >
        <Icon size={18} className={active ? 'text-[#17365d]' : 'text-slate-500'} />
        <span className="min-w-0 flex-1">
          <span className="block text-xs">{item.label}</span>
          <span className={`mt-1 block text-[10px] font-normal ${active ? 'text-[#405d7c]' : 'text-slate-500'}`}>
            {item.subtitle}
          </span>
        </span>
        {item.mode === 'alerts' && alertsCount > 0 && (
          <span className="min-w-5 border border-red-200 bg-red-50 px-1.5 py-0.5 text-center text-[10px] font-bold text-[#a12622]">
            {alertsCount > 99 ? '99+' : alertsCount}
          </span>
        )}
        {active && <ChevronRight size={14} className="shrink-0 text-[#17365d]" />}
      </button>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <button type="button" aria-label="Close navigation menu" onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" />
      )}
      <aside id="mobile-navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-300 bg-white transition-transform duration-200 md:static md:z-auto  md:w-64 md:shrink-0 md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto">
          <section aria-label="Main menu">
            {isMobileOpen && (
              <h1 className="mt-0.5 truncate text-lg font-bold tracking-wide sm:text-xl mb-2 border-b border-slate-200 text-center">
                APADA-SETU
              </h1>
          )}
            <div>{sharedItems.map(renderItem)}</div>
            </section>
          <section aria-label="Role-specific operational modules">
            <h2 className="mb-2 border-b border-slate-200 px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              OPERATIONAL MODULES
            </h2>
            <div>{operationalItems.map(renderItem)}</div>
            
          </section>
        </nav>
<div className="mt-auto border-t border-slate-300 bg-slate-50">
              <button type="button" onClick={() => goToMode('simulator' as OperationalMode)}
                aria-current={!isHistoricalView && !isNotificationView && currentMode === 'simulator' ? 'page' : undefined}
                className={itemClass(!isHistoricalView && !isNotificationView && currentMode === 'simulator')}>
                <FlaskConical size={18}
                  className={!isHistoricalView && !isNotificationView && currentMode === 'simulator' ? 'text-[#17365d]' : 'text-slate-500'} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs">Simulator Mode</span>
                  <span className="mt-1 block text-[10px] font-normal text-slate-500">Preparedness exercises</span>
                </span>
                {!isHistoricalView && !isNotificationView && currentMode === 'simulator' &&
                  <ChevronRight size={14} className="shrink-0 text-[#17365d]" />}
              </button>
              <div className=" px-3 border-t border-slate-200 pt-3">
                <div className="h-1 w-16 bg-[#d88b2b]" aria-hidden="true" />
                <p className="mt-2 text-[10px] font-semibold text-slate-700">APADA-SETU</p>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-500">Integrated disaster coordination</p>
                <p className="mt-1 text-[9px] text-slate-400">Hackathon demonstration portal</p>
              </div>
            </div>

      </aside>
    </>
  );
};
