import { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "./src/context/AuthContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const navStyle = ({ isActive }) =>
    isActive
      ? "text-indigo-600 font-semibold"
      : "text-gray-600 hover:text-indigo-600";

  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">

          {/* Logo */}
          <NavLink to="/" className="text-3xl font-bold text-indigo-600">
            Placeko
          </NavLink>

          {/* Desktop Links */}
          <div className="flex items-center gap-6">
            <NavLink to="/resume" className={navStyle}>Resume Analysis</NavLink>
            <NavLink to="/job-search" className={navStyle}>Job Search</NavLink>
            <NavLink to="/interviews" className={navStyle}>Interview Prep</NavLink>
            <NavLink to="/saved-jobs" className={navStyle}>Saved Jobs</NavLink>
            <NavLink to="/tracker" className={navStyle}>Tracker</NavLink>
            <NavLink to="/cover-letter" className={navStyle}>Cover Letter</NavLink>
            <NavLink to="/dashboard" className={navStyle}>Dashboard</NavLink>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-600 text-sm">
                  Hi, {user.name?.split(" ")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navStyle}>Login</NavLink>
                <NavLink
                  to="/signup"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Sign up
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="space-y-2 px-4 py-4">

            <NavLink to="/resume" className={navStyle} onClick={() => setIsOpen(false)}>Resume Analysis</NavLink>
            <NavLink to="/job-search" className={navStyle} onClick={() => setIsOpen(false)}>Job Search</NavLink>
            <NavLink to="/interviews" className={navStyle} onClick={() => setIsOpen(false)}>Interview Prep</NavLink>
            <NavLink to="/saved-jobs" className={navStyle} onClick={() => setIsOpen(false)}>Saved Jobs</NavLink>
            <NavLink to="/tracker" className={navStyle} onClick={() => setIsOpen(false)}>Tracker</NavLink>
            <NavLink to="/cover-letter" className={navStyle} onClick={() => setIsOpen(false)}>Cover Letter</NavLink>
            <NavLink to="/dashboard" className={navStyle} onClick={() => setIsOpen(false)}>Dashboard</NavLink>

            <div className="pt-4 flex flex-col gap-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Hi, {user.name?.split(" ")[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={navStyle} onClick={() => setIsOpen(false)}>Login</NavLink>
                  <NavLink
                    to="/signup"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-center text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign up
                  </NavLink>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;