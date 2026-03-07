import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./componenets/ProtectedRoute";

import HomePage      from "./landing_page/home/HomePage";
import Login         from "./landing_page/Login/Login";
import Signup        from "./landing_page/signup/Signup";
import AuthCallback  from "./landing_page/AuthCallback";
import ScanResult    from "./pages/ScanResult";
import Jobs          from "./pages/Jobs";
import ResumePage    from "./pages/resume_page";
import InterviewPage from "./pages/Interview_page";
import JobPage       from "./pages/job_page";
import SavedJobs     from "./pages/SavedJobs";
import Tracker       from "./pages/Tracker";
import Dashboard     from "./pages/Dashboard";
import CoverLetter   from "./pages/CoverLetter";

import Navbar from "../Navbar";
import Footer from "../Footer";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/"             element={<HomePage />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/signup"       element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes — must be logged in */}
        <Route path="/resume" element={
          <ProtectedRoute><ResumePage /></ProtectedRoute>
        } />
        <Route path="/scan-result" element={
          <ProtectedRoute><ScanResult /></ProtectedRoute>
        } />
        <Route path="/jobs" element={
          <ProtectedRoute><Jobs /></ProtectedRoute>
        } />
        <Route path="/interview"  element={
          <ProtectedRoute><InterviewPage /></ProtectedRoute>
        } />
        <Route path="/interviews" element={
          <ProtectedRoute><InterviewPage /></ProtectedRoute>
        } />
        <Route path="/job-search" element={
          <ProtectedRoute><JobPage /></ProtectedRoute>
        } />
        <Route path="/saved-jobs" element={
          <ProtectedRoute><SavedJobs /></ProtectedRoute>
        } />
        <Route path="/tracker" element={
          <ProtectedRoute><Tracker /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/cover-letter" element={
          <ProtectedRoute><CoverLetter /></ProtectedRoute>
        } />
      </Routes>
      <Footer />
    </AuthProvider>
  );
}

export default App;