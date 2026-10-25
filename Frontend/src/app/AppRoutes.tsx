
import { useEffect, useState, type ReactNode } from "react";
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
import { getAccessToken, logout, verifyToken } from "../services/authApi";
import { ApiError } from "../services/apiError";
import { canAccessModule, type ModuleKey } from "../utils/moduleAccess";

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
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [restoreError, setRestoreError] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  function handleLogout() {
    logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getAccessToken()) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const user = await verifyToken();

        if (!cancelled) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            logout();
          } else {
            setRestoreError(
              error instanceof Error
                ? error.message
                : "Unable to restore your session. Please try again.",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [restoreAttempt]);

  return (
    <BrowserRouter>
      {isRestoringSession ? (
        <div className="flex min-h-screen items-center justify-center bg-[#f3f5f7] text-[#202b3c]" role="status">
          Restoring your session...
        </div>
      ) : restoreError ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f5f7] px-4 text-center text-[#202b3c]">
          <p role="alert">{restoreError}</p>
          <div className="flex gap-3">
            <button
              className="rounded bg-[#18365b] px-4 py-2 text-white"
              onClick={() => {
                setRestoreError("");
                setIsRestoringSession(true);
                setRestoreAttempt((attempt) => attempt + 1);
              }}
              type="button"
            >
              Try again
            </button>
            <button
              className="rounded border border-[#18365b] px-4 py-2"
              onClick={() => {
                handleLogout();
                setRestoreError("");
              }}
              type="button"
            >
              Sign in again
            </button>
          </div>
        </div>
      ) : (
        <Routes>
          <Route
            path="/login"
            element={
              isLoggedIn && currentUser ? (
                <Navigate to="/overview" replace />
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
              <Route
                path="/overview"
                element={<ModuleAccessRoute user={currentUser} module="overview"><OverviewPage /></ModuleAccessRoute>}
              />
              <Route
                path="/baseline"
                element={<ModuleAccessRoute user={currentUser} module="baseline"><BaselinePage /></ModuleAccessRoute>}
              />
              <Route
                path="/threat"
                element={<ModuleAccessRoute user={currentUser} module="threat"><ThreatPage /></ModuleAccessRoute>}
              />
              <Route
                path="/tasks"
                element={<ModuleAccessRoute user={currentUser} module="tasks"><TasksPage /></ModuleAccessRoute>}
              />
              <Route
                path="/fieldOps"
                element={<ModuleAccessRoute user={currentUser} module="fieldOps"><FieldOperationPage /></ModuleAccessRoute>}
              />
              <Route
                path="/landfall"
                element={<ModuleAccessRoute user={currentUser} module="landfall"><LandfallPage /></ModuleAccessRoute>}
              />
              <Route
                path="/recovery"
                element={<ModuleAccessRoute user={currentUser} module="recovery"><RecoveryPage /></ModuleAccessRoute>}
              />
              <Route
                path="/simulator"
                element={<ModuleAccessRoute user={currentUser} module="simulator"><SimulatorPage /></ModuleAccessRoute>}
              />
              <Route
                path="/history"
                element={<ModuleAccessRoute user={currentUser} module="history"><HistoryPage /></ModuleAccessRoute>}
              />
              <Route
                path="/alerts"
                element={<ModuleAccessRoute user={currentUser} module="alerts"><AlertsPage /></ModuleAccessRoute>}
              />
              <Route
                path="/region-management"
                element={
                  <ModuleAccessRoute user={currentUser} module="region-management">
                    <RegionManagementPage currentUserRole={currentUser?.roleId} />
                  </ModuleAccessRoute>
                }
              />

              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Route>
        </Routes>
      )}
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
        navigate("/overview", { replace: true });
      }}
    />
  );
}

function ModuleAccessRoute({
  user,
  module,
  children,
}: {
  user: AuthUser | null;
  module: ModuleKey;
  children: ReactNode;
}) {
  return user && canAccessModule(user, module)
    ? children
    : <Navigate to={user ? "/overview" : "/login"} replace />;
}
