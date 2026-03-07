import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { matchJobsRAG } from "../services/api";

export default function ScanResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [matching, setMatching] = useState(false);

  const raw = state ?? (() => {
    try { return JSON.parse(sessionStorage.getItem("scanResult")); }
    catch { return null; }
  })();

  if (!raw) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
        <div className="text-6xl mb-6">📄</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No scan data found</h2>
        <p className="text-slate-500 mb-6">Upload a resume to see your analysis here.</p>
        <button onClick={() => navigate("/")}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
          Go Home
        </button>
      </div>
    );
  }

  const {
    job_title, skills = [], keywords = [],
    education = [], experience = [], projects = [],
    ai_feedback = "", scores = {},
  } = raw;

  const overall     = scores.overall_score ?? null;
  const scoreColor  = overall >= 80 ? "text-emerald-600" : overall >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBg     = overall >= 80 ? "bg-emerald-50 border-emerald-200" : overall >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
  const scoreLabel  = overall >= 80 ? "Excellent" : overall >= 50 ? "Needs Work" : "Poor — Improve Now";

  const scoreBreakdown = [
    { label: "ATS Compatibility", value: scores.ats_score,        color: "bg-emerald-500" },
    { label: "Keyword Match",     value: scores.keyword_score,    color: "bg-indigo-500"  },
    { label: "Formatting",        value: scores.formatting_score, color: "bg-blue-500"    },
    { label: "Impact Language",   value: scores.impact_score,     color: "bg-amber-500"   },
  ];


  async function handleMatchJobs() {
  setMatching(true);
  try {
    const jobs = await matchJobsRAG({ resumeData: raw });
    navigate("/job-search", { state: { jobs, fromRAG: true } });
  } catch {
    navigate("/job-search", { state: { skills: raw.skills, job_title: raw.job_title } });
  } finally {
    setMatching(false);
  }
}


  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero bar */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-indigo-400 text-sm font-medium mb-1">Resume Analysis Complete</p>
            <h1 className="text-3xl font-bold">Your Scan Results</h1>
            {job_title && (
              <p className="mt-2 text-slate-300">
                Suggested role: <span className="text-indigo-400 font-semibold">{job_title}</span>
              </p>
            )}
          </div>

          {overall !== null && (
            <div className={`rounded-2xl border-2 px-8 py-5 text-center ${scoreBg}`}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Overall Score</p>
              <p className={`text-5xl font-bold ${scoreColor}`}>{overall}<span className="text-2xl">/100</span></p>
              <p className={`text-xs mt-1 font-medium ${scoreColor}`}>{scoreLabel}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">

        {/* Score Breakdown */}
        {scores.ats_score !== undefined && (
          <Card title="📊 Score Breakdown">
            <div className="grid md:grid-cols-2 gap-6">
              {scoreBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className={`font-bold ${item.value >= 80 ? "text-emerald-600" : item.value >= 50 ? "text-amber-500" : "text-red-500"}`}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Tip based on lowest score */}
            {(() => {
              const lowest = scoreBreakdown.reduce((a, b) => a.value < b.value ? a : b);
              const tips = {
                "ATS Compatibility": "Add contact info, education, and at least 5 skills to improve ATS score.",
                "Keyword Match":     "Add more keywords from your target job description to improve match score.",
                "Formatting":        "Add work experience and ensure all resume sections are filled in.",
                "Impact Language":   "Use action verbs like 'developed', 'built', 'improved' in your project descriptions.",
              };
              return lowest.value < 80 ? (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  💡 <strong>Quick win:</strong> {tips[lowest.label]}
                </div>
              ) : null;
            })()}
          </Card>
        )}

        {/* Skills */}
        <Card title="🧠 Skills" count={skills.length}>
          {skills.length === 0 ? (
            <p className="text-slate-400 text-sm">No skills detected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">{s}</span>
              ))}
            </div>
          )}
        </Card>

        {/* ATS Keywords */}
        {keywords.length > 0 && (
          <Card title="🔑 ATS Keywords" count={keywords.length}>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <span key={i} className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm">{kw}</span>
              ))}
            </div>
          </Card>
        )}

        {/* Education */}
        <Card title="🎓 Education">
          {education.length === 0 ? (
            <p className="text-slate-400 text-sm">No education detected</p>
          ) : (
            <ul className="space-y-2">
              {education.map((edu, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <span className="text-indigo-400 mt-0.5">▸</span> {edu}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Experience */}
        <Card title="💼 Experience">
          {experience.length === 0 ? (
            <p className="text-slate-400 text-sm">No formal experience detected — projects may exist below</p>
          ) : (
            <ul className="space-y-2">
              {experience.map((exp, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <span className="text-indigo-400 mt-0.5">▸</span> {exp}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Projects */}
        <Card title="🚀 Projects" count={projects.length}>
          {projects.length === 0 ? (
            <p className="text-slate-400 text-sm">No projects detected</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((proj, i) =>
                typeof proj === "string" ? (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-slate-700 text-sm">{proj}</div>
                ) : (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 bg-white">
                    <h3 className="font-semibold text-slate-900 mb-2">{proj.name}</h3>
                    {proj.tech_stack?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {proj.tech_stack.map((tech, j) => (
                          <span key={j} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 text-xs rounded-md font-medium">{tech}</span>
                        ))}
                      </div>
                    )}
                    {proj.description && <p className="text-slate-600 text-sm">{proj.description}</p>}
                  </div>
                )
              )}
            </div>
          )}
        </Card>

        {/* AI Feedback */}
        {ai_feedback && (
          <Card title="🤖 AI Resume Feedback">
            <div className="space-y-2">
              {ai_feedback.split("\n").filter(l => l.trim()).map((line, i) =>
                line.startsWith("•") ? (
                  <div key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                    <span className="text-indigo-500 font-bold mt-0.5">•</span>
                    <span>{line.slice(1).trim()}</span>
                  </div>
                ) : (
                  <p key={i} className="font-semibold text-slate-800 mt-4 first:mt-0">{line}</p>
                )
              )}
            </div>
          </Card>
        )}

        {/* CTA */}
        {/* CTA */}
<div className="flex flex-col sm:flex-row gap-4 pt-4">
  <button
    onClick={handleMatchJobs}
    disabled={matching}
    className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:opacity-60 transition text-center"
  >
    {matching ? (
      <span className="flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        Finding best matches...
      </span>
    ) : "🔍 Find Matching Jobs"}
  </button>
  <button
    onClick={() => navigate("/resume")}
    className="px-8 py-4 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition"
  >
    Scan Another Resume
  </button>
</div>

      </div>
    </div>
  );
}

function Card({ title, count, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {count !== undefined && (
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}