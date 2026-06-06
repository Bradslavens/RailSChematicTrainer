import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import { Button } from "./ui.js";

export function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="dot" aria-hidden />
        <span>Rail Schematic Trainer</span>
      </Link>
      <div className="spacer" />
      {user && (
        <nav className="topbar-nav">
          <Link to="/me">Stats</Link>
          <Button variant="ghost" onClick={logout} aria-label="Log out">Log out</Button>
        </nav>
      )}
    </header>
  );
}
