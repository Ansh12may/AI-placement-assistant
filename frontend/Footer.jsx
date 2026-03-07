import React from 'react';

import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-[1440px] mx-auto px-8 py-16">


        {/* Top */}
        <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-12">


          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white">Placeko</h3>
            <p className="mt-4 text-sm text-slate-400">
               AI-powered career platform helping candidates build better
              resumes, find jobs, and ace interviews.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/resume"       className="hover:text-white transition">Resume Scanner</Link></li>
              <li><Link to="/job-search"   className="hover:text-white transition">Job Search</Link></li>
              <li><Link to="/interviews"   className="hover:text-white transition">Interview Prep</Link></li>
              <li><Link to="/cover-letter" className="hover:text-white transition">Cover Letter</Link></li>
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-white font-semibold mb-4">Tools</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/saved-jobs"  className="hover:text-white transition">Saved Jobs</Link></li>
              <li><Link to="/tracker"     className="hover:text-white transition">Application Tracker</Link></li>
              <li><Link to="/dashboard"   className="hover:text-white transition">Dashboard</Link></li>
              <li><Link to="/signup"      className="hover:text-white transition">Get Started</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login"  className="hover:text-white transition">Login</Link></li>
              <li><Link to="/signup" className="hover:text-white transition">Sign Up</Link></li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Placeko. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
