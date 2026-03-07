import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { searchJobs, matchJobsRAG } from "../services/api";

const JOB_TYPES = ["All", "Full-time", "Part-time", "Remote", "Internship", "Contract"];

export default function JobPage() {
  const location = useLocation();

  const [mode, setMode]       = useState("keyword"); // "keyword" | "rag"
  const [query, setQuery]     = useState("");
  const [loc, setLoc]         = useState("India");
  const [jobType, setJobType] = useState("All");
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [searched, setSearched] = useState(false);

  // Resume data from sessionStorage (set after resume scan)
  const resumeData = (() => {
    try { return JSON.parse(sessionStorage.getItem("scanResult")); }
    catch { return null; }
  })();

  // On mount — if navigated from ScanResult with RAG jobs, load them directly
  useEffect(() => {
    const state = location.state;
    if (state?.jobs?.length > 0) {
      setJobs(state.jobs);
      setMode("rag");
      setSearched(true);
      if (state.job_title) setQuery(state.job_title);
    } else if (state?.job_title) {
      setQuery(state.job_title);
    }
  }, []);

  // ── Keyword Search ────────────────────────────────────────────────
  async function handleKeywordSearch(kw) {
    const keyword = kw ?? query;
    if (!keyword?.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const results = await searchJobs({
        keywords: keyword,
        location: loc,
        skills:   resumeData?.skills ?? [],
        count:    12,
      });
      const filtered = jobType === "All"
        ? results
        : results.filter(j => j.job_type?.toLowerCase().includes(jobType.toLowerCase()));
      setJobs(filtered);
    } catch {
      setError("Job search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── RAG / AI Match ────────────────────────────────────────────────
  async function handleRAGMatch() {
    if (!resumeData) {
      setError("No resume found. Please scan your resume first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const results = await matchJobsRAG({
        resumeData,
        location: loc,
        count: 9,
      });
      setJobs(results);
    } catch {
      setError("AI matching failed. Try keyword search instead.");
    } finally {
      setLoading(false);
    }
  }

  // ── Mode switch ───────────────────────────────────────────────────
  function handleModeSwitch(newMode) {
    setMode(newMode);
    setJobs([]);
    setSearched(false);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-indigo-400 text-sm font-medium mb-1">Job Search</p>
          <h1 className="text-3xl font-bold">Find Your Next Role</h1>
          <p className="mt-2 text-slate-300">Search by keyword or let AI match jobs to your resume.</p>

          {/* ── Mode Toggle (Slider) ── */}
          <div className="mt-6 inline-flex items-center bg-slate-700/60 rounded-2xl p-1 gap-1">
            <button
              onClick={() => handleModeSwitch("keyword")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === "keyword"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🔍 Keyword Search
            </button>
            <button
              onClick={() => handleModeSwitch("rag")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                mode === "rag"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🤖 AI Resume Match
              {!resumeData && (
                <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-md ml-1">
                  Scan first
                </span>
              )}
            </button>
          </div>

          {/* ── Search bar (keyword mode) ── */}
          {mode === "keyword" && (
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Job title, skill, or keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleKeywordSearch()}
                className="flex-1 px-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Location"
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                className="sm:w-44 px-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => handleKeywordSearch()}
                disabled={loading || !query.trim()}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          )}

          {/* ── AI Match panel ── */}
          {mode === "rag" && (
            <div className="mt-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {resumeData ? (
                <>
                  <div className="flex-1 bg-slate-700/50 rounded-xl px-4 py-3 text-sm">
                    <span className="text-slate-400">Matching for: </span>
                    <span className="text-white font-medium">{resumeData.job_title ?? "your profile"}</span>
                    <span className="text-slate-400 ml-3">· {resumeData.skills?.length ?? 0} skills</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Location"
                    value={loc}
                    onChange={(e) => setLoc(e.target.value)}
                    className="sm:w-44 px-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={handleRAGMatch}
                    disabled={loading}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
                  >
                    {loading ? "Matching..." : "Find Matches"}
                  </button>
                </>
              ) : (
                <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-3 text-sm text-amber-200">
                  ⚠️ No resume scanned yet. <a href="/resume" className="underline font-medium">Scan your resume</a> to use AI matching.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* RAG info banner */}
        {mode === "rag" && !loading && jobs.length > 0 && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex items-center gap-3 text-sm text-indigo-800">
            <span className="text-xl">🤖</span>
            <span>
              <strong>AI-matched jobs</strong> — ranked by semantic similarity to your resume using vector embeddings.
              Higher % = better fit for your specific profile.
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {JOB_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setJobType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                jobType === type
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-10">
            <p className="text-red-500 mb-3">{error}</p>
          </div>
        )}

        {/* Empty states */}
        {!loading && searched && !error && jobs.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-500 text-lg">No jobs found.</p>
            <p className="text-slate-400 text-sm mt-1">
              {mode === "rag" ? "Try keyword search instead." : "Try different keywords or a broader location."}
            </p>
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{mode === "rag" ? "🤖" : "💼"}</div>
            <p className="text-slate-400 text-lg">
              {mode === "rag"
                ? "Click \"Find Matches\" to see AI-ranked jobs for your resume."
                : "Enter a job title or skill to get started."}
            </p>
          </div>
        )}

        {/* Job Cards */}
        {!loading && jobs.length > 0 && (
          <>
            <p className="text-slate-500 text-sm mb-6">
              {jobs.length} {mode === "rag" ? "AI-matched" : ""} results
              {query && mode === "keyword" ? ` for "${query}"` : ""}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h2 className="text-lg font-semibold text-slate-900 leading-snug">{job.title}</h2>
                      {/* Source tag */}
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${
                        job.match_score !== undefined
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {job.match_score !== undefined ? "🤖 AI" : "🔍 Keyword"}
                      </span>
                    </div>

                    <p className="text-indigo-600 text-sm font-medium mb-3">{job.company}</p>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                      {job.location && <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">📍 {job.location}</span>}
                      {job.job_type && <span className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">💼 {job.job_type}</span>}
                      {job.salary  && <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg">💰 {job.salary}</span>}
                    </div>

                    {job.description && (
                      <p className="text-sm text-slate-500 line-clamp-3">{job.description}</p>
                    )}
                  </div>

                  {/* Match score bar — RAG only */}
                  {job.match_score !== undefined && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Resume match</span>
                        <span className={`font-bold ${
                          job.match_score >= 75 ? "text-emerald-600" :
                          job.match_score >= 50 ? "text-amber-500" : "text-slate-400"
                        }`}>
                          {job.match_score}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            job.match_score >= 75 ? "bg-emerald-500" :
                            job.match_score >= 50 ? "bg-amber-400" : "bg-slate-300"
                          }`}
                          style={{ width: `${job.match_score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <a
                    href={job.apply_url ?? job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 block text-center bg-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition"
                  >
                    Apply Now →
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}