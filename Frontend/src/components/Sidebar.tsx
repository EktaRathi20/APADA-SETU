import React from 'react';
import { 
  LayoutDashboard, History, Bell, 
  AlertTriangle, CheckSquare, LifeBuoy, Banknote, FlaskConical,
  ChevronRight
} from 'lucide-react';
import { OperationalMode } from '../types';

interface SidebarProps {
  currentMode: OperationalMode;
  onSelectMode: (mode: OperationalMode) => void;
  isHistoricalView: boolean;
  onSelectHistoricalView: (isHistory: boolean) => void;
  isNotificationView?: boolean;
  onSelectNotificationView?: (isNotification: boolean) => void;
  onOpenAlerts: () => void;
  alertsCount?: number;
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
}) => {
  const projectFlowItems = [
    {
      mode: 'threat' as OperationalMode,
      label: 'Threat Detection',
      activeClass: 'bg-amber-50 text-amber-700 border-amber-500 shadow-sm',
      iconColor: 'text-amber-600',
      icon: AlertTriangle,
    },
    {
      mode: 'tasks' as OperationalMode,
      label: 'Task & Evacuation',
      activeClass: 'bg-blue-50 text-blue-700 border-blue-600 shadow-sm',
      iconColor: 'text-blue-600',
      icon: CheckSquare,
    },
    {
      mode: 'landfall' as OperationalMode,
      label: 'Landfall Rescue',
      activeClass: 'bg-rose-50 text-rose-700 border-rose-600 shadow-sm',
      iconColor: 'text-rose-600',
      icon: LifeBuoy,
    },
    {
      mode: 'recovery' as OperationalMode,
      label: 'Insurance & Recovery',
      activeClass: 'bg-teal-50 text-teal-700 border-teal-600 shadow-sm',
      iconColor: 'text-teal-600',
      icon: Banknote,
    },
    {
      mode: 'simulator' as OperationalMode,
      label: 'Simulator Mode',
      activeClass: 'bg-cyan-50 text-cyan-800 border-cyan-600 shadow-sm',
      iconColor: 'text-cyan-700',
      icon: FlaskConical,
    },
  ];

  // Helper for standardized light-mode menu item styling
  const getItemClass = (isActive: boolean, activeStyles: string = 'bg-blue-50 text-blue-700 border-blue-600 shadow-sm') => {
    return `w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border-l-4 ${
      isActive 
        ? activeStyles 
        : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    }`;
  };

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)] select-none">
      <div className="p-4 space-y-6">
        
        {/* Core Nav Group */}
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block px-1">
            Main Menu
          </span>
          <div className="space-y-1">
            <button
              onClick={() => {
                onSelectHistoricalView(false);
                if (onSelectNotificationView) onSelectNotificationView(false);
                onSelectMode('overview');
              }}
              className={getItemClass(!isHistoricalView && !isNotificationView && currentMode === 'overview')}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={18} className={!isHistoricalView && !isNotificationView && currentMode === 'overview' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Dashboard Overview</span>
              </div>
            </button>

            <button
              onClick={() => {
                onSelectHistoricalView(true);
                if (onSelectNotificationView) onSelectNotificationView(false);
              }}
              className={getItemClass(isHistoricalView)}
            >
              <div className="flex items-center gap-3">
                <History size={18} className={isHistoricalView ? 'text-blue-600' : 'text-slate-400'} />
                <span>Historical Disasters</span>
              </div>
            </button>

            <button
              onClick={() => {
                if (onSelectNotificationView) {
                  onSelectNotificationView(true);
                  onSelectHistoricalView(false);
                } else {
                  onOpenAlerts();
                }
              }}
              className={getItemClass(isNotificationView, 'bg-purple-50 text-purple-700 border-purple-600 shadow-sm')}
            >
              <div className="flex items-center gap-3">
                <Bell size={18} className={isNotificationView ? 'text-purple-600' : 'text-slate-400'} />
                <span>Notifications</span>
              </div>
              {alertsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  {alertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Project Flow Stages Group */}
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block px-1">
            Operational Phases
          </span>
          <div className="space-y-1">
            {projectFlowItems.map((item) => {
              const Icon = item.icon;
              const isActive = !isHistoricalView && !isNotificationView && currentMode === item.mode;

              return (
                <button
                  key={item.mode}
                  onClick={() => {
                    onSelectHistoricalView(false);
                    if (onSelectNotificationView) onSelectNotificationView(false);
                    onSelectMode(item.mode);
                  }}
                  className={getItemClass(isActive, item.activeClass)}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? item.iconColor : 'text-slate-400'} />
                    <div className="text-left">
                      <div className="leading-tight">{item.label}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};