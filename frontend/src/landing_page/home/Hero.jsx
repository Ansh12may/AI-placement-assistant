
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-2 md:grid-cols-2 gap-12 items-center">

        {/* Left Content */}
        <div >
          <span className="inline-block mb-4 px-4 py-1 text-sm rounded-full bg-indigo-600/20 text-indigo-400">
            AI Placement Assistant
          </span>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Smart Hiring.<br />
            <span className="text-indigo-500">Smarter Careers.</span>
          </h1>

          <p className="mt-6 text-lg text-slate-300 max-w-xl">
            Placeko uses AI agents to match candidates with the right jobs,
            generate interview questions, and streamline hiring — end to end.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/resume")}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition font-medium"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 rounded-xl border border-slate-600 hover:border-indigo-500 transition font-medium"
            >
              View Dashboard
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex items-center gap-6 text-sm text-slate-400">
            <span>⚡ AI Resume Matching</span>
            <span>🎯 Interview Prep</span>
            <span>💾 Job Matching</span>
          </div>
        </div>

        {/* Right Visual */}
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-600/20 blur-3xl rounded-full"></div>

          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Live AI Matching</h3>

            <ul className="space-y-3 text-slate-300 text-sm">
              <li>✅ Resume parsed & scored</li>
              <li>✅ Jobs matched to your profile </li>
              <li>✅ Interview questions generated</li>
              <li>✅ Cover letter ready</li>
            </ul>

            <div className="mt-6 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-[92%] bg-indigo-500"></div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}