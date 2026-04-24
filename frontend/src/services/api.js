const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export function getToken()          { return localStorage.getItem("token"); }
export function setToken(token)     { localStorage.setItem("token", token); }
export function clearToken()        { localStorage.removeItem("token"); }

// Every request gets Authorization: Bearer <token> if logged in
function authHeaders() {
  const token = getToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────

export async function registerUser({ name, email, password }) {
  const data = await req("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  setToken(data.token);
  return data;
}

export async function loginUser({ email, password }) {
  const data = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function logoutUser() {
  clearToken();
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) throw new Error("No token");
  return req("/api/auth/me");
}

// Google OAuth — browser redirect, token comes back via URL param
// export function loginWithGoogle() {
//   window.location.href = `${BASE_URL}/api/auth/google`;
// }


export function loginWithGoogle() {
  window.location.href = "http://127.0.0.1:8000/api/auth/google";
}
// Called from /auth/callback page after Google redirect
export function storeTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get("token");
  if (token) { setToken(token); return true; }
  return false;
}

// ─── Resume ──────────────────────────────────────────────

export async function analyzeResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/api/resume/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error(`Resume analysis failed: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error("Backend returned success: false");
  return data.data;
}

// ─── Interview ───────────────────────────────────────────

export async function generateInterviewQuestions(data) {
  return req("/api/interview/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}
export async function generateCodingQuestion(title) {
  return req("/api/interview/coding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
}
export async function generateSystemDesignQuestion(title) {
  return req("/api/interview/system-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
}
export async function startMockInterview(title) {
  return req("/api/interview/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
}
export async function evaluateAnswer(question, answer) {
  return req("/api/interview/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, answer }) });
}

// ─── Jobs ────────────────────────────────────────────────

export async function searchJobs({ keywords, location = "India", skills = [], count = 9 }) {
  const data = await req("/api/jobs/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords, location, skills, count }),
  });
  return data.jobs ?? [];
}

// ─── Saved Jobs ──────────────────────────────────────────

export async function saveJob(job) {
  return req("/api/jobs/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(job) });
}
export async function unsaveJob(jobId) {
  return req(`/api/jobs/save/${jobId}`, { method: "DELETE" });
}
export async function getSavedJobs() {
  const data = await req("/api/jobs/saved");
  return data.jobs ?? [];
}


// ─── Application Tracker ─────────────────────────────────

export async function getApplications() {
  const data = await req("/api/tracker/");
  return data.applications ?? [];
}
export async function addApplication(app) {
  return req("/api/tracker/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(app) });
}
export async function updateApplication(id, { status, notes }) {
  return req(`/api/tracker/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, notes }) });
}
export async function deleteApplication(id) {
  return req(`/api/tracker/${id}`, { method: "DELETE" });
}
export async function getTrackerStats() {
  return req("/api/tracker/stats");
}

// ─── Cover Letter ─────────────────────────────────────────

export async function generateCoverLetter({ jobTitle, company, jobDescription, userName, userSkills, tone }) {
  return req("/api/coverletter/generate", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_title: jobTitle, company, job_description: jobDescription, user_name: userName, user_skills: userSkills ?? [], tone: tone ?? "professional" }),
  });
}
export async function saveCoverLetter({ jobTitle, company, content }) {
  return req("/api/coverletter/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_title: jobTitle, company, content }) });
}
export async function getCoverLetters() {
  const data = await req("/api/coverletter/");
  return data.cover_letters ?? [];
}
export async function deleteCoverLetter(id) {
  return req(`/api/coverletter/${id}`, { method: "DELETE" });
}

export async function matchJobsRAG({ resumeData, location = "India", count = 9 }) {
  const data = await req("/api/jobs/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_data: resumeData,
      location,
      count,
    }),
  });
  return data.jobs ?? [];
}