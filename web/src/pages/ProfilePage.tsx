import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import { ApiError } from "../lib/api.js";
import { statsApi, type MyStats, type Overview, type GameMode } from "../lib/stats.js";
import { Card, Alert, Spinner } from "../components/ui.js";

const MODE_LABEL: Record<GameMode, string> = {
  "pin-drop": "Pin Drop",
  "name-it": "Name It",
  flashcard: "Flashcard Drill",
  "run-the-line": "Run the Line",
};

export function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MyStats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([statsApi.me(), statsApi.overview()])
      .then(([s, o]) => {
        setStats(s);
        setOverview(o);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  return (
    <div className="container container--wide">
      <p><Link to="/">← Home</Link></p>
      <h1>Your progress</h1>
      <p className="muted">{user?.email}</p>
      {error && <Alert>{error}</Alert>}
      {(!stats || !overview) && !error && <Spinner />}

      {stats && (
        <Card>
          <div className="stat-tiles">
            <div className="stat-tile"><div className="stat-num">{stats.level}</div><div className="muted">Level</div></div>
            <div className="stat-tile"><div className="stat-num">{stats.xp}</div><div className="muted">Total XP</div></div>
            <div className="stat-tile"><div className="stat-num">{stats.currentStreak}🔥</div><div className="muted">Day streak</div></div>
            <div className="stat-tile"><div className="stat-num">{stats.longestStreak}</div><div className="muted">Best streak</div></div>
          </div>
        </Card>
      )}

      {overview && (
        <Card>
          <h2>Accuracy by game</h2>
          {overview.overall.total === 0 ? (
            <p className="muted">No attempts yet — play a game to see your accuracy here.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Game</th><th>Attempts</th><th>Correct</th><th>Accuracy</th></tr>
                </thead>
                <tbody>
                  {overview.byMode.map((m) => (
                    <tr key={m.mode}>
                      <td>{MODE_LABEL[m.mode]}</td>
                      <td>{m.total}</td>
                      <td>{m.correct}</td>
                      <td>{m.total ? `${Math.round(m.accuracy * 100)}%` : "—"}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700 }}>
                    <td>Overall</td>
                    <td>{overview.overall.total}</td>
                    <td>{overview.overall.correct}</td>
                    <td>{Math.round(overview.overall.accuracy * 100)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
