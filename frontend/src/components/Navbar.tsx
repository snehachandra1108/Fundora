
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

  const isAdmin = currentUser?.role === "admin";
  const dashboardPath = isAdmin ? "/admin-dashboard" : "/dashboard";

  useEffect(() => {
    setHomeLoading(false);
  }, [location.pathname]);

  function handleHomeNavigation() {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setHomeLoading(false);
    } else {
      setHomeLoading(true);
    }
  }

  function handleExploreNavigation() {
    if (location.pathname === "/") {
      document.getElementById("campaigns")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      // Navigate home first; the campaigns section can then be reached
      // using the Explore Campaigns link.
      window.location.href = "/#campaigns";
    }
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

        <nav className="navbar-links">
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

      <div className="navbar-buttons">
        {currentUser ? (
          <>
            <span>Hi, {currentUser.name}</span>

            <Link to={dashboardPath} className="login-button">
              {isAdmin ? "Admin Dashboard" : "Dashboard"}
            </Link>

            {!isAdmin && (
              <Link to="/payment-settings" className="login-button">
                Payment Settings
              </Link>
            )}

            <button onClick={onLogout} className="signup-button">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-button">
              Log In
            </Link>

            <Link to="/signup" className="signup-button">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
