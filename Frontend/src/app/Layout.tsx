import { useEffect, useState } from 'react';
import { BellRing, CloudRain, LoaderCircle, MapPin, RotateCcw, X } from 'lucide-react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { ClimateAlert } from '../services/climateAlerts';
import type { AuthUser } from '../types';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { EvacuationModal } from '@/components/dashboard/modals/EvacuationModal';
import { SettingsModal } from '@/components/dashboard/modals/SettingsModal';
import type { DashboardOutletData } from '../types/dashboard';

interface LayoutProps {
  currentUser: AuthUser;
  onLogout: () => void;
}

const routeModes = {
  '/overview': 'overview',
  '/baseline': 'baseline',
  '/threat': 'threat',
  '/tasks': 'tasks',
  '/fieldOps': 'fieldOps',
  '/landfall': 'landfall',
  '/recovery': 'recovery',
  '/simulator': 'simulator',
} as const;

export default function Layout({ currentUser, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dashboard = useOutletContext<DashboardOutletData>();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const currentMode = routeModes[location.pathname as keyof typeof routeModes] ?? 'threat';
  const isHistoricalView = location.pathname === '/history';
  const isNotificationView = location.pathname === '/alerts';
  const isRegionView = location.pathname === '/region-management';

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileSidebarOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileSidebarOpen]);

  if (dashboard.regionLoading && !dashboard.selectedCity) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100 p-6 text-sm text-slate-700">
        <div role="status" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <LoaderCircle size={18} className="animate-spin text-cyan-800" />
          <span>Connecting to the APADA-SETU API and loading regions…</span>
        </div>
      </div>
    );
  }

  if (!dashboard.selectedCity || !dashboard.selectedRegion) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white bg-slate-100 text-slate-800" style={{overflow: 'hidden'}}>
      <Header
        onOpenMobileNavigation={() => setIsMobileSidebarOpen(true)}
        isMobileNavigationOpen={isMobileSidebarOpen}
        selectedCity={dashboard.selectedCity}
        availableCities={dashboard.availableCities}
        onSelectCity={(city) => {
          dashboard.resetSimulation();
          dashboard.setSelectedRegionKey(city.id);
          if (currentMode === 'simulator' && dashboard.regions[city.id]) {
            dashboard.runSimulation('YELLOW', city.id, dashboard.regions[city.id]);
          }
        }}
        onOpenNotifications={() => {
          dashboard.resetSimulation();
          navigate('/alerts');
          dashboard.markAllRead();
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHistoricalDisasters={() => {
          dashboard.resetSimulation();
          navigate('/history');
        }}
        unreadAlertsCount={dashboard.unreadCount}
        currentUser={currentUser}
        onLogout={onLogout}
         onOpenRegionPage={() => navigate("/region-management")}
      />

      <div className="flex min-w-0 flex-1 flex-row" style={{maxHeight: '80vh'}}>
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          currentMode={currentMode}
          onSelectMode={(mode) => {
            setIsMobileSidebarOpen(false);
            if (mode === 'simulator') dashboard.runSimulation('YELLOW');
            else dashboard.resetSimulation();
            navigate(`/${mode}`);
          }}
          isHistoricalView={isHistoricalView}
          onSelectHistoricalView={(isHistory) => {
            setIsMobileSidebarOpen(false);
            if (isHistory) {
              dashboard.resetSimulation();
              navigate('/history');
            }
          }}
          isNotificationView={isNotificationView}
          onSelectNotificationView={(isNotification) => {
            setIsMobileSidebarOpen(false);
            if (isNotification) {
              dashboard.resetSimulation();
              navigate('/alerts');
              dashboard.markAllRead();
            }
          }}
          onOpenAlerts={() => {
            setIsMobileSidebarOpen(false);
            dashboard.resetSimulation();
            navigate('/alerts');
            dashboard.markAllRead();
          }}
          alertsCount={dashboard.unreadCount}
          roleId={currentUser.roleId}
          roleName={currentUser.roleName}
          roleLevel={currentUser.roleLevel}
        />

        <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden max-w-[1600px] w-full mx-auto" style={{ maxHeight: '80vh' }}>
          {(dashboard.regionError || dashboard.regionDataError) && (
            <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <span>
                Data is temporarily unavailable. Retry after sometime.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (dashboard.regionError) dashboard.retryRegions();
                  dashboard.retryRegionData();
                }}
                className="inline-flex shrink-0 items-center gap-1.5 font-semibold underline underline-offset-2"
              >
                <RotateCcw size={13} /> Retry
              </button>
            </div>
          )}
          {dashboard.regionLoading && (
            <div role="status" aria-live="polite" className="mb-4 flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs font-medium text-cyan-950">
              <LoaderCircle size={15} className="animate-spin" /> Loading live region data and disaster intelligence…
            </div>
          )}
          {!isNotificationView && !isHistoricalView && currentMode === 'simulator' && dashboard.simulationTier && (
            <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs text-cyan-950">
              <span><strong>SIMULATION ACTIVE · {dashboard.simulationTier}</strong> Risk conditions shown are mock data, not a live warning.</span>
              <button type="button" onClick={dashboard.resetSimulation} className="font-semibold underline underline-offset-2">Return to live data</button>
            </div>
          )}
          {!isNotificationView && !isHistoricalView && !isRegionView && (
            <section className="bg-white border border-slate-200/90 rounded-2xl p-4 mb-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 rounded-xl border bg-blue-50 border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="break-words text-base sm:text-lg font-bold tracking-tight text-slate-900">
                    {dashboard.selectedCity.name}, {dashboard.selectedCity.region}, {dashboard.selectedCity.country}
                  </h1>
                  <div className="mt-0.5 break-words text-[10px] sm:text-xs font-mono text-slate-500">
                    {dashboard.selectedCity.coordinatesFormatted} <span className="text-slate-300">|</span> Population (est.): <span className="font-semibold text-slate-800">{dashboard.selectedCity.populationFormatted}</span>
                  </div>
                </div>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2 text-xs md:w-auto md:flex-row md:gap-3 shrink-0 self-start md:self-center">
                <div className="flex min-w-0 items-center gap-2.5 px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200">
                  <CloudRain size={20} className="text-blue-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">{currentMode === 'simulator' && dashboard.simulationTier ? 'Scenario Telemetry' : 'Current Conditions'}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm font-mono text-slate-900">
                        {currentMode === 'simulator' && dashboard.simulationTier
                          ? dashboard.activeIntelligence?.current_conditions.wind_speed_kmh == null ? 'Unavailable' : `${dashboard.activeIntelligence.current_conditions.wind_speed_kmh} km/h`
                          : dashboard.regionResponses?.currentConditions?.temperature_c == null ? 'Unavailable' : `${dashboard.regionResponses.currentConditions.temperature_c}°C`}
                      </span>
                      <span className="max-w-48 truncate text-[11px] font-medium text-slate-600">
                        {currentMode === 'simulator' && dashboard.simulationTier
                          ? `${dashboard.activeIntelligence?.current_conditions.pressure_hpa ?? 'Unavailable'} hPa · ${dashboard.activeIntelligence?.risk_assessment.level ?? 'UNKNOWN'} risk`
                          : dashboard.regionResponses?.currentConditions?.condition ?? dashboard.regionResponses?.currentConditionsError ?? 'Waiting for current weather data'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2.5 px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200">
                  <CloudRain size={20} className="text-cyan-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Next 7 Days (avg.)</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm font-mono text-slate-900">{dashboard.selectedCity.tempRangeAvg}</span>
                      <span className="text-[11px] font-medium text-slate-600">{dashboard.selectedCity.forecastSummary}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
          <Outlet context={dashboard} />
        </main>
      </div>

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <EvacuationModal
        isOpen={dashboard.isEvacuationModalOpen}
        onClose={() => dashboard.setIsEvacuationModalOpen(false)}
        isLightMode
      />
      {dashboard.toastAlert && <AlertToast alert={dashboard.toastAlert} onClose={() => dashboard.setToastAlert(null)} />}
    </div>
  );
}

function AlertToast({ alert, onClose }: { alert: ClimateAlert; onClose: () => void }) {
  const tone = alert.simulation_tier === 'RED' || alert.severity === 'critical'
    ? 'border-rose-300 bg-rose-50 text-rose-950'
    : alert.simulation_tier === 'ORANGE' || alert.severity === 'high'
      ? 'border-orange-300 bg-orange-50 text-orange-950'
      : alert.simulation_tier === 'YELLOW' || alert.severity === 'moderate'
        ? 'border-amber-300 bg-amber-50 text-amber-950'
        : 'border-emerald-300 bg-emerald-50 text-emerald-950';
  const zoneLabel = alert.simulation_tier ? `${alert.simulation_tier} ZONE` : alert.severity.toUpperCase();

  return (
    <aside role="alert" aria-live="assertive" className={`fixed right-4 top-4 z-[80] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border shadow-xl ${tone}`}>
      <div className="flex items-start gap-3 p-4">
        <BellRing size={17} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <strong className="text-[10px] font-black uppercase tracking-wide">{zoneLabel}</strong>
            {alert.is_simulation && <span className="rounded border border-current/30 px-1.5 py-0.5 text-[9px] font-bold">TEST</span>}
          </div>
          <p className="mt-1 text-sm font-bold leading-snug">{alert.title}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed opacity-85">{alert.description}</p>
          <p className="mt-2 text-[10px] font-semibold opacity-75">{alert.location.name} · closes automatically</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Dismiss alert toast" className="rounded p-1 opacity-70 hover:bg-black/5 hover:opacity-100"><X size={16} /></button>
      </div>
    </aside>
  );
}
