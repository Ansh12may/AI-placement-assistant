import { useState, useEffect } from "react";
import { getApplications, updateApplication, deleteApplication } from "../services/api";

const COLUMNS = [
  { key: "saved",     label: "Saved",     color: "bg-slate-100 text-slate-700",   dot: "bg-slate-400"   },
  { key: "applied",   label: "Applied",   color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"    },
  { key: "interview", label: "Interview", color: "bg-violet-100 text-violet-700", dot: "bg-violet-500"  },
  { key: "offer",     label: "Offer 🎉",  color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { key: "rejected",  label: "Rejected",  color: "bg-red-100 text-red-700",       dot: "bg-red-400"     },
];

export default function Tracker() {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [editId, setEditId]   = useState(null);
  const [notes, setNotes]     = useState("");

  useEffect(() => { fetchApps(); }, []);

  async function fetchApps() {
    try { setApps(await getApplications()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateApplication(id, { status });
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    } catch {}
  }

  async function handleSaveNotes(id) {
    try {
      await updateApplication(id, { notes, status: apps.find((a) => a.id === id)?.status });
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, notes } : a));
      setEditId(null);
    } catch {}
  }

  async function handleDelete(id) {
    try {
      await deleteApplication(id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  }

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = apps.filter((a) => a.status === col.key);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
          <p className="text-slate-500 mt-1">Track every job application in one place</p>
        </div>

        {loading && <p className="text-slate-400 text-sm">Loading...</p>}
        {error   && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-6">❌ {error}</div>}

        {!loading && apps.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">🗂️</div>
            <p className="font-medium text-slate-600">No applications tracked yet</p>
            <p className="text-sm mt-1">Save a job and click "Track" to add it here</p>
          </div>
        )}

        {/* Kanban Board */}
        {!loading && apps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.key}>
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {grouped[col.key].length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {grouped[col.key].map((app) => (
                    <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{app.title}</p>
                          <p className="text-xs text-slate-500 truncate">{app.company}</p>
                          {app.location && <p className="text-xs text-slate-400">{app.location}</p>}
                        </div>
                        <button onClick={() => handleDelete(app.id)}
                          className="text-slate-300 hover:text-red-400 transition shrink-0 text-xs">
                          ✕
                        </button>
                      </div>

                      {/* Status selector */}
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className="mt-3 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>

                      {/* Notes */}
                      {editId === app.id ? (
                        <div className="mt-2">
                          <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            placeholder="Add notes..."
                          />
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => handleSaveNotes(app.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Save</button>
                            <button onClick={() => setEditId(null)}
                              className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {app.notes && <p className="text-xs text-slate-500 italic mb-1">{app.notes}</p>}
                          <button
                            onClick={() => { setEditId(app.id); setNotes(app.notes ?? ""); }}
                            className="text-xs text-slate-400 hover:text-indigo-600 transition"
                          >
                            {app.notes ? "Edit notes" : "+ Add notes"}
                          </button>
                        </div>
                      )}

                      {app.url && (
                        <a href={app.url} target="_blank" rel="noopener noreferrer"
                          className="mt-2 block text-xs text-indigo-600 hover:underline truncate">
                          View job →
                        </a>
                      )}
                    </div>
                  ))}

                  {grouped[col.key].length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-300">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}