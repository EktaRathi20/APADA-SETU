import React, { useState } from 'react';
import { 
  CloudRain, 
  ArrowRight, 
  Key, 
  UserCheck, 
  Shield, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export interface OfficerUser {
  id: string;
  name: string;
  title: string;
  department: string;
  avatarInitials: string;
  colorTheme: 'blue' | 'amber' | 'emerald' | 'purple';
  badge: string;
  email: string;
  phone: string;
}

export const OPERATIONAL_ROLES: OfficerUser[] = [
  {
    id: 'municipal_commissioner',
    name: 'Dr. Aarav Sundaram, IAS',
    title: 'Municipal Commissioner',
    department: 'Municipal Administration & DDMA',
    avatarInitials: 'AS',
    colorTheme: 'blue',
    badge: 'Apex Level 5',
    email: 'aarav.sundaram@ddma.gov.in',
    phone: '+91 94401 23456',
  },
  {
    id: 'disaster_officer',
    name: 'Vikram Rathore',
    title: 'Disaster Response Officer',
    department: 'National Disaster Response Force (NDRF)',
    avatarInitials: 'VR',
    colorTheme: 'amber',
    badge: 'Tactical Level 4',
    email: 'vikram.rathore@ndrf.gov.in',
    phone: '+91 98110 98765',
  },
  {
    id: 'ward_engineer',
    name: 'Er. Ananya Sharma',
    title: 'Field Ward Engineer',
    department: 'Irrigation & Drainage SCADA',
    avatarInitials: 'AS',
    colorTheme: 'emerald',
    badge: 'Field Level 3',
    email: 'ananya.sharma@pwd.gov.in',
    phone: '+91 97003 44123',
  },
  {
    id: 'risk_adjuster',
    name: 'Dr. Rajeshwari Sen, FIAI',
    title: 'Parametric Risk Adjuster',
    department: 'State Disaster Management Authority (SDMA)',
    avatarInitials: 'RS',
    colorTheme: 'purple',
    badge: 'Oracle Auditor',
    email: 'rajeshwari.sen@sdma.gov.in',
    phone: '+91 98200 81122',
  },
];

interface LoginPageProps {
  onLogin: (officer: OfficerUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'credentials'>('quick');
  const [emailInput, setEmailInput] = useState('aarav.sundaram@ddma.gov.in');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Please enter an official officer email or ID.');
      return;
    }
    const matched = OPERATIONAL_ROLES.find(
      r => r.email.toLowerCase() === emailInput.toLowerCase() || r.name.toLowerCase().includes(emailInput.toLowerCase())
    ) || OPERATIONAL_ROLES[0];
    onLogin(matched);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-800 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Clean Light Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">ClimaGuard</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Multi-Hazard Early Warning & Logistics Command
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Card - Clean Light Mode */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Top Auth Mode Tabs */}
          <div className="flex items-center gap-2 pb-6 border-b border-slate-100">
            <button
              onClick={() => setActiveTab('quick')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'quick'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Quick Login</span>
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Credentials</span>
            </button>
          </div>

          {/* Quick Login Mode - Clean Light Mode */}
          {activeTab === 'quick' && (
            <div className="pt-6">
              <div className="text-xs uppercase font-mono font-bold tracking-wider text-slate-500 mb-5">
                SELECT YOUR OPERATIONAL ROLE:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Dr. Aarav Sundaram, IAS */}
                <div
                  onClick={() => onLogin(OPERATIONAL_ROLES[0])}
                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      AS
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-700 transition-colors">
                        Dr. Aarav Sundaram, IAS
                      </h3>
                      <p className="text-xs text-slate-500">Municipal Commissioner</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                    <span>Launch Workspace</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. Vikram Rathore */}
                <div
                  onClick={() => onLogin(OPERATIONAL_ROLES[1])}
                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      VR
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-amber-800 transition-colors">
                        Vikram Rathore
                      </h3>
                      <p className="text-xs text-slate-500">Disaster Response Officer</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-700 group-hover:text-amber-800">
                    <span>Launch Workspace</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Er. Ananya Sharma */}
                <div
                  onClick={() => onLogin(OPERATIONAL_ROLES[2])}
                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      AS
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-800 transition-colors">
                        Er. Ananya Sharma
                      </h3>
                      <p className="text-xs text-slate-500">Field Ward Engineer</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                    <span>Launch Workspace</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 4. Dr. Rajeshwari Sen, FIAI */}
                <div
                  onClick={() => onLogin(OPERATIONAL_ROLES[3])}
                  className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-400 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 font-bold text-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      RS
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-purple-800 transition-colors">
                        Dr. Rajeshwari Sen, FIAI
                      </h3>
                      <p className="text-xs text-slate-500">Parametric Risk Adjuster</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700 group-hover:text-purple-800">
                    <span>Launch Workspace</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Credentials Mode - Clean Light Mode */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="pt-6 max-w-lg mx-auto space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-base font-bold text-slate-900">Enter Official Credentials</h2>
                <p className="text-xs text-slate-500 mt-1">Authenticate using your Disaster Management Authority ID</p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Official Email
                </label>
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. aarav.sundaram@ddma.gov.in"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In to ClimaGuard Command</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-500">Quick fill demo officer:</span>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  {OPERATIONAL_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setEmailInput(role.email);
                        setPasswordInput('••••••••••••');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono border border-slate-200 transition cursor-pointer"
                    >
                      {role.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
