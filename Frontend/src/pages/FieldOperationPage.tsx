import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  MapPin,
  MessageSquareText,
  Paperclip,
  Plus,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react';

type TaskStatus = 'Assigned' | 'In Progress' | 'Submitted';
type Priority = 'Urgent' | 'High' | 'Normal';

interface FieldTask {
  id: string;
  title: string;
  location: string;
  assignedBy: string;
  due: string;
  priority: Priority;
  status: TaskStatus;
  progress: number;
  description: string;
}

const INITIAL_TASKS: FieldTask[] = [
  {
    id: 'F-1042',
    title: 'Assess flood impact in affected ward',
    location: 'Ward 08 · Riverside Zone',
    assignedBy: 'Operations Planning Cell',
    due: 'Today, 14:30',
    priority: 'Urgent',
    status: 'In Progress',
    progress: 60,
    description: 'Record water level, affected households, access routes and urgent assistance requirements.',
  },
  {
    id: 'F-1038',
    title: 'Verify temporary shelter readiness',
    location: 'Government School Relief Centre',
    assignedBy: 'District Control Room',
    due: 'Today, 16:00',
    priority: 'High',
    status: 'Assigned',
    progress: 0,
    description: 'Check capacity, drinking water, sanitation, accessibility and available supplies.',
  },
  {
    id: 'F-1029',
    title: 'Report blocked access road',
    location: 'North Link Road · Sector 3',
    assignedBy: 'Operations Planning Cell',
    due: 'Today, 12:00',
    priority: 'Normal',
    status: 'Submitted',
    progress: 100,
    description: 'Submit obstruction details and supporting field observations for review.',
  },
];

const priorityClass: Record<Priority, string> = {
  Urgent: 'border-red-200 bg-red-50 text-red-700',
  High: 'border-amber-200 bg-amber-50 text-amber-800',
  Normal: 'border-slate-200 bg-slate-100 text-slate-600',
};

const statusClass: Record<TaskStatus, string> = {
  Assigned: 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-blue-50 text-blue-800',
  Submitted: 'bg-emerald-50 text-emerald-800',
};

export default function FieldOperationsPage() {
  const [tasks, setTasks] = useState<FieldTask[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<'All' | TaskStatus>('All');
  const [query, setQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(INITIAL_TASKS[0].id);
  const [reportText, setReportText] = useState('');
  const [peopleAssisted, setPeopleAssisted] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [notice, setNotice] = useState('');

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === 'All' || task.status === filter;
    const searchText = `${task.title} ${task.location} ${task.id}`.toLowerCase();
    return matchesFilter && searchText.includes(query.toLowerCase());
  }), [tasks, filter, query]);

  const stats = {
    assigned: tasks.filter((task) => task.status === 'Assigned').length,
    progress: tasks.filter((task) => task.status === 'In Progress').length,
    submitted: tasks.filter((task) => task.status === 'Submitted').length,
    urgent: tasks.filter((task) => task.priority === 'Urgent' && task.status !== 'Submitted').length,
  };

  const updateStatus = (status: TaskStatus) => {
    setTasks((current) => current.map((task) => task.id === selectedTaskId
      ? { ...task, status, progress: status === 'Submitted' ? 100 : status === 'In Progress' ? Math.max(task.progress, 10) : task.progress }
      : task));
    setNotice(status === 'Submitted' ? 'Field report marked as submitted in this demo.' : `Task status updated to ${status}.`);
  };

  const submitReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reportText.trim()) {
      setNotice('Please enter field observations before submitting the report.');
      return;
    }
    updateStatus('Submitted');
    setNotice('Field report saved in this demo. Connect this form to your API to persist reports.');
    setReportText('');
  };

  return (
    <main className="">
      <div className=" space-y-6">
        

        {notice && (
          <div role="status" className="flex items-start justify-between gap-3 border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={16} /></button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Assigned Tasks" value={stats.assigned + stats.progress} hint="Tasks requiring action" icon={ClipboardList} />
          <StatCard label="In Progress" value={stats.progress} hint="Active field work" icon={Clock3} />
          <StatCard label="Reports Submitted" value={stats.submitted} hint="Sent for review" icon={CheckCircle2} />
          <StatCard label="Urgent Attention" value={stats.urgent} hint="Priority response required" icon={AlertTriangle} />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="min-w-0 border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-[#18365b]">My Assigned Tasks</h2>
                <p className="mt-1 text-xs text-slate-500">Select a task to update its field status.</p>
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks..."
                  className="w-full border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#18365b] sm:w-48" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3">
              {(['All', 'Assigned', 'In Progress', 'Submitted'] as const).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)}
                  className={`border px-3 py-1.5 text-xs font-medium ${filter === item ? 'border-[#18365b] bg-[#18365b] text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {item}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-200">
              {visibleTasks.map((task) => (
                <button type="button" key={task.id} onClick={() => { setSelectedTaskId(task.id); setNotice(''); }}
                  className={`block w-full p-4 text-left transition-colors hover:bg-slate-50 ${selectedTaskId === task.id ? 'border-l-4 border-l-[#d88b2b] bg-blue-50/50' : 'border-l-4 border-l-transparent'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{task.id}</p>
                      <h3 className="mt-1 text-sm font-semibold text-slate-900">{task.title}</h3>
                    </div>
                    <span className={`border px-2 py-1 text-[10px] font-semibold ${priorityClass[task.priority]}`}>{task.priority}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={13} />{task.location}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className={`px-2 py-1 text-[10px] font-semibold ${statusClass[task.status]}`}>{task.status}</span>
                    <span className="text-[10px] text-slate-500">Due: {task.due}</span>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100">
                    <div className="h-1.5 bg-[#18365b]" style={{ width: `${task.progress}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-slate-500">{task.progress}% complete</p>
                </button>
              ))}
              {visibleTasks.length === 0 && <p className="p-6 text-sm text-slate-500">No tasks match your search.</p>}
            </div>
          </section>

          <div className="space-y-6">
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected task</p>
                <h2 className="mt-1 text-lg font-bold text-[#18365b]">{selectedTask.title}</h2>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><MapPin size={13} />{selectedTask.location}</p>
              </div>
              <div className="space-y-4 p-4">
                <p className="text-sm leading-6 text-slate-600">{selectedTask.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCell label="Assigned by" value={selectedTask.assignedBy} />
                  <InfoCell label="Due time" value={selectedTask.due} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">Task progress</span>
                    <span className="font-bold text-[#18365b]">{selectedTask.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100"><div className="h-2 bg-[#18365b]" style={{ width: `${selectedTask.progress}%` }} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateStatus('In Progress')}
                    className="inline-flex items-center gap-2 border border-[#18365b] px-3 py-2 text-xs font-semibold text-[#18365b] hover:bg-blue-50">
                    <ArrowUpRight size={14} /> Start / Update
                  </button>
                  <button type="button" onClick={() => updateStatus('Submitted')}
                    className="inline-flex items-center gap-2 bg-[#18365b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#102744]">
                    <CheckCircle2 size={14} /> Mark Submitted
                  </button>
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-4">
                <h2 className="font-bold text-[#18365b]">Field Situation Report</h2>
                <p className="mt-1 text-xs text-slate-500">Record observations for the selected task.</p>
              </div>
              <form onSubmit={submitReport} className="space-y-4 p-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Field observations <span className="text-red-600">*</span>
                  <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} rows={3}
                    placeholder="Describe ground conditions, damage, access and risks..."
                    className="mt-1.5 block w-full resize-y border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-[#18365b]" />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    People assisted
                    <input type="number" min="0" value={peopleAssisted} onChange={(e) => setPeopleAssisted(e.target.value)}
                      placeholder="e.g. 25" className="mt-1.5 block w-full border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-[#18365b]" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Location / landmark
                    <input value={locationNote} onChange={(e) => setLocationNote(e.target.value)}
                      placeholder="Ward, road or landmark" className="mt-1.5 block w-full border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-[#18365b]" />
                  </label>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-xs text-slate-600"><Paperclip size={14} /> Photo evidence upload can be connected here</span>
                  <span className="text-[10px] text-slate-400">UI placeholder</span>
                </div>
                <button type="submit" className="inline-flex w-full items-center justify-center gap-2 bg-[#18365b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#102744]">
                  <Send size={15} /> Submit Field Report
                </button>
                <p className="text-[10px] leading-4 text-slate-500">Demo UI: connect the form to your FastAPI endpoint to persist reports.</p>
              </form>
            </section>

            <section className="border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <h2 className="text-sm font-bold text-amber-900">Safety / resource escalation</h2>
                  <p className="mt-1 text-xs leading-5 text-amber-800">Report blocked routes, urgent medical needs, unsafe structures or resource shortages to the control room promptly.</p>
                  <button type="button" onClick={() => setNotice('Escalation workflow placeholder: connect this action to your alert/report API.')}
                    className="mt-3 inline-flex items-center gap-2 border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                    <MessageSquareText size={14} /> Raise an escalation
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
        
      </div>
    </main>
  );
}

function StatCard({ label, value, hint, icon: Icon }: { label: string; value: number; hint: string; icon: React.ElementType }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#18365b]">{value}</p>
          <p className="mt-1 text-[10px] text-slate-500">{hint}</p>
        </div>
        <div className="border border-slate-200 bg-slate-50 p-2 text-[#18365b]"><Icon size={18} /></div>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-medium text-slate-800">{value}</p>
    </div>
  );
}
