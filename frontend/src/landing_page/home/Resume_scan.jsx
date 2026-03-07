import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { analyzeResume } from "../../services/api";

export default function Resume_scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setLoading(true);

    try {
      const data = await analyzeResume(file);
      // Persist to sessionStorage so data survives a page refresh
      sessionStorage.setItem("scanResult", JSON.stringify(data));
      navigate("/scan-result", { state: data });
    } catch (err) {
      console.error("Upload failed", err);
      setError("Something went wrong while scanning your resume. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-indigo-600 to-violet-700 py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-violet-900/40 blur-3xl" />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative text-center text-white px-6">
        <span className="inline-block mb-4 px-4 py-1 text-sm rounded-full bg-white/20 backdrop-blur-sm">
          Free • No signup required
        </span>

        <h2 className="text-4xl md:text-5xl font-bold">
          Ready to Scan Your Resume?
        </h2>
        <p className="mt-4 text-indigo-100 text-lg max-w-xl mx-auto">
          Upload your PDF and get an AI-powered ATS score, skill breakdown, and actionable feedback in seconds.
        </p>

        {/* File name preview */}
        {fileName && !loading && !error && (
          <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
            <span>📄</span>
            <span className="font-medium">{fileName}</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-6 inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 backdrop-blur-sm rounded-lg px-5 py-3 text-sm text-red-100">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => { setError(null); fileInputRef.current.click(); }}
            disabled={loading}
            className="px-8 py-4 bg-white text-indigo-700 rounded-xl font-semibold text-lg
                       hover:bg-indigo-50 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Scanning...
              </>
            ) : (
              <>📋 Scan My Resume</>
            )}
          </button>

          <p className="text-indigo-200 text-sm">Supports PDF & TXT • Max 5MB</p>
        </div>
      </div>
    </section>
  );
}