import { useState } from "react";
import { analyzeResume } from "../services/resumeApi";
import ResumeResult from "./ResumeResult";

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const response = await analyzeResume(file);
      setResult(response.data); // ✅ IMPORTANT
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          type="submit"
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Analyze Resume
        </button>
      </form>

      {loading && <p className="mt-4">Analyzing resume...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {result && <ResumeResult data={result} />}
    </div>
  );
}
