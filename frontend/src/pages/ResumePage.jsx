import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { analyzeResume } from "../services/api";

export default function ResumePage() {
  const navigate    = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading]   = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError]       = useState(null);
  const [dragOver, setDragOver] = useState(false);

  async function processFile(file) {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setLoading(true);
    try {
      const data = await analyzeResume(file);
      localStorage.setItem("scanResult", JSON.stringify(data));
      navigate("/scan-result", { state: data });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) { processFile(e.target.files[0]); }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Page header — matches other pages */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-indigo-400 text-sm font-medium mb-1">Resume Analysis</p>
          <h1 className="text-3xl font-bold">Scan Your Resume</h1>
          <p className="mt-2 text-slate-300">
            Get your ATS score, skill breakdown, and AI feedback in seconds.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">

        {/* Upload card */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-16 text-center
            ${dragOver
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50"
            }
            ${loading ? "pointer-events-none opacity-70" : ""}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <div>
                <p className="text-slate-800 font-semibold text-lg">Scanning your resume...</p>
                <p className="text-slate-500 text-sm mt-1">This usually takes 10–20 seconds</p>
              </div>
              {fileName && (
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2 text-sm text-slate-600">
                  <span>📄</span><span>{fileName}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl">
                📋
              </div>
              <div>
                <p className="text-slate-800 font-semibold text-xl">
                  {dragOver ? "Drop to upload" : "Drop your resume here"}
                </p>
                <p className="text-slate-500 mt-1">or click to browse files</p>
              </div>
              <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm">
                Choose File
              </button>
              <p className="text-slate-400 text-sm">PDF or TXT · Max 5MB</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3 text-red-700 text-sm">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* What you get */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">What you'll get</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-slate-100">
            {[
              { icon: "📊", title: "ATS Score",        desc: "See how well your resume passes applicant tracking systems" },
              { icon: "🔑", title: "Keyword Analysis",  desc: "Missing keywords that recruiters and ATS systems look for" },
              { icon: "🧠", title: "Skill Breakdown",   desc: "All detected skills mapped to your target role" },
              { icon: "🤖", title: "AI Feedback",       desc: "Specific suggestions to improve content and impact" },
            ].map((item) => (
              <div key={item.title} className="bg-white px-6 py-5 flex items-start gap-4">
                <span className="text-2xl mt-0.5">{item.icon}</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}