import { useEffect, useState } from "react";
import { statsApi, type MasteryRow } from "../lib/stats.js";

const LABEL: Record<string, string> = {
  signal: "Signals",
  station: "Stations",
  crossing: "Crossings",
  milepost: "Mileposts",
  ss: "SS",
};

/** Per-category mastery bars for one schematic. */
export function MasteryPanel({ schematicId }: { schematicId: string }) {
  const [rows, setRows] = useState<MasteryRow[] | null>(null);

  useEffect(() => {
    statsApi.mastery(schematicId).then(setRows).catch(() => setRows([]));
  }, [schematicId]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="card">
      <h2>Your mastery</h2>
      {rows.map((r) => {
        const pct = Math.round(r.avgMastery * 100);
        return (
          <div key={r.type} style={{ marginBottom: "0.6rem" }}>
            <div className="row" style={{ justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span>{LABEL[r.type] ?? r.type}</span>
              <span className="muted">{r.mastered} / {r.total} mastered</span>
            </div>
            <div className="xpbar"><div className="xpbar-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}
