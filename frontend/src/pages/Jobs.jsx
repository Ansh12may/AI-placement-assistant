import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchJobs, matchJobsRAG } from "../services/api";

export default function Jobs() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [source, setSource]   = useState("keyword"); // "keyword" | "rag"

  const data = state ?? (() => {
    try { return JSON.parse(sessionStorage.getItem("scanResult")); }
    catch { return null; }
  })();

  useEffect(() => {
    if (!data) return;

    // If RAG jobs were passed directly, use them
    if (state?.jobs?.length > 0) {
      setJobs(state.jobs);
      setSource("rag");
      setLoading(false);
      return;
    }

    // Otherwise fetch via keyword search
    async function loadJobs() {
      try {
        const results = await searchJobs({
          keywords: data.job_title,
          skills:   data.skills,
        });
        setJobs(results);
        setSource("keyword");
      } catch (err) {
        setError("Could not load jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  async function handleRAGMatch() {
    setLoading(true);
    setError(null);
    try {
      const results = await matchJobsRAG({ resumeData: data });
      setJobs(results);
      setSource("rag");
    } catch {
      setError("AI matching failed. Showing keyword results.");
    } finally {
      setLoading(false);
    }
  }

  async function handleKeywordSearch() {
    setLoading(true);
    setError(null);
    try {
      const results = await searchJobs({ keywords: data.job_title, skills: data.skills });
      setJobs(results);
      setSource("keyword");
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-10">
        <div className="text-6xl mb-6">💼</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No resume data found</h2>
        <p className="text-slate-500 mb-6">Scan your resume first to see AI-matched jobs.</p>
        <button onClick={() => navigate("/resume")}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
          Upload Resume
        </button>
      </div>
    );
  }

  const { skills = [], job_title } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-indigo-400 text-sm font-medium mb-1">Job Matching</p>
          <h1 className="text-3xl font-bold">Job Matches for You</h1>
          {job_title && (
            <p className="mt-2 text-slate-300">
              Based on your profile as a <span className="text-indigo-400 font-semibold">{job_title}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {skills.map((skill, i) => (
              <span key={i} className="bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 px-3 py-1 rounded-full text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Source toggle */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleKeywordSearch}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              source === "keyword"
                ? "bg-slate-800 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
            }`}
          >
            🔍 Keyword Match
          </button>
          <button
            onClick={handleRAGMatch}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              source === "rag"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-400"
            }`}
          >
            🤖 AI Semantic Match
          </button>
          <span className="text-xs text-slate-400 ml-2">
            {source === "rag"
              ? "Ranked by semantic similarity to your resume"
              : "Matched by job title and skills keywords"}
          </span>
        </div>

        {/* RAG info banner */}
        {source === "rag" && !loading && jobs.length > 0 && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 text-sm text-indigo-800 flex items-center gap-2">
            <span>🤖</span>
            <span><strong>AI-matched</strong> — jobs ranked by how closely your resume matches each job description using vector embeddings.</span>
          </div>
        )}

        {/* Loading */}
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

        {error && (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={handleKeywordSearch} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm">Retry</button>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-500 text-lg">No matching jobs found.</p>
            <p className="text-slate-400 text-sm mt-2">Try switching between Keyword and AI match.</p>
          </div>
        )}

        {/* Job Cards */}
        {!loading && jobs.length > 0 && (
          <>
            <p className="text-slate-500 text-sm mb-6">
              {jobs.length} {source === "rag" ? "AI-matched" : "keyword"} jobs found
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between">
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
                      {job.salary && <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg">💰 {job.salary}</span>}
                    </div>
                    {job.description && <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{job.description}</p>}
                  </div>

                  {/* Match score bar — only for RAG results */}
                  {job.match_score !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Resume match</span>
                        <span className={`font-bold ${job.match_score >= 75 ? "text-emerald-600" : job.match_score >= 50 ? "text-amber-500" : "text-slate-400"}`}>
                          {job.match_score}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${job.match_score >= 75 ? "bg-emerald-500" : job.match_score >= 50 ? "bg-amber-400" : "bg-slate-300"}`}
                          style={{ width: `${job.match_score}%` }} />
                      </div>
                    </div>
                  )}

                  <a href={job.apply_url ?? job.url} target="_blank" rel="noopener noreferrer"
                    className="mt-5 block text-center bg-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-indigo-700 transition">
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