import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, Clock, AlertTriangle, LoaderCircle, Plus, 
  ArrowRight, Shield, Send, Users, ChevronRight, Check, MapPin
} from 'lucide-react';
import { MapComponent } from '../MapComponent';
import { TaskItem, CityLocation } from '../../types';
import { ApiRegion, DisasterIntelligenceResponse } from '../../api';
import { MapPOI } from '../../types';

const TASK_DEADLINE_MS = 48 * 60 * 60 * 1000;

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
};

interface TaskEvacuationModeViewProps {
  city: CityLocation;
  bounds: ApiRegion;
  pois: MapPOI[];
  disasterIntelligence: DisasterIntelligenceResponse | null;
  isLoading: boolean;
  error: string | null;
  showMangroveLayer: boolean;
  onToggleMangrove: (val: boolean) => void;
  showHistoricalLayer: boolean;
  onToggleHistorical: (val: boolean) => void;
  onOpenEvacuationModal: () => void;
  isLightMode?: boolean;
}

export const TaskEvacuationModeView: React.FC<TaskEvacuationModeViewProps> = ({
  city,
  bounds,
  pois,
  disasterIntelligence,
  isLoading,
  error,
  showMangroveLayer,
  onToggleMangrove,
  showHistoricalLayer,
  onToggleHistorical,
  onOpenEvacuationModal,
  isLightMode = true,
}) => {
  const recommendations = disasterIntelligence?.ai_analysis.recommended_tasks;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskDeadlines, setTaskDeadlines] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [operationalDeadline] = useState(() => Date.now() + TASK_DEADLINE_MS);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskWard, setNewTaskWard] = useState(city.name);
  const [newTaskDept, setNewTaskDept] = useState<TaskItem['department']>('Municipal Corp');

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setTasks((recommendations ?? []).map((task, index) => {
      const department = task.department.toLowerCase();
      const priority = task.priority?.toLowerCase();
      const mappedDepartment: TaskItem['department'] = department.includes('ndrf')
        ? 'NDRF'
        : department.includes('pwd')
          ? 'PWD Water Supply'
          : department.includes('health') || department.includes('ems')
            ? 'Health & EMS'
            : department.includes('power') || department.includes('electric')
              ? 'Power Utility'
              : 'Municipal Corp';

      return {
        id: `${disasterIntelligence?.region ?? city.id}-${index}-${task.department}-${task.location}`,
        title: task.description,
        department: mappedDepartment,
        priority: priority === 'critical' ? 'Critical' : priority === 'high' ? 'High' : 'Medium',
        status: 'pending',
        ward: task.location || city.name,
        assignee: task.sub_team || task.department,
        timeRemaining: task.status_text || undefined,
      };
    }));
  }, [city.id, city.name, disasterIntelligence?.region, recommendations]);

  useEffect(() => {
    setNewTaskWard(city.name);
  }, [city.name]);

  const moveTask = (id: string, targetStatus: TaskItem['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: targetStatus } : t));
    setTaskDeadlines(prev => {
      if (targetStatus === 'in_progress') {
        return { ...prev, [id]: prev[id] ?? Date.now() + TASK_DEADLINE_MS };
      }

      const { [id]: _removed, ...remaining } = prev;
      return remaining;
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      department: newTaskDept,
      priority: 'High',
      status: 'pending',
      ward: newTaskWard,
      assignee: 'Locally added',
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-4">
      {/* Top Banner with "Issue Targeted Evacuation" Standard Blue Button */}
      <div className={`border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm transition-colors ${
        isLightMode
          ? 'bg-white border-blue-200'
          : 'bg-slate-900 border-blue-800/60'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
            isLightMode
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-blue-950 border-blue-600/50 text-blue-400'
          }`}>
            <Shield size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Task Management & Evacuation Command
              </h2>
              
            </div>
           
          </div>
        </div>

        {/* Standard Blue Button: Issue Targeted Evacuation matching prompt */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {disasterIntelligence?.risk_zones.some(zone => zone.color === 'red') && (
            <div
              role="timer"
              aria-label={`48-hour countdown: ${formatCountdown(Math.max(0, operationalDeadline - currentTime))} remaining`}
              className={`w-full sm:w-auto px-4 py-2.5 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 border ${
                isLightMode
                  ? 'bg-white text-slate-800 border-slate-300'
                  : 'bg-slate-800 text-slate-100 border-slate-700'
              }`}
            >
              <Clock size={15} />
              <span>
                T-{formatCountdown(Math.max(0, operationalDeadline - currentTime))}
              </span>
            </div>
          )}
          <button
            onClick={onOpenEvacuationModal}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0 border border-blue-400/40 cursor-pointer"
          >
            <Send size={15} />
            <span>Issue Targeted Evacuation</span>
          </button>
        </div>
      </div>

      {error && !disasterIntelligence && (
        <div role="status" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          Disaster intelligence could not be loaded: {error}
        </div>
      )}
      {isLoading && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-950"><LoaderCircle size={14} className="animate-spin" />Loading live response recommendations and mapped resources…</div>}
      {disasterIntelligence?.data_quality.ingestion_error && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Ingestion is incomplete: {disasterIntelligence.data_quality.ingestion_error}
        </div>
      )}

      <section className={`overflow-hidden rounded-xl border shadow-sm ${isLightMode ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'}`}>
        <div className={`flex items-center justify-between border-b px-4 py-3 ${isLightMode ? 'border-slate-100 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
          <h3 className={`flex items-center gap-2 text-sm font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}><MapPin size={15} className="text-blue-600" /> Risk zones & response resources</h3>
          <span className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>{disasterIntelligence?.risk_zones.length ?? 0} API zones</span>
        </div>
        <MapComponent
          cityLabel={city.name}
          bounds={bounds}
          pois={pois}
          riskZones={disasterIntelligence?.risk_zones ?? []}
          isLoading={isLoading}
          emptyMessage="Facility locations were not returned for this region."
        />
      </section>

      {disasterIntelligence?.risk_zones.length ? (
        <section className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${disasterIntelligence.risk_zones.length > 2 ? 'xl:grid-cols-3' : ''}`} aria-label="Risk zone details">
          {disasterIntelligence.risk_zones.map(zone => (
            <div key={zone.id} className={`rounded-lg border p-3 ${zone.color === 'red' ? 'border-rose-200 bg-rose-50' : zone.color === 'orange' ? 'border-orange-200 bg-orange-50' : zone.color === 'yellow' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-xs text-slate-900">{zone.label}</strong>
                <span className="text-[10px] font-semibold uppercase text-slate-600">{zone.radius_km} km radius</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">{zone.description ?? 'Screening zone from disaster intelligence.'}</p>
              {zone.basis?.length ? <p className="mt-1 text-[10px] text-slate-500">Basis: {zone.basis.join(' · ')}</p> : null}
            </div>
          ))}
        </section>
      ) : null}

      {/* API-recommended tasks with local, in-session progress controls. */}
      <div className={`border rounded-xl p-4 shadow-sm transition-colors ${
        isLightMode
          ? 'bg-white border-slate-200/90'
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-bold text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Municipal Emergency Task Operations
            </h3>
            <p className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Actions recommended from the selected region's disaster-intelligence response.
            </p>
          </div>
          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Plus size={14} />
            <span>Add Municipal Task</span>
          </button>
        </div>

        {/* Create Task Quick Form */}
        {isAddingTask && (
          <form onSubmit={handleCreateTask} className={`mb-4 p-3 rounded-xl border text-xs space-y-2 ${
            isLightMode ? 'bg-slate-50 border-blue-200' : 'bg-slate-950 border-blue-900/60'
          }`}>
            <div className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Create New Emergency Action Task
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Task description (e.g. Deploy sandbags...)"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className={`sm:col-span-2 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 ${
                  isLightMode
                    ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500'
                }`}
                autoFocus
              />
              <select
                value={newTaskDept}
                onChange={(e) => setNewTaskDept(e.target.value as any)}
                className={`rounded-lg px-2 py-1.5 ${
                  isLightMode
                    ? 'bg-white border border-slate-300 text-slate-800'
                    : 'bg-slate-900 border border-slate-700 text-slate-200'
                }`}
              >
                <option value="Municipal Corp">Municipal Corp</option>
                <option value="NDRF">NDRF</option>
                <option value="PWD Water Supply">PWD Water Supply</option>
                <option value="Health & EMS">Health & EMS</option>
                <option value="Power Utility">Power Utility</option>
              </select>
              <input
                type="text"
                aria-label="Task location"
                placeholder="Location or area"
                value={newTaskWard}
                onChange={(e) => setNewTaskWard(e.target.value)}
                className={`sm:col-span-3 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 ${
                  isLightMode
                    ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-900 border border-slate-700 text-white placeholder-slate-500'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className={`px-3 py-1 rounded-lg text-xs cursor-pointer ${
                  isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white font-medium rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Save Task
              </button>
            </div>
          </form>
        )}

        {/* 3 Columns Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Pending Column */}
          <div className={`border rounded-xl p-3 flex flex-col ${
            isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-3 border-b text-xs ${
              isLightMode ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className={`font-bold uppercase tracking-wider text-[11px] ${
                  isLightMode ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  Pending
                </span>
              </div>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-400'
              }`}>
                {pendingTasks.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {pendingTasks.map(task => (
                <div key={task.id} className={`p-3 rounded-lg border text-xs space-y-2 shadow-xs ${
                  isLightMode
                    ? 'bg-white border-slate-200/90 text-slate-800'
                    : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-start justify-between gap-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isLightMode
                        ? 'bg-slate-100 text-blue-700 border-blue-200 font-semibold'
                        : 'bg-slate-800 text-cyan-300 border-slate-700'
                    }`}>
                      {task.department}
                    </span>
                    <span className={`text-[10px] font-bold font-mono ${
                      isLightMode ? 'text-amber-800' : 'text-amber-400'
                    }`}>
                      {task.ward}
                    </span>
                  </div>
                  <h4 className={`font-semibold text-xs leading-snug ${
                    isLightMode ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {task.title}
                  </h4>
                  <div className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                    isLightMode ? 'border-slate-100 text-slate-500' : 'border-slate-800/80 text-slate-400'
                  }`}>
                    <span>{task.assignee}</span>
                    <button
                      onClick={() => moveTask(task.id, 'in_progress')}
                      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      Start <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  {isLoading ? 'Loading API recommendations…' : disasterIntelligence ? 'No API-recommended pending tasks' : 'No disaster-intelligence response available'}
                </div>
              )}
            </div>
          </div>

          {/* 2. In-Progress Column */}
          <div className={`border rounded-xl p-3 flex flex-col ${
            isLightMode ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-950/70 border-amber-900/40'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-3 border-b text-xs ${
              isLightMode ? 'border-amber-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className={`font-bold uppercase tracking-wider text-[11px] ${
                  isLightMode ? 'text-amber-900' : 'text-amber-300'
                }`}>
                  In-Progress
                </span>
              </div>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                isLightMode ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}>
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {inProgressTasks.map(task => (
                <div key={task.id} className={`p-3 rounded-lg border text-xs space-y-2 shadow-xs ${
                  isLightMode
                    ? 'bg-white border-amber-200 text-slate-800'
                    : 'bg-slate-900 border-amber-800/40'
                }`}>
                  <div className="flex items-start justify-between gap-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isLightMode
                        ? 'bg-amber-50 text-amber-900 border-amber-200 font-semibold'
                        : 'bg-slate-800 text-amber-300 border-slate-700'
                    }`}>
                      {task.department}
                    </span>
                    <span className={`text-[10px] font-bold font-mono ${
                      isLightMode ? 'text-rose-700' : 'text-rose-400'
                    }`}>
                      {task.ward}
                    </span>
                  </div>
                  <h4 className={`font-semibold text-xs leading-snug ${
                    isLightMode ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {task.title}
                  </h4>
                  <div className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                    isLightMode ? 'border-slate-100 text-slate-500' : 'border-slate-800/80 text-slate-400'
                  }`}>
                    <span className={`flex items-center gap-1 font-semibold ${isLightMode ? 'text-amber-700' : 'text-amber-400'}`}>
                      <Clock size={11} />
                      {taskDeadlines[task.id] !== undefined
                        ? taskDeadlines[task.id] <= currentTime
                          ? '48h deadline passed'
                          : `${formatCountdown(taskDeadlines[task.id] - currentTime)} remaining`
                        : task.timeRemaining ?? '48h response window'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveTask(task.id, 'pending')}
                        className={`${isLightMode ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'} cursor-pointer`}
                        title="Move back"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => moveTask(task.id, 'done')}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        Complete <Check size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {inProgressTasks.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No tasks currently in progress
                </div>
              )}
            </div>
          </div>

          {/* 3. Done Column */}
          <div className={`border rounded-xl p-3 flex flex-col ${
            isLightMode ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-950/70 border-emerald-900/40'
          }`}>
            <div className={`flex items-center justify-between pb-2 mb-3 border-b text-xs ${
              isLightMode ? 'border-emerald-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className={`font-bold uppercase tracking-wider text-[11px] ${
                  isLightMode ? 'text-emerald-900' : 'text-emerald-300'
                }`}>
                  Done
                </span>
              </div>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                isLightMode ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}>
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1">
              {doneTasks.map(task => (
                <div key={task.id} className={`p-3 rounded-lg border text-xs space-y-2 shadow-xs ${
                  isLightMode
                    ? 'bg-white border-emerald-200 text-slate-700 opacity-90'
                    : 'bg-slate-900/60 border-emerald-800/30'
                }`}>
                  <div className="flex items-start justify-between gap-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isLightMode
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                        : 'bg-slate-800 text-emerald-300 border-slate-700'
                    }`}>
                      {task.department}
                    </span>
                    <span className={`text-[10px] font-bold font-mono flex items-center gap-1 ${
                      isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                    }`}>
                      <CheckCircle2 size={11} />
                      Verified
                    </span>
                  </div>
                  <h4 className={`font-medium text-xs leading-snug line-through ${
                    isLightMode ? 'text-slate-500' : 'text-slate-300 opacity-80'
                  }`}>
                    {task.title}
                  </h4>
                  <div className={`flex items-center justify-between pt-1 border-t text-[10px] ${
                    isLightMode ? 'border-slate-100 text-slate-400' : 'border-slate-800/80 text-slate-400'
                  }`}>
                    <span>{task.assignee}</span>
                    <button
                      onClick={() => moveTask(task.id, 'in_progress')}
                      className={`${isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'} cursor-pointer font-medium`}
                      title="Reopen"
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              ))}
              {doneTasks.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No completed tasks yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Progress changes and manually added tasks are local to this session; the API does not persist task status.
      </p>
    </div>
  );
};
