import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { generateCoverLetter, saveCoverLetter } from "../services/api";

const TONES = ["professional", "enthusiastic", "concise"];

export default function CoverLetter() {
  const { user } = useContext(AuthContext);

  const savedScan = (() => {
    try { return JSON.parse(sessionStorage.getItem("scanResult")); } catch { return null; }
  })();

  const [form, setForm] = useState({
    jobTitle:       "",
    company:        "",
    jobDescription: "",
    tone:           "professional",
  });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const [saved, setSaved]     = useState(false);
  const [copied, setCopied]   = useState(false);

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  async function handleGenerate() {
    if (!form.jobTitle || !form.company || !form.jobDescription) {
      setError("Please fill in job title, company, and job description."); return;
    }
    setLoading(true); setError(null); setResult(null); setSaved(false);
    try {
      const res = await generateCoverLetter({
        jobTitle:       form.jobTitle,
        company:        form.company,
        jobDescription: form.jobDescription,
        userName:       user?.name,
        userSkills:     savedScan?.skills ?? [],
        tone:           form.tone,
      });
      setResult(res.cover_letter);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await saveCoverLetter({ jobTitle: form.jobTitle, company: form.company, content: result });
      setSaved(true);
    } catch {}
    finally { setSaving(false); }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-indigo-400 text-sm font-medium mb-1">AI-Powered</p>
          <h1 className="text-3xl font-bold">Cover Letter Generator</h1>
          <p className="mt-2 text-slate-300">Paste a job description and get a tailored cover letter in seconds.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-6">

          {/* Input form */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-slate-800">Job Details</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                <input type="text" placeholder="e.g. Frontend Developer" value={form.jobTitle} onChange={update("jobTitle")}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input type="text" placeholder="e.g. Google" value={form.company} onChange={update("company")}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
                <textarea rows={6} placeholder="Paste the full job description here..." value={form.jobDescription} onChange={update("jobDescription")}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
                <div className="flex gap-2">
                  {TONES.map((t) => (
                    <button key={t} onClick={() => setForm((p) => ({ ...p, tone: t }))}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition ${
                        form.tone === t ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {savedScan?.skills?.length > 0 && (
                <p className="text-xs text-indigo-600">✅ Using {savedScan.skills.length} skills from your resume scan</p>
              )}

              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">❌ {error}</div>}

              <button onClick={handleGenerate} disabled={loading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Generating...</>
                ) : "✨ Generate Cover Letter"}
              </button>
            </div>
          </div>

          {/* Result */}
          <div>
            {!result && !loading && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full flex items-center justify-center text-center text-slate-400">
                <div>
                  <div className="text-4xl mb-3">✉️</div>
                  <p className="text-slate-500 font-medium">Your cover letter will appear here</p>
                  <p className="text-sm mt-1">Fill in the details and click Generate</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-3">
                {[1,2,3,4,5].map((i) => <div key={i} className={`h-4 bg-slate-100 rounded ${i === 5 ? "w-2/3" : "w-full"}`} />)}
              </div>
            )}

            {result && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800">Cover Letter</h2>
                  <div className="flex gap-2">
                    <button onClick={handleCopy}
                      className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition">
                      {copied ? "Copied ✅" : "Copy"}
                    </button>
                    <button onClick={handleSave} disabled={saving || saved}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition">
                      {saved ? "Saved ✅" : saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100 rounded-xl p-4 bg-slate-50 max-h-[500px] overflow-y-auto">
                  {result}
                </div>
                <button onClick={handleGenerate}
                  className="mt-4 w-full py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition">
                  Regenerate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}