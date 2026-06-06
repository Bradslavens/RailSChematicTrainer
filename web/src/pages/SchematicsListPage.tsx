import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../lib/api.js";
import { schematicsApi, type SchematicSummary } from "../lib/schematics.js";
import { Card, Alert, Spinner } from "../components/ui.js";

export function SchematicsListPage() {
  const [schematics, setSchematics] = useState<SchematicSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    schematicsApi
      .list()
      .then(setSchematics)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  return (
    <div className="container container--wide">
      <h1>Schematics</h1>
      <p className="muted">Pick a schematic to study the blank diagram.</p>
      {error && <Alert>{error}</Alert>}
      {!schematics && !error && <Spinner />}
      {schematics && schematics.length === 0 && (
        <Card><p className="muted" style={{ margin: 0 }}>No schematics available yet.</p></Card>
      )}
      {schematics && schematics.length > 0 && (
        <ul className="list">
          {schematics.map((s) => (
            <Link key={s.id} to={`/schematics/${s.id}`} className="list-item">
              <span>
                <strong>{s.name}</strong>
                <br />
                <span className="muted" style={{ fontSize: "0.85rem" }}>{s.pointCount} markers</span>
              </span>
              <span className="badge">{s.status}</span>
            </Link>
          ))}
        </ul>
      )}
    </div>
  );
}
