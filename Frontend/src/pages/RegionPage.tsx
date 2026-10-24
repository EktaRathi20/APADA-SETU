
import React, { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Waves,
  CloudLightning,
  Flame,
  ThermometerSun,
  Mountain,
  Activity,
  Save,
  Plus,
  Info,
  ShieldCheck,
} from "lucide-react";

type Region = {
  id: string;
  name: string;
  type: "State" | "District" | "Block" | "Village / Ward";
  parent: string;
  code: string;
  active: boolean;
};

const initialRegions: Region[] = [
  {
    id: "rajasthan",
    name: "Rajasthan",
    type: "State",
    parent: "India",
    code: "IN-RJ",
    active: true,
  },
  {
    id: "bikaner",
    name: "Bikaner",
    type: "District",
    parent: "Rajasthan",
    code: "DEMO-BKN",
    active: true,
  },
  {
    id: "jaipur",
    name: "Jaipur",
    type: "District",
    parent: "Rajasthan",
    code: "DEMO-JPR",
    active: true,
  },
  {
    id: "jodhpur",
    name: "Jodhpur",
    type: "District",
    parent: "Rajasthan",
    code: "DEMO-JDH",
    active: true,
  },
  {
    id: "gujarat",
    name: "Gujarat",
    type: "State",
    parent: "India",
    code: "IN-GJ",
    active: true,
  },
];

const hazardOptions = [
  {
    id: "flood",
    label: "Flood",
    description: "River, urban and flash flooding",
    icon: Waves,
  },
  {
    id: "cyclone",
    label: "Cyclone / Storm",
    description: "Severe storms and high winds",
    icon: CloudLightning,
  },
  {
    id: "fire",
    label: "Fire",
    description: "Urban, forest and industrial fire",
    icon: Flame,
  },
  {
    id: "heatwave",
    label: "Heatwave",
    description: "Extreme heat conditions",
    icon: ThermometerSun,
  },
  {
    id: "landslide",
    label: "Landslide",
    description: "Slope failure and debris flow",
    icon: Mountain,
  },
  {
    id: "earthquake",
    label: "Earthquake",
    description: "Seismic events and aftershocks",
    icon: Activity,
  },
];

interface RegionManagementPageProps {
  initialDefaultRegionId?: string;
  currentUserRole?: string;
  onSaveConfiguration?: (config: {
    defaultRegionId: string;
    enabledHazards: string[];
    regions: Region[];
  }) => Promise<void> | void;
}

export default function RegionManagementPage({
  initialDefaultRegionId = "bikaner",
  currentUserRole,
  onSaveConfiguration,
}: RegionManagementPageProps) {
  // Only Role 1 can see the two administrative sections.
  const canManageRegions =
    currentUserRole === "role_1" ||
    currentUserRole === "1" ||
    currentUserRole === "level_1";

  const [regions, setRegions] = useState<Region[]>(initialRegions);
  const [defaultRegionId, setDefaultRegionId] =
    useState(initialDefaultRegionId);
  const [enabledHazards, setEnabledHazards] = useState<string[]>(
    hazardOptions.map((hazard) => hazard.id)
  );
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");
  const [newRegionType, setNewRegionType] =
    useState<Region["type"]>("District");
  const [newRegionParent, setNewRegionParent] = useState("Rajasthan");

  const filteredRegions = useMemo(
    () =>
      regions.filter((region) => {
        const matchesQuery = `${region.name} ${region.parent} ${region.code}`
          .toLowerCase()
          .includes(query.toLowerCase());

        const matchesScope =
          scope === "all" || region.type === scope;

        return matchesQuery && matchesScope;
      }),
    [regions, query, scope]
  );

  const defaultRegion = regions.find(
    (region) => region.id === defaultRegionId
  );

  const toggleHazard = (id: string) => {
    setEnabledHazards((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
    setMessage("");
  };

  const save = async () => {
    if (!canManageRegions) return;

    setSaving(true);
    setMessage("");

    try {
      await onSaveConfiguration?.({
        defaultRegionId,
        enabledHazards,
        regions,
      });

      setMessage(
        onSaveConfiguration
          ? "Configuration saved."
          : "Draft saved in this page state. Connect onSaveConfiguration to your FastAPI/Firestore API to persist it."
      );
    } catch {
      setMessage("Could not save configuration. Please retry.");
    } finally {
      setSaving(false);
    }
  };

  const addRegion = () => {
    if (!canManageRegions) return;

    const name = newRegionName.trim();
    if (!name) return;

    const id = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    setRegions((current) => [
      ...current,
      {
        id,
        name,
        type: newRegionType,
        parent: newRegionParent.trim() || "India",
        code: "PENDING-LGD-CODE",
        active: true,
      },
    ]);

    setNewRegionName("");
    setShowAddRegion(false);
    setMessage(
      "Region added to this page draft. Connect the LGD directory/API before using this as an official region record."
    );
  };

  return (
    <div className="min-h-full bg-[#f3f5f7] text-slate-800">
      <div className="mx-auto w-full max-w-[1500px] space-y-5 p-3 sm:p-5 lg:p-6">

        {/* Government portal page header */}
        <div className="border border-slate-300 bg-white">
          <div className="border-b-4 border-[#d88b2b] bg-[#18365b] px-4 py-4 text-white sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-white/40 bg-white/5">
                <MapPin size={21} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100">
                  APADA-SETU · Administration
                </p>
                <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">
                  Region Management
                </h1>
                <p className="mt-1 text-xs text-blue-100">
                  Configure administrative regions and the default dashboard location.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 sm:px-6">
            <p className="text-xs text-slate-600">
              Administration / Region Management
            </p>
            <p className="text-xs text-slate-600">
              APADA-SETU administrative portal
            </p>
          </div>
        </div>

        {/* Visible to all roles: Default dashboard region */}
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-[#edf1f5] px-4 py-3 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="border border-slate-300 bg-white p-2 text-[#18365b]">
                <MapPin size={19} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Default dashboard region
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  This region is selected when the dashboard opens.
                  Users should only access regions authorised for them.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <label
              className="block text-sm font-semibold text-slate-700"
              htmlFor="default-region"
            >
              Select default region
            </label>

            <select
              id="default-region"
              value={defaultRegionId}
              onChange={(event) => {
                setDefaultRegionId(event.target.value);
                setMessage("");
              }}
              className="w-full rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#18365b] focus:ring-1 focus:ring-[#18365b]"
            >
              {regions
                .filter((region) => region.active)
                .map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name} · {region.type}
                  </option>
                ))}
            </select>

            <div className="border border-slate-300 bg-[#f5f8fb] p-3">
              <div className="flex items-start gap-2">
                <Star
                  size={16}
                  className="mt-0.5 shrink-0 text-[#18365b]"
                />
                <div>
                  <p className="text-sm font-bold text-[#18365b]">
                    Current default
                  </p>
                  <p className="mt-0.5 text-sm text-[#18365b]">
                    {defaultRegion
                      ? `${defaultRegion.name} · ${defaultRegion.type}`
                      : "Choose a region"}
                  </p>
                  <p className="mt-1 text-xs text-slate-700">
                    {defaultRegion
                      ? `Parent: ${defaultRegion.parent} · Code: ${defaultRegion.code}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 border border-[#d88b2b] bg-[#fff8ed] p-3 text-xs leading-5 text-slate-800">
              <Info size={16} className="mt-0.5 shrink-0" />
              <p>
                In production, validate the selected region against the
                signed-in user's permissions and save the configuration
                through the backend.
              </p>
            </div>
          </div>
        </section>

        {/* Role 1 only: Hazard coverage */}
        {canManageRegions && (
          <section className="overflow-hidden border border-slate-300 bg-white">
            <div className="border-b border-slate-300 bg-[#edf1f5] px-4 py-3 sm:px-5">
              <div className="flex items-start gap-3">
                <div className="border border-slate-300 bg-white p-2 text-[#18365b]">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Hazard coverage
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Enable the hazard categories used by APADA-SETU.
                    Actual incidents remain separate records linked to a region.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4 sm:p-5">
              {hazardOptions.map(
                ({ id, label, description, icon: Icon }) => {
                  const checked = enabledHazards.includes(id);

                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-start gap-3 border p-3 ${
                        checked
                          ? "border-slate-400 bg-[#f5f8fb]"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleHazard(id)}
                        className="mt-1 h-4 w-4 accent-[#18365b]"
                      />

                      <span className="bg-white p-1.5 text-slate-700">
                        <Icon size={17} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {label}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {description}
                        </span>
                      </span>

                      {checked && (
                        <Check
                          size={16}
                          className="mt-0.5 text-[#18365b]"
                        />
                      )}
                    </label>
                  );
                }
              )}

              <p className="pt-1 text-xs text-slate-500">
                {enabledHazards.length} of {hazardOptions.length} hazard
                categories enabled
              </p>
            </div>
          </section>
        )}

        {/* Role 1 only: Configured regions */}
        {canManageRegions && (
          <section className="overflow-hidden border border-slate-300 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-[#edf1f5] px-4 py-4 sm:px-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Configured regions
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Search and review the region records currently loaded in this page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddRegion((open) => !open)}
                className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus size={16} />
                Add region
              </button>
            </div>

            {showAddRegion && (
              <div className="grid gap-3 border-b border-slate-300 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs font-semibold text-slate-600">
                  Region name
                  <input
                    value={newRegionName}
                    onChange={(event) =>
                      setNewRegionName(event.target.value)
                    }
                    placeholder="e.g. Ajmer"
                    className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                  />
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Region type
                  <select
                    value={newRegionType}
                    onChange={(event) =>
                      setNewRegionType(
                        event.target.value as Region["type"]
                      )
                    }
                    className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                  >
                    {(
                      [
                        "State",
                        "District",
                        "Block",
                        "Village / Ward",
                      ] as const
                    ).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  Parent region
                  <input
                    value={newRegionParent}
                    onChange={(event) =>
                      setNewRegionParent(event.target.value)
                    }
                    placeholder="e.g. Rajasthan"
                    className="mt-1 block w-full border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addRegion}
                    className="w-full bg-[#18365b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#102846]"
                  >
                    Add to draft
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search region, parent or code..."
                  className="w-full border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#18365b] focus:ring-1 focus:ring-[#18365b]"
                />
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  size={15}
                  className="text-slate-500"
                />
                <select
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  aria-label="Filter by region type"
                  className="border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All types</option>
                  <option value="State">State</option>
                  <option value="District">District</option>
                  <option value="Block">Block</option>
                  <option value="Village / Ward">Village / Ward</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Region</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Parent</th>
                    <th className="px-5 py-3 font-semibold">Directory code</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Default</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRegions.map((region) => (
                    <tr
                      key={region.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {region.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {region.type}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {region.parent}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                        {region.code}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          <span className="h-1.5 w-1.5 bg-slate-500" />
                          Active
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {region.id === defaultRegionId ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#18365b]">
                            <Star size={13} fill="currentColor" />
                            Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setDefaultRegionId(region.id)
                            }
                            className="text-xs font-semibold text-[#18365b] underline underline-offset-2"
                          >
                            Set default
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredRegions.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-sm text-slate-500"
                      >
                        No regions match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 bg-slate-50 px-4 py-4 sm:px-5">
              <p className="text-xs text-slate-500">
                Showing {filteredRegions.length} region records · Sample data for UI preview
              </p>

              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="inline-flex items-center justify-center gap-2 bg-[#18365b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102846] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save configuration"}
                <ChevronRight size={15} />
              </button>
            </div>

            {message && (
              <div
                role="status"
                className="border-t border-slate-200 px-5 py-3 text-sm text-slate-700"
              >
                {message}
              </div>
            )}
          </section>
        )}

        <p className="text-xs leading-5 text-slate-500">
          The included regions are sample UI data, not a complete official India directory.
          For production, sync authoritative region codes from LGD and persist configuration
          through FastAPI/Firestore.
        </p>
      </div>
    </div>
  );
}
