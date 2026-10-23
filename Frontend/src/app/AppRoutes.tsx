import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import DashboardProvider from './DashboardProvider';
import Layout from './Layout';
import { LoginPage, OPERATIONAL_ROLES } from '../pages/LoginPage';
import type { OfficerUser } from '../types/domain';
import AlertsPage from '../pages/AlertsPage';
import BaselinePage from '../pages/BaselinePage';
import HistoryPage from '../pages/HistoryPage';
import LandfallPage from '../pages/LandfallPage';
import OverviewPage from '../pages/OverviewPage';
import RecoveryPage from '../pages/RecoveryPage';
import SimulatorPage from '../pages/SimulatorPage';
import TasksPage from '../pages/TasksPage';
import ThreatPage from '../pages/ThreatPage';

export default function AppRoutes() {
  const [currentUser, setCurrentUser] = useState<OfficerUser>(OPERATIONAL_ROLES[0]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginRoute
              onLogin={(officer) => {
                setCurrentUser(officer);
                setIsLoggedIn(true);
              }}
            />
          }
        />
        <Route element={isLoggedIn ? <DashboardProvider /> : <Navigate to="/login" replace />}>
          <Route element={<Layout currentUser={currentUser} onLogout={() => setIsLoggedIn(false)} />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/baseline" element={<BaselinePage />} />
            <Route path="/threat" element={<ThreatPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/landfall" element={<LandfallPage />} />
            <Route path="/recovery" element={<RecoveryPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route index element={<Navigate to="/threat" replace />} />
            <Route path="*" element={<Navigate to="/threat" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function LoginRoute({ onLogin }: { onLogin: (officer: OfficerUser) => void }) {
  const navigate = useNavigate();

  return (
    <LoginPage
      onLogin={(officer) => {
        onLogin(officer);
        navigate('/threat', { replace: true });
      }}
    />
  );
}
