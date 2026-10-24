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

type ModuleKey = OperationalMode | 'history' | 'alerts';
type RoleKey = 'assessment' | 'planner' | 'field' | 'recovery' | 'rescue' | 'unknown';

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

const SHARED_MODULES: ModuleKey[] = ['overview', 'history', 'alerts'];

const ROLE_CONFIG: Record<RoleKey, { modes: ModuleKey[] }> = {
  // Role 1: Disaster Assessment Officer AND admin — access to every operational module.
  assessment: {
    modes: [...SHARED_MODULES, 'threat', 'tasks', 'fieldOps', 'landfall', 'recovery'],
  },
  planner: {
    modes: [...SHARED_MODULES, 'threat', 'tasks'],
  },
  // Field Operations Officer gets a dedicated field reporting module.
  field: {
    modes: [...SHARED_MODULES, 'tasks', 'fieldOps'],
  },
  recovery: {
    modes: [...SHARED_MODULES, 'recovery'],
  },
  rescue: {
    modes: [...SHARED_MODULES, 'tasks', 'landfall'],
  },
  // Fail closed when the role is missing or unrecognised.
  unknown: {
    modes: SHARED_MODULES,
  },
};

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

function resolveRole(roleId?: string | number, roleName?: string, roleLevel?: number): RoleKey {
  const id = String(roleId ?? '').trim().toLowerCase();
  const name = String(roleName ?? '').trim().toLowerCase();

  const roleByValue: Record<string, RoleKey> = {
    role_1: 'assessment', '1': 'assessment', 'disaster assessment officer': 'assessment',
    role_2: 'planner', '2': 'planner', 'operations planner': 'planner',
    role_3: 'field', '3': 'field', 'field operations officer': 'field',
    role_4: 'recovery', '4': 'recovery', 'insurance recovery officer': 'recovery',
    role_5: 'rescue', '5': 'rescue', 'rescue relief officer': 'rescue',
  };

  if (roleByValue[name]) return roleByValue[name];
  if (roleByValue[id]) return roleByValue[id];
  if (roleLevel !== undefined && roleLevel >= 1 && roleLevel <= 5) {
    return roleByValue[String(roleLevel)] ?? 'unknown';
  }
  if (name.includes('disaster assessment') || name.includes('admin')) return 'assessment';
  if (name.includes('planner')) return 'planner';
  if (name.includes('field')) return 'field';
  if (name.includes('insurance') || name.includes('recovery')) return 'recovery';
  if (name.includes('rescue') || name.includes('relief')) return 'rescue';
  return 'unknown';
}

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
  const roleKey = resolveRole(roleId, roleName, roleLevel);
  const roleConfig = ROLE_CONFIG[roleKey];

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
    (item) => !SHARED_MODULES.includes(item.mode) && roleConfig.modes.includes(item.mode),
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
