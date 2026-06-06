import { useAuth } from "../auth/AuthContext.js";
import { Button } from "./ui.js";

export function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <div className="brand">
        <span className="dot" aria-hidden />
        <span>Rail Schematic Trainer</span>
      </div>
      <div className="spacer" />
      {user && (
        <Button variant="ghost" onClick={logout} aria-label="Log out">
          Log out
        </Button>
      )}
    </header>
  );
}
