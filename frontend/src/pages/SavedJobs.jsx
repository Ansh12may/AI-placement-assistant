import { useState, useEffect } from "react";
import { getSavedJobs, unsaveJob, addApplication } from "../services/api";

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]  = useState(null);
  const [toast, setToast]  = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    try {
      setJobs(await getSavedJobs());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUnsave(jobId) {
    try {
      await unsaveJob(jobId);
      setJobs((prev) => prev.filter((j) => j.job_id !== jobId));
      showToast("Job removed from saved");
    } catch {}
  }

  async function handleTrack(job) {
    try {
      await addApplication({
        job_id: job.job_id, title: job.title, company: job.company,
        location: job.location, url: job.url, salary: job.salary, status: "applied",
      });
      showToast("Added to Application Tracker ✅");
    } catch (err) {
      if (err.message.includes("409")) showToast("Already in tracker");
      else showToast("Failed to add to tracker");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-5 py-3 rounded-xl text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Saved Jobs</h1>
          <p className="text-slate-500 mt-1">{jobs.length} job{jobs.length !== 1 ? "s" : ""} saved</p>
        </div>

        {loading && <SkeletonList />}
        {error   && <ErrorBox error={error} />}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">🔖</div>
            <p className="font-medium text-slate-600">No saved jobs yet</p>
            <p className="text-sm mt-1">Save jobs from the Job Search page to see them here</p>
          </div>
        )}

        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.job_id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{job.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{job.company}{job.location ? ` • ${job.location}` : ""}</p>
                  {job.salary && <p className="text-sm text-emerald-600 mt-1">{job.salary}</p>}
                  {job.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{job.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">Saved {new Date(job.saved_at).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition text-center">
                      Apply
                    </a>
                  )}
                  <button onClick={() => handleTrack(job)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-xl hover:bg-slate-200 transition">
                    Track
                  </button>
                  <button onClick={() => handleUnsave(job.job_id)}
                    className="px-4 py-2 text-red-500 text-sm rounded-xl hover:bg-red-50 transition">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1,2,3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

function ErrorBox({ error }) {
  return <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">❌ {error}</div>;
}