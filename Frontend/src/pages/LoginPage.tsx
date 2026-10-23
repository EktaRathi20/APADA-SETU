
import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  UserRound,
  Building2,
  LockKeyhole,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Mail,
  ClipboardList,
} from "lucide-react";

import {
  getUsers,
  getRoles,
  login
} from "../services/authApi";
import {   
  type OfficerUser,
  type Role,
  type AuthUser
} from "@/types";


interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [users, setUsers] = useState<OfficerUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDirectory() {
      setLoading(true);
      setError("");

      try {
        const [userData, roleData] = await Promise.all([
          getUsers(),
          getRoles(),
        ]);

        if (cancelled) return;

        // Match users with active roles only.
        const activeRoles = roleData.filter(
          (role) => role.isActive === true,
        );
        const activeRoleIds = new Set(
          activeRoles.map((role) => role.id),
        );

        const activeUsers = userData.filter(
          (user) =>
            user.isActive === true &&
            activeRoleIds.has(user.roleId),
        );

        setRoles(activeRoles);
        setUsers(activeUsers);

        setSelectedId((previousId) => {
          if (activeUsers.some((user) => user.id === previousId)) {
            return previousId;
          }
          return activeUsers[0]?.id ?? "";
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the officer directory. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDirectory();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedId),
    [users, selectedId],
  );

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedUser?.roleId),
    [roles, selectedUser],
  );

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!selectedUser) {
      setError("Please select an active officer profile.");
      return;
    }

   
    setSubmitting(true);

    try {
      // authApi.login() verifies credentials through FastAPI
      // and stores the returned access token in sessionStorage.
      const result = await login(selectedUser.id);

      onLogin(result.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelect(userId: string) {
    setSelectedId(userId);
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] text-[#202b3c]">
      {/* Portal header */}
      <header className="border-b-4 border-[#e5a044] bg-[#18365b] text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-white/40 bg-white/10">
            <ShieldCheck size={34} strokeWidth={1.7} />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-100 sm:text-xs">
              Disaster Management and Response
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-wide sm:text-3xl">
              APADA-SETU
            </h1>

            <p className="mt-1 text-xs text-blue-100 sm:text-sm">
              Integrated Disaster Coordination Portal
            </p>
          </div>
        </div>
      </header>

    

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        {/* Page heading */}
        <div className="mb-7 border-b border-gray-300 pb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#315b82]">
            Secure access
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#18365b] sm:text-3xl">
            Officer Sign In
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Select your assigned officer profile to access disaster
            assessment, operations planning, field response, rescue,
            relief and recovery services.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="font-bold">Unable to continue</p>
              <p className="mt-1 break-words">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_0.85fr]">
          {/* Officer directory */}
          <section className="border border-gray-300 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-300 bg-[#e8edf3] px-5 py-4">
              <div className="flex items-center gap-3">
                <Building2
                  size={24}
                  className="shrink-0 text-[#234d77]"
                />

                <div>
                  <h3 className="font-bold text-[#18365b]">
                    Officer Directory
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Registered profiles and assigned responsibilities
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={loading}
                title="Refresh officer directory"
                aria-label="Refresh officer directory"
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-gray-300 bg-white text-[#234d77] hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-14 text-sm text-gray-600">
                  <RefreshCw
                    size={19}
                    className="animate-spin text-[#234d77]"
                  />
                  Loading officer directory...
                </div>
              ) : users.length === 0 ? (
                <div className="border border-dashed border-gray-300 px-4 py-12 text-center">
                  <AlertCircle
                    size={30}
                    className="mx-auto text-gray-400"
                  />

                  <h4 className="mt-3 font-bold text-gray-800">
                    No active officer profiles found
                  </h4>

                  

                  <button
                    type="button"
                    onClick={() => setRefreshKey((key) => key + 1)}
                    className="mt-4 border border-[#234d77] px-4 py-2 text-sm font-semibold text-[#234d77] hover:bg-[#f0f5fa]"
                  >
                    Reload directory
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Select an officer
                    </p>

                    <span className="border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">
                      {users.length} active{" "}
                      {users.length === 1 ? "profile" : "profiles"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {users.map((user) => {
                      const role = roles.find(
                        (item) => item.id === user.roleId,
                      );
                      const selected = user.id === selectedId;

                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelect(user.id)}
                          aria-pressed={selected}
                          className={`block w-full border p-4 text-left transition-colors ${
                            selected
                              ? "border-[#234d77] bg-[#f0f5fa] ring-1 ring-[#234d77]"
                              : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center border ${
                                selected
                                  ? "border-[#234d77] bg-white text-[#234d77]"
                                  : "border-gray-300 bg-gray-50 text-gray-600"
                              }`}
                            >
                              <UserRound size={22} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-gray-900">
                                  {user.name}
                                </p>

                                {selected && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#234d77]">
                                    <CheckCircle2 size={14} />
                                    Selected
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 flex items-start gap-2 break-all text-sm text-gray-600">
                                <Mail
                                  size={15}
                                  className="mt-0.5 shrink-0"
                                />
                                {user.email}
                              </p>

                              <div className="mt-3 border-l-2 border-[#d6a04b] pl-3">
                                <p className="text-sm font-bold text-[#234d77]">
                                  {role?.name ?? "Role unavailable"}
                                </p>

                                {role?.description && (
                                  <p className="mt-1 text-sm leading-5 text-gray-600">
                                    {role.description}
                                  </p>
                                )}

                                {role?.level != null && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    Role level: {role.level}
                                  </p>
                                )}
                              </div>
                            </div>

                            <span
                              className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                selected
                                  ? "border-[#234d77] bg-[#234d77]"
                                  : "border-gray-400 bg-white"
                              }`}
                              aria-hidden="true"
                            >
                              {selected && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-300 bg-gray-50 px-5 py-3">
              <p className="text-xs leading-5 text-gray-600">
                Access is subject to successful credential verification
                and the officer's current assigned role.
              </p>
            </div>
          </section>

          {/* Authentication panel */}
          <aside className="border border-gray-300 bg-white shadow-sm">
            <div className="bg-[#18365b] px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <LockKeyhole size={23} />

                <div>
                  <h3 className="font-bold">Officer Authentication</h3>
                  <p className="mt-1 text-xs text-blue-100">
                    Verify your credentials
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Selected officer profile
                </label>

                <div className="mt-2 border border-gray-300 bg-gray-50 p-3">
                  {selectedUser ? (
                    <>
                      <p className="font-bold text-[#18365b]">
                        {selectedUser.name}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-600">
                        {selectedUser.email}
                      </p>

                      <div className="mt-3 flex items-start gap-2 border-t border-gray-200 pt-3">
                        <ClipboardList
                          size={17}
                          className="mt-0.5 shrink-0 text-[#234d77]"
                        />

                        <div>
                          <p className="text-sm font-semibold text-[#234d77]">
                            {selectedRole?.name ?? "Role unavailable"}
                          </p>

                          {selectedRole?.description && (
                            <p className="mt-1 text-xs leading-5 text-gray-600">
                              {selectedRole.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Select an officer from the directory first.
                    </p>
                  )}
                </div>
              </div>

              

              <button
                type="submit"
                disabled={
                  loading ||
                  submitting ||
                  !selectedUser
                }
                className="flex w-full items-center justify-center gap-2 bg-[#234d77] px-4 py-3 text-sm font-bold text-white hover:bg-[#18365b] focus:outline-none focus:ring-2 focus:ring-[#8ca9c7] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Verifying credentials...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-start gap-2 text-xs leading-5 text-gray-500">
                  <LockKeyhole
                    size={15}
                    className="mt-0.5 shrink-0"
                  />

                  <p>
                    Authentication is performed by the APADA-SETU
                    backend. Your dashboard opens only after successful
                    verification.
                  </p>
                </div>
              </div>
            </form>

            <div className="border-t border-gray-300 bg-[#f8f9fa] px-5 py-4">
              <p className="text-xs leading-5 text-gray-500">
                APADA-SETU Hackathon Demonstration
                <br />
                This is a project demo portal and is not an official
                Government of India website.
              </p>
            </div>
          </aside>
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-gray-300 pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            APADA-SETU · Integrated Disaster Coordination
          </span>
          <span>Hackathon demo environment</span>
        </footer>
      </main>
    </div>
  );
}
