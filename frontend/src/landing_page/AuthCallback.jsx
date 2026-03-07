import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { storeTokenFromUrl, getCurrentUser } from "../services/api";

export default function AuthCallback() {
  const navigate      = useNavigate();
  const { setUser }   = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = storeTokenFromUrl(); // reads ?token= from URL, saves to localStorage
    if (!stored) { setError("No token received."); return; }

    getCurrentUser()
      .then((user) => { setUser(user); navigate("/", { replace: true }); })
      .catch(() => setError("Login failed. Please try again."));
  }, []);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate("/login")} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm">
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <p className="text-slate-500 text-sm">Completing sign-in...</p>
      </div>
    </div>
  );
}