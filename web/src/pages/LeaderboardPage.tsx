import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../lib/api.js";
import { statsApi, type LeaderRow } from "../lib/stats.js";
import { useAuth } from "../auth/AuthContext.js";
import { Card, Alert, Spinner } from "../components/ui.js";

export function LeaderboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    statsApi
      .leaderboard()
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  return (
    <div className="container container--wide">
      <p><Link to="/">← Home</Link></p>
      <h1>Leaderboard</h1>
      {error && <Alert>{error}</Alert>}
      {!rows && !error && <Spinner />}
      {rows && (
        <Card>
          <table className="table">
            <thead>
              <tr><th>#</th><th>Player</th><th>Level</th><th>XP</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const name = r.email.split("@")[0];
                const isMe = user?.email === r.email;
                return (
                  <tr key={r.email} style={isMe ? { fontWeight: 700 } : undefined}>
                    <td>{i + 1}</td>
                    <td>{name}{isMe ? " (you)" : ""}</td>
                    <td>{r.level}</td>
                    <td>{r.xp}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={4} className="muted">No scores yet — play a game!</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
