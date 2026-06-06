import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../lib/api.js";
import { schematicsApi, type Schematic, type SchematicSummary } from "../lib/schematics.js";
import { RunTheLineGame } from "../games/RunTheLineGame.js";
import { Card, Button, Alert, Spinner } from "../components/ui.js";

export function RunTheLinePage() {
  const [list, setList] = useState<SchematicSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schematicId, setSchematicId] = useState("");
  const [schematic, setSchematic] = useState<Schematic | null>(null);
  const [trackId, setTrackId] = useState("");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    schematicsApi
      .list()
      .then((l) => {
        setList(l);
        if (l[0]) setSchematicId(l[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  useEffect(() => {
    if (!schematicId) return;
    setSchematic(null);
    schematicsApi
      .get(schematicId)
      .then((s) => {
        setSchematic(s);
        setTrackId(s.tracks[0]?.id ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, [schematicId]);

  if (playing && schematic) {
    return (
      <div className="container container--wide">
        <h1>Run the Line</h1>
        <RunTheLineGame schematic={schematic} trackId={trackId} onExit={() => setPlaying(false)} />
      </div>
    );
  }

  const trackCount = (id: string) => schematic?.points.filter((p) => p.track === id).length ?? 0;

  return (
    <div className="container container--wide">
      <p><Link to="/">← Home</Link></p>
      <h1>Run the Line</h1>
      <p className="muted">Drive a track end-to-end, naming each marker in order against the clock.</p>
      {error && <Alert>{error}</Alert>}
      {!list && !error && <Spinner />}
      {list && list.length === 0 && (
        <Card><p className="muted" style={{ margin: 0 }}>No schematics available yet.</p></Card>
      )}
      {list && list.length > 0 && (
        <Card>
          <div className="field">
            <label htmlFor="schematic">Schematic</label>
            <select id="schematic" className="input" value={schematicId} onChange={(e) => setSchematicId(e.target.value)}>
              {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="track">Track</label>
            {!schematic ? (
              <Spinner />
            ) : (
              <select id="track" className="input" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
                {schematic.tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.id} ({trackCount(t.id)} markers)</option>
                ))}
              </select>
            )}
          </div>
          <Button onClick={() => setPlaying(true)} disabled={!schematic || trackCount(trackId) === 0}>
            Start run
          </Button>
        </Card>
      )}
    </div>
  );
}
