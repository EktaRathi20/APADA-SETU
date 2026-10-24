
import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import DashboardProvider from "./DashboardProvider";
import Layout from "./Layout";
import LoginPage from "../pages/LoginPage";
import type { AuthUser } from "../types";

import AlertsPage from "../pages/AlertsPage";
import BaselinePage from "../pages/BaselinePage";
import HistoryPage from "../pages/HistoryPage";
import LandfallPage from "../pages/LandfallPage";
import OverviewPage from "../pages/OverviewPage";
import RecoveryPage from "../pages/RecoveryPage";
import SimulatorPage from "../pages/SimulatorPage";
import TasksPage from "../pages/TasksPage";
import ThreatPage from "../pages/ThreatPage";
import FieldOperationPage from '@/pages/FieldOperationPage';
import RegionManagementPage from "@/pages/RegionPage";

export default function AppRoutes() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleLogout() {
    sessionStorage.removeItem("apada_access_token");
    setCurrentUser(null);
    setIsLoggedIn(false);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn && currentUser ? (
              <Navigate to="/threat" replace />
            ) : (
              <LoginRoute
                onLogin={(user) => {
                  setCurrentUser(user);
                  setIsLoggedIn(true);
                }}
              />
            )
          }
        />

        <Route
          element={
            isLoggedIn && currentUser ? (
              <DashboardProvider />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            element={
              currentUser ? (
                <Layout
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/baseline" element={<BaselinePage />} />
            <Route path="/threat" element={<ThreatPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/fieldOps" element={<FieldOperationPage />} />
            <Route path="/landfall" element={<LandfallPage />} />
            <Route path="/recovery" element={<RecoveryPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/region-management" element={<RegionManagementPage  currentUserRole={currentUser?.roleId} />} />
             

            <Route index element={<Navigate to="/threat" replace />} />
            <Route path="*" element={<Navigate to="/threat" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function LoginRoute({
  onLogin,
}: {
  onLogin: (user: AuthUser) => void;
}) {
  const navigate = useNavigate();

  return (
    <LoginPage
      onLogin={(user) => {
        onLogin(user);
        navigate("/threat", { replace: true });
      }}
    />
  );
}
