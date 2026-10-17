import React, { useState, useRef, useEffect } from 'react';
import { 
  CloudRain, MapPin, Bell, ChevronDown, 
  Settings, History, Shield, LogOut, CheckCircle2, User
} from 'lucide-react';
import { CityLocation } from '../types';
import { OfficerUser } from './LoginPage';

interface HeaderProps {
  selectedCity: CityLocation;
  availableCities: CityLocation[];
  onSelectCity: (city: CityLocation) => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenHistoricalDisasters?: () => void;
  unreadAlertsCount: number;
  currentUser?: OfficerUser;
  onLogout?: () => void;
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
}) => {
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = availableCities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const officerName = currentUser?.name || 'Dr. Aarav Sundaram, IAS';
  const officerRole = currentUser?.title || 'Municipal Commissioner';
  const officerDept = currentUser?.department || 'Municipal Administration & DDMA';
  const officerInitials = currentUser?.avatarInitials || 'AS';
  const officerEmail = currentUser?.email || 'aarav.sundaram@ddma.gov.in';

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-2xs">
      {/* Primary Top Bar */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Lockup (GOV / NDRF badge removed per user request) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <CloudRain className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">ClimaGuard</span>
              </div>
              <div className="text-[10px] text-slate-500 tracking-wider">
                Anticipate <span className="text-slate-300">·</span> Prepare <span className="text-slate-300">·</span> Stay Safe
              </div>
            </div>
          </div>
        </div>

        {/* Location Selector Bar */}
        <div ref={cityDropdownRef} className="relative max-w-md w-full hidden sm:block">
          <div 
            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 text-slate-800 rounded-full px-3.5 py-1.5 text-xs cursor-pointer shadow-2xs transition-colors"
          >
            <MapPin size={14} className="text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">
              {selectedCity.name}, {selectedCity.region}, {selectedCity.country}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>

          {/* Location Dropdown Modal */}
          {isCityDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 text-slate-900 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search coastal zone or city..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 mb-2 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredCities.map((city) => (
                  <div
                    key={city.id}
                    onClick={() => {
                      onSelectCity(city);
                      setIsCityDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      selectedCity.id === city.id 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{city.name}</div>
                      <div className="text-[11px] text-slate-500">{city.region}, {city.country}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Controls: Notifications & Profile with Dropdown (Last Synced and Live Telemetry removed) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell size={17} />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown (Settings moved here) */}
          <div ref={profileDropdownRef} className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {officerInitials}
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-900">{officerName.split(',')[0]}</div>
                <div className="text-[10px] text-slate-500">{officerRole}</div>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in duration-100 text-xs">
                {/* Officer Summary */}
                <div className="p-3 bg-slate-50 rounded-xl mb-1.5 border border-slate-200/80">
                  <div className="font-bold text-slate-900 text-sm">{officerName}</div>
                  {/* <div className="text-slate-500 text-[11px]">{officerRole}</div> */}
                  {/* <div className="text-slate-400 text-[10px] font-mono mt-0.5 truncate">{officerDept}</div> */}
                  <div className="text-blue-600 text-[10px] font-mono mt-1 truncate">{officerEmail}</div>
                </div>

                <div className="space-y-0.5">
                  {/* Settings Item */}
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors text-left font-medium"
                  >
                    <div className="w-5 h-5 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Settings size={10} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Settings</div>
                      {/* <div className="text-[10px] text-slate-500">Thresholds, telemetry & GIS layers</div> */}
                    </div>
                  </button>

                  {/* Historical Disasters Shortcut */}
                  {onOpenHistoricalDisasters && (
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onOpenHistoricalDisasters();
                      }}
                      className="w-full flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-left"
                    >
                      <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <History size={10} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Historical Archive</div>
                        {/* <div className="text-[10px] text-slate-500">Past cyclone & surge footprint records</div> */}
                      </div>
                    </button>
                  )}

                  {/* Switch Officer / Logout Option */}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-rose-50 text-rose-700 transition-colors text-left"
                    >
                      <div className="w-5 h-5 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <LogOut size={10} />
                      </div>
                      <div>
                        <div className="font-bold text-rose-900">Switch Role / Sign Out</div>
                      </div>
                    </button>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
