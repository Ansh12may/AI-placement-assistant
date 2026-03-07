import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, loginWithGoogle } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function Signup() {
  const navigate    = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm]     = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password || !form.confirm) { setError("Please fill in all fields."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const data = await registerUser({ name: form.name, email: form.email, password: form.password });
      setUser(data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message.includes("409") ? "Email already registered." : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-600">Placeko</h1>
          <p className="mt-2 text-sm text-gray-600">Create your account.</p>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <button onClick={loginWithGoogle}
          className="mt-6 w-full flex items-center justify-center gap-3 rounded-md border py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="my-5 flex items-center">
          <div className="flex-grow border-t"/><span className="mx-3 text-xs text-gray-400">OR</span><div className="flex-grow border-t"/>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Full Name", field: "name", type: "text", placeholder: "John Doe" },
            { label: "Email", field: "email", type: "email", placeholder: "you@example.com" },
            { label: "Password", field: "password", type: "password", placeholder: "••••••••" },
            { label: "Confirm Password", field: "confirm", type: "password", placeholder: "••••••••" },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <input type={type} placeholder={placeholder} value={form[field]} onChange={update(field)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;