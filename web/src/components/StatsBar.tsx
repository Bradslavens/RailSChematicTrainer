import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { statsApi, type MyStats } from "../lib/stats.js";

/** Compact level / XP / streak header. Silently hidden until stats load. */
export function StatsBar() {
  const [stats, setStats] = useState<MyStats | null>(null);

  useEffect(() => {
    statsApi.me().then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;
  const pct = stats.perLevel ? Math.round((stats.intoLevel / stats.perLevel) * 100) : 0;

  return (
    <div className="card statsbar">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>Level {stats.level}</strong>
        <span title="Daily streak">🔥 {stats.currentStreak} day{stats.currentStreak === 1 ? "" : "s"}</span>
      </div>
      <div className="xpbar" aria-label={`${stats.intoLevel} of ${stats.perLevel} XP`}>
        <div className="xpbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted" style={{ fontSize: "0.8rem" }}>{stats.intoLevel} / {stats.perLevel} XP</span>
        <Link to="/leaderboard">Leaderboard →</Link>
      </div>
    </div>
  );
}
