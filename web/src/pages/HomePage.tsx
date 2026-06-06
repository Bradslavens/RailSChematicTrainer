import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import { Card } from "../components/ui.js";

const GAMES = [
  { key: "pin-drop", icon: "📍", name: "Pin Drop", blurb: "Tap the right spot on the blank schematic.", to: "/play/pin-drop" },
  { key: "name-it", icon: "🔎", name: "Name It", blurb: "A marker glows — recall its name.", to: "/play/name-it" },
  { key: "flashcards", icon: "🗂️", name: "Flashcard Drill", blurb: "Spaced repetition, a little every day.", to: "/play/flashcards" },
  { key: "run-the-line", icon: "🚆", name: "Run the Line", blurb: "Name everything in order, against the clock." },
];

export function HomePage() {
  const { user } = useAuth();
  return (
    <div className="container container--wide">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <h1 style={{ marginBottom: 0 }}>Hi, {user?.email}</h1>
        <span className="badge">{user?.role}</span>
      </div>
      <p className="muted">Pick a game to start learning. Progress tracking arrives soon.</p>

      <Card>
        <h2>Study the schematic</h2>
        <p className="muted">Explore the blank diagram and toggle labels as you learn.</p>
        <Link className="btn btn--primary" to="/schematics">Browse schematics →</Link>
      </Card>

      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        }}
      >
        {GAMES.map((g) => (
          <Card key={g.key}>
            <div style={{ fontSize: "1.8rem" }}>{g.icon}</div>
            <h2 style={{ marginTop: "0.5rem" }}>{g.name}</h2>
            <p className="muted" style={{ marginBottom: 0 }}>{g.blurb}</p>
            {g.to ? (
              <p style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                <Link className="btn btn--primary btn--sm" to={g.to}>Play →</Link>
              </p>
            ) : (
              <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}>Coming soon</p>
            )}
          </Card>
        ))}
      </div>

      {user?.role === "admin" && (
        <Card className="" >
          <h2>Admin</h2>
          <p className="muted">Manage schematics, signals, stations, and crossings.</p>
          <Link to="/admin">Open admin →</Link>
        </Card>
      )}
    </div>
  );
}
