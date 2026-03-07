import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getTrackerStats, getSavedJobs, getCoverLetters } from "../services/api";

export default function Dashboard() {
  const { user }              = useContext(AuthContext);
  const [stats, setStats]     = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [clCount, setClCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const savedScan = (() => {

    try { return JSON.parse(sessionStorage.getItem("scanResult")); } catch { return null; }
  })();

  useEffect(() => {
    if (!user) { setLoading(false); return; } // don't call APIs if not logged in
    async function load() {
      try {
        const [trackerData, saved, cls] = await Promise.all([
          getTrackerStats(),
          getSavedJobs(),
          getCoverLetters(),
        ]);
        setStats(trackerData.stats);
        setSavedCount(saved.length);
        setClCount(cls.length);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const statCards = [
    { label: "Saved Jobs",         value: savedCount,                  icon: "🔖", color: "bg-indigo-50 text-indigo-700",   link: "/saved-jobs"   },
    { label: "Applications",       value: stats?.applied ?? 0,         icon: "📤", color: "bg-blue-50 text-blue-700",       link: "/tracker"      },
    { label: "Interviews",         value: stats?.interview ?? 0,       icon: "🎤", color: "bg-violet-50 text-violet-700",   link: "/tracker"      },
    { label: "Offers",             value: stats?.offer ?? 0,           icon: "🎉", color: "bg-emerald-50 text-emerald-700", link: "/tracker"      },
    { label: "Cover Letters",      value: clCount,                     icon: "✉️",  color: "bg-amber-50 text-amber-700",    link: "/cover-letter" },
    { label: "Resume Score",       value: savedScan?.ats_score ? `${savedScan.ats_score}%` : "—", icon: "📊", color: "bg-rose-50 text-rose-700", link: "/resume" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's your placement journey at a glance.</p>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
                <div className="h-8 w-8 bg-slate-200 rounded-lg mb-3" />
                <div className="h-7 bg-slate-200 rounded w-12 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {statCards.map((card) => (
              <Link key={card.label} to={card.link}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${card.color}`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-sm text-slate-500 mt-0.5 group-hover:text-indigo-600 transition">{card.label}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Application Pipeline */}
        {stats && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-slate-800 mb-4">Application Pipeline</h2>
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: "saved",     label: "Saved",     color: "bg-slate-200" },
                { key: "applied",   label: "Applied",   color: "bg-blue-200"  },
                { key: "interview", label: "Interview", color: "bg-violet-200"},
                { key: "offer",     label: "Offer",     color: "bg-emerald-200"},
                { key: "rejected",  label: "Rejected",  color: "bg-red-200"   },
              ].map((stage) => (
                <div key={stage.key} className="text-center">
                  <div className={`rounded-xl py-3 ${stage.color} mb-2`}>
                    <p className="text-xl font-bold text-slate-800">{stats[stage.key] ?? 0}</p>
                  </div>
                  <p className="text-xs text-slate-500">{stage.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: "/resume",       icon: "📄", label: "Scan Resume"      },
              { to: "/job-search",   icon: "💼", label: "Search Jobs"      },
              { to: "/interviews",   icon: "🎤", label: "Practice Interview"},
              { to: "/cover-letter", icon: "✉️",  label: "Cover Letter"    },
            ].map((action) => (
              <Link key={action.to} to={action.to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition text-center">
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm text-slate-700 font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Resume scan summary if available */}
        {savedScan && (
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Last Resume Scan</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              {savedScan.job_title && (
                <div className="bg-slate-50 rounded-xl px-4 py-2">
                  <p className="text-xs text-slate-400">Target Role</p>
                  <p className="font-medium text-slate-700">{savedScan.job_title}</p>
                </div>
              )}
              {savedScan.ats_score && (
                <div className="bg-slate-50 rounded-xl px-4 py-2">
                  <p className="text-xs text-slate-400">ATS Score</p>
                  <p className={`font-bold text-lg ${savedScan.ats_score >= 80 ? "text-emerald-600" : savedScan.ats_score >= 50 ? "text-amber-500" : "text-red-500"}`}>
                    {savedScan.ats_score}%
                  </p>
                </div>
              )}
              {savedScan.skills?.length > 0 && (
                <div className="bg-slate-50 rounded-xl px-4 py-2">
                  <p className="text-xs text-slate-400">Skills Found</p>
                  <p className="font-medium text-slate-700">{savedScan.skills.length} skills</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}