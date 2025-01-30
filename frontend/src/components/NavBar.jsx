import { Link, useLocation } from "react-router-dom";

export default function NavBar() {
  const location = useLocation();

  // Determine active link
  const isActive = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          My Private Teacher
        </Link>

        {/* Navigation Links */}
        <div className="navbar-links">
          <Link to="/dashboard" className={isActive("/dashboard")}>
            Dashboard
          </Link>
          <Link to="/lesson" className={isActive("/lesson")}>
            Lessons
          </Link>
          <Link to="/progress" className={isActive("/progress")}>
            Progress
          </Link>
        </div>
      </div>
    </nav>
  );
}
