import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { regionApi } from "../services/regionApi";
import type {
  Region as ApiRegion,
  Hazard,
  RegionConfiguration,
} from "../services/regionApi";

interface RegionPageProps {
  currentUserRole?: string;
  initialDefaultRegionId?: string;
}

interface Region extends ApiRegion {
  hazardIds?: string[];
}

interface RegionForm {
  name: string;
  code: string;
  parentRegionId: string;
  hazardIds: string[];
}

const isRoleOne = (role?: string) =>
  ["role_1", "1", "level_1"].includes(
    (role || "").toLowerCase().trim()
  );

const emptyForm: RegionForm = {
  name: "",
  code: "",
  parentRegionId: "",
  hazardIds: [],
};

const inputClass =
  "mt-1 w-full border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#18365b] focus:ring-1 focus:ring-[#18365b]";

export default function RegionPage({
  currentUserRole,
  initialDefaultRegionId,
}: RegionPageProps) {
  const canManage = isRoleOne(currentUserRole);

  const [regions, setRegions] = useState<Region[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [defaultRegionId, setDefaultRegionId] = useState<string | null>(
    initialDefaultRegionId ?? null
  );

  const [form, setForm] = useState<RegionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeRegions = regions.filter((region) => region.active !== false);
  const selectedDefault = regions.find(
    (region) => region.id === defaultRegionId
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [regionResult, hazardResult, config] = await Promise.all([
        regionApi.getRegions(),
        regionApi.getHazards(),
        regionApi.getConfiguration(),
      ]);

      setRegions(regionResult.items as Region[]);
      setHazards(hazardResult.items);

      setDefaultRegionId(
        config.defaultRegionId ?? initialDefaultRegionId ?? null
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load regions."
      );
    } finally {
      setLoading(false);
    }
  }, [initialDefaultRegionId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError("");
    setMessage("");
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (region: Region) => {
    setError("");
    setMessage("");
    setForm({
      name: region.name || "",
      code: region.code || "",
      parentRegionId: region.parentRegionId || "",
      hazardIds: region.hazardIds || [],
    });
    setEditingId(region.id);
    setShowForm(true);
  };

  const toggleHazard = (hazardId: string) => {
    setForm((current) => ({
      ...current,
      hazardIds: current.hazardIds.includes(hazardId)
        ? current.hazardIds.filter((id) => id !== hazardId)
        : [...current.hazardIds, hazardId],
    }));
  };

  const saveRegion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManage) return;

    if (!form.name.trim()) {
      setError("Region name is required.");
      return;
    }

    if (form.hazardIds.length === 0) {
      setError("Please select at least one hazard.");
      return;
    }

    if (editingId && form.parentRegionId === editingId) {
      setError("A region cannot be its own parent.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        parentRegionId: form.parentRegionId || null,
        type: editingId
          ? regions.find((region) => region.id === editingId)?.type || "district"
          : "district",
        active: editingId
          ? regions.find((region) => region.id === editingId)?.active !== false
          : true,
        hazardIds: form.hazardIds,
      };

      if (editingId) {
        await regionApi.updateRegion(editingId, payload);
        setMessage("Region updated successfully.");
      } else {
        await regionApi.createRegion(payload);
        setMessage("Region created successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save region."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRegion = async (region: Region) => {
    if (!canManage) return;

    const confirmed = window.confirm(
      `Delete region "${region.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await regionApi.deleteRegion(region.id);

      if (editingId === region.id) resetForm();

      setMessage("Region deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete region."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveDefault = async () => {
    if (!defaultRegionId) {
      setError("Please select a default region.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const config: RegionConfiguration = await regionApi.getConfiguration();

      await regionApi.saveConfiguration({
        ...config,
        defaultRegionId,
      });

      setMessage("Default region saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save default region."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 bg-slate-50 text-sm text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading regions...
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f3f5f7] p-4 text-slate-800 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Messages */}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="flex items-center gap-2 border border-green-300 bg-green-50 p-3 text-sm text-green-800"
          >
            <CheckCircle2 size={17} />
            <span>{message}</span>
          </div>
        )}

        {/* Default region: all roles */}

        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-300 bg-slate-100 p-4">
            <h2 className="font-bold">Default Dashboard Region</h2>
            <p className="mt-1 text-xs text-slate-600">
              Available to all roles.
            </p>
          </div>

          <div className="space-y-4 p-4">
            <label className="block text-sm font-semibold">
              Select region
              <select
                value={defaultRegionId ?? ""}
                onChange={(event) =>
                  setDefaultRegionId(event.target.value || null)
                }
                className={inputClass}
              >
                <option value="">Choose a region</option>
                {activeRegions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                    {region.code ? ` (${region.code})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-xs text-slate-500">Current default</p>
                <p className="mt-1 font-semibold text-[#18365b]">
                  {selectedDefault?.name || "No default selected"}
                </p>
              </div>

              <button
                type="button"
                disabled={saving || !defaultRegionId}
                onClick={() => void saveDefault()}
                className="inline-flex items-center gap-2 bg-[#18365b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102846] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Set Default
              </button>
            </div>
          </div>
        </section>

        {/* Region management: Role 1 only */}

        {canManage && (
          <section className="border border-slate-300 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-slate-100 p-4">
              <div>
                <h2 className="font-bold">Regions</h2>
                <p className="mt-1 text-xs text-slate-600">
                  Create, edit or delete a region and its applicable hazards.
                </p>
              </div>

              <button
                type="button"
                onClick={showForm ? resetForm : openCreateForm}
                className="inline-flex items-center gap-2 bg-[#18365b] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#102846]"
              >
                {showForm ? <X size={16} /> : <Plus size={16} />}
                {showForm ? "Cancel" : "Create Region"}
              </button>
            </div>

            {/* Create/Edit form */}

            {showForm && (
              <form onSubmit={saveRegion} className="space-y-4 border-b border-slate-300 bg-slate-50 p-4">
                <h3 className="font-bold">
                  {editingId ? "Edit Region" : "Create Region"}
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Region Name *
                    <input
                      required
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Jodhpur"
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-medium">
                    Region Code
                    <input
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          code: event.target.value,
                        }))
                      }
                      placeholder="e.g. JDH"
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-medium sm:col-span-2">
                    Parent Region
                    <select
                      value={form.parentRegionId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          parentRegionId: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">No parent region</option>
                      {activeRegions
                        .filter((region) => region.id !== editingId)
                        .map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                {/* Hazards belong to this region */}

                <div className="border border-slate-300 bg-white p-3">
                  <h4 className="text-sm font-semibold">
                    Applicable Hazards *
                  </h4>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {hazards.map((hazard) => (
                      <label
                        key={hazard.id}
                        className="flex cursor-pointer items-center gap-2 border border-slate-200 p-3 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.hazardIds.includes(hazard.id)}
                          onChange={() => {
                            setForm((current) => ({
                              ...current,
                              hazardIds: current.hazardIds.includes(hazard.id)
                                ? current.hazardIds.filter(
                                    (id) => id !== hazard.id
                                  )
                                : [...current.hazardIds, hazard.id],
                            }));
                          }}
                          className="h-4 w-4 accent-[#18365b]"
                        />
                        <span className="text-sm">{hazard.name}</span>
                      </label>
                    ))}
                  </div>

                  {hazards.length === 0 && (
                    <p className="mt-2 text-sm text-amber-700">
                      No hazards found. Check the hazard API.
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-500">
                    {form.hazardIds.length} hazard(s) selected
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || hazards.length === 0}
                    className="inline-flex items-center gap-2 bg-[#18365b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {editingId ? "Update Region" : "Create Region"}
                  </button>
                </div>
              </form>
            )}

            {/* Region list */}

            <div className="divide-y divide-slate-200">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {region.name}
                      {region.id === defaultRegionId && (
                        <span className="ml-2 text-xs font-medium text-green-700">
                          Default
                        </span>
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Code: {region.code || "—"} · Parent:{" "}
                      {region.parentName ||
                        regions.find(
                          (item) => item.id === region.parentRegionId
                        )?.name ||
                        "—"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Hazards:{" "}
                      {region.hazardIds?.length
                        ? region.hazardIds
                            .map(
                              (id) =>
                                hazards.find((hazard) => hazard.id === id)
                                  ?.name || id
                            )
                            .join(", ")
                        : "Not assigned"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(region)}
                      className="inline-flex items-center gap-1 border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#18365b] hover:bg-slate-50"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete region "${region.name}"?`
                          )
                        ) {
                          void deleteRegion(region);
                        }
                      }}
                      className="inline-flex items-center gap-1 border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>

                    {region.id !== defaultRegionId && (
                      <button
                        type="button"
                        onClick={() => setDefaultRegionId(region.id)}
                        className="border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        Select Default
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {regions.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-500">
                  No regions available. Create your first region.
                </p>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-4">
              <button
                type="button"
                disabled={saving || !defaultRegionId}
                onClick={() => void saveDefault()}
                className="inline-flex items-center gap-2 bg-[#18365b] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save size={16} />
                Save Default Region
              </button>
            </div>
          </section>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-[#18365b]"
          >
            <RefreshCw size={14} />
            Refresh data
          </button>
        </div>
      </div>
    </div>
  );
}
