import React, { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  MapPin,
  Bell,
  ChevronDown,
  SlidersHorizontal,
  Menu,
  Settings,
  History,
  LogOut,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import type { AuthUser } from "@/types";
import type { CityLocation } from "@/types/domain";

interface HeaderProps {
  selectedCity: CityLocation;
  availableCities: CityLocation[];
  onSelectCity: (city: CityLocation) => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenHistoricalDisasters?: () => void;
  unreadAlertsCount: number;
  currentUser?: AuthUser;
  onLogout?: () => void;
  onOpenMobileNavigation: () => void;
  onOpenRegionPage?: () => void;
  isMobileNavigationOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCity,
  availableCities,
  onSelectCity,
  onOpenNotifications,
  onOpenSettings,
  onOpenHistoricalDisasters,
  unreadAlertsCount,
  currentUser,
  onLogout,
  onOpenMobileNavigation,
  isMobileNavigationOpen,
  onOpenRegionPage,
}) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const officerName = currentUser?.name || "Signed-in Officer";
  const officerRole =
    currentUser?.roleName || "Disaster Management Officer";
  const officerInitials =
    officerName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const officerEmail = currentUser?.email || "";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-300 bg-white text-slate-800">
      {/* Compact portal identity — matching the sign-in page */}
      <div className="border-b-4 border-[#e5a044] bg-[#18365b] text-white">
        <div className="mx-auto flex min-h-[76px] max-w-[1800px] items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={isMobileNavigationOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls="mobile-navigation"
              aria-expanded={isMobileNavigationOpen}
              onClick={onOpenMobileNavigation}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-white/40 bg-white/5 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
            >
              {isMobileNavigationOpen ? <X size={19} /> : <Menu size={19} />}
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/40 bg-white/10 text-white sm:h-12 sm:w-12">
              <ShieldCheck size={27} strokeWidth={1.7} />
            </div>

            <div className="min-w-0">
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100 sm:block">
                Disaster Management and Response
              </p>
              <h1 className="mt-0.5 truncate text-lg font-bold tracking-wide sm:text-xl">
                APADA-SETU
              </h1>
              <p className="truncate text-[11px] text-blue-100 sm:text-xs">
                Integrated Disaster Coordination Portal
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-[10px] text-blue-100">Operational portal</p>
            <p className="mt-0.5 text-xs font-semibold text-white">
              {selectedCity.name}
            </p>
          </div>
        </div>
      </div>

      {/* Utility navigation row */}
      <div className="bg-white">
        <div className="mx-auto flex min-h-[54px] max-w-[1800px] items-center justify-between gap-3 px-3 py-2 sm:px-5 lg:px-7">
          {/* Current region + link to Region Management; no dropdown */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md sm:flex-none">
            <div className="flex min-w-0 flex-1 items-center gap-2 border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800">
              <MapPin size={15} className="shrink-0 text-[#234d77]" />
              <span className="min-w-0 truncate font-semibold">
                {selectedCity.name}, {selectedCity.region}, {selectedCity.country}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenRegionPage?.()}
              title="Manage regions"
              aria-label="Go to Region Management"
              className="inline-flex shrink-0 items-center gap-1.5 border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#18365b] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18365b]"
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Manage regions</span>
              <span className="sm:hidden">Regions</span>
            </button>
          </div>

          {/* Right-side actions */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Notifications opens a dropdown; full page opens only from its link */}
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                aria-label={`Notifications${unreadAlertsCount > 0 ? `, ${unreadAlertsCount} unread` : ""}`}
                aria-expanded={isNotificationsOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setIsNotificationsOpen((open) => !open);
                            setIsProfileDropdownOpen(false);
                }}
                className="relative inline-flex h-9 w-9 items-center justify-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18365b]"
              >
                <Bell size={18} />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center border border-white bg-[#b42318] px-1 text-[9px] font-bold text-white">
                    {unreadAlertsCount > 99 ? "99+" : unreadAlertsCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] border border-slate-300 bg-white shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3 border-b-2 border-[#e5a044] bg-[#18365b] px-4 py-3 text-white">
                    <div>
                      <h2 className="text-sm font-bold">Notifications</h2>
                      <p className="mt-1 text-[11px] text-blue-100">
                        APADA-SETU alert centre
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(false)}
                      aria-label="Close notifications"
                      className="flex h-7 w-7 items-center justify-center border border-white/30 hover:bg-white/10"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="p-4">
                    {unreadAlertsCount > 0 ? (
                      <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-amber-300 bg-white text-amber-800">
                          <AlertTriangle size={17} />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {unreadAlertsCount} unread{" "}
                            {unreadAlertsCount === 1 ? "notification" : "notifications"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            Open the notification centre to review the latest alerts and updates.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-slate-200 bg-slate-50 px-4 py-6 text-center">
                        <CheckCircle2 size={23} className="mx-auto text-green-700" />
                        <p className="mt-2 text-xs font-semibold text-slate-800">
                          You are all caught up
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          No unread notifications.
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock3 size={14} />
                      Alert details are available in the notification centre.
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-slate-50 p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onOpenNotifications();
                      }}
                      className="w-full border border-[#18365b] bg-[#18365b] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#234d77] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18365b]"
                    >
                      Open notification centre
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Officer profile */}
            <div ref={profileDropdownRef} className="relative">
              <button
                type="button"
                aria-expanded={isProfileDropdownOpen}
                onClick={() => {
                  setIsProfileDropdownOpen((open) => !open);
                            setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 border border-transparent px-1.5 py-1 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18365b]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#18365b] text-[11px] font-bold text-white">
                  {officerInitials}
                </span>
                <span className="hidden max-w-40 text-left md:block">
                  <span className="block truncate text-xs font-semibold text-slate-900">
                    {officerName}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-600">
                    {officerRole}
                  </span>
                </span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 border border-slate-300 bg-white shadow-lg">
                  <div className="border-b-2 border-[#e5a044] bg-slate-50 px-4 py-3">
                    <p className="text-sm font-bold text-[#18365b]">{officerName}</p>
                    <p className="mt-1 text-xs text-slate-600">{officerRole}</p>
                    {officerEmail && (
                      <p className="mt-1 break-all text-[11px] text-slate-500">
                        {officerEmail}
                      </p>
                    )}
                  </div>
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    {onOpenHistoricalDisasters && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onOpenHistoricalDisasters();
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <History size={16} />
                        Historical archive
                      </button>
                    )}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="flex w-full items-center gap-3 border-t border-slate-200 px-3 py-2.5 text-left text-xs font-semibold text-[#a12622] hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
