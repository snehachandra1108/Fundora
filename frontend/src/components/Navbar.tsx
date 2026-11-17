
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { User } from "../types/user";

function Navbar({
  currentUser,
  onLogout,
}: {
  currentUser: User | null;
  onLogout: () => void;
}) {
  const location = useLocation();
  const [homeLoading, setHomeLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const dashboardPath = isAdmin ? "/admin-dashboard" : "/dashboard";

  useEffect(() => {
    setHomeLoading(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  function handleHomeNavigation() {
    setIsMenuOpen(false);

    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setHomeLoading(false);
    } else {
      setHomeLoading(true);
    }
  }

  function handleExploreNavigation() {
    setIsMenuOpen(false);

    if (location.pathname === "/") {
      document.getElementById("campaigns")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      window.location.href = "/#campaigns";
    }
  }

  function handleLogout() {
    setIsMenuOpen(false);
    onLogout();
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link
          to="/"
          className="navbar-logo"
          onClick={handleHomeNavigation}
        >
          Fundora<span>.</span>
          {homeLoading && <span className="loading-spinner" />}
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen((previous) => !previous)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>

        <nav className={`navbar-links ${isMenuOpen ? "mobile-open" : ""}`}>
          <Link to="/" onClick={handleHomeNavigation}>
            Home
          </Link>

          <a
            href="/#campaigns"
            onClick={(event) => {
              event.preventDefault();
              handleExploreNavigation();
            }}
          >
            Explore Campaigns
          </a>
        </nav>
      </div>

      <div className={`navbar-buttons ${isMenuOpen ? "mobile-open" : ""}`}>
        {currentUser ? (
          <>
            <span className="navbar-greeting">Hi, {currentUser.name}</span>

            <Link
              to={dashboardPath}
              className="login-button"
              onClick={() => setIsMenuOpen(false)}
            >
              {isAdmin ? "Admin Dashboard" : "Dashboard"}
            </Link>

            {!isAdmin && (
              <Link
                to="/payment-settings"
                className="login-button"
                onClick={() => setIsMenuOpen(false)}
              >
                Payment Settings
              </Link>
            )}

            <button onClick={handleLogout} className="signup-button">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="login-button"
              onClick={() => setIsMenuOpen(false)}
            >
              Log In
            </Link>

            <Link
              to="/signup"
              className="signup-button"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
