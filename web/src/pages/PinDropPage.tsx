import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../lib/api.js";
import {
  schematicsApi,
  POINT_TYPES,
  type Schematic,
  type SchematicSummary,
  type PointType,
} from "../lib/schematics.js";
import { PinDropGame } from "../games/PinDropGame.js";
import { Card, Button, Alert, Spinner } from "../components/ui.js";

const ROUND_LENGTH = 10;
const TITLE: Record<PointType, string> = {
  signal: "Signals",
  station: "Stations",
  crossing: "Crossings",
  milepost: "Mileposts",
  ss: "SS",
};

export function PinDropPage() {
  const [list, setList] = useState<SchematicSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schematicId, setSchematicId] = useState<string>("");
  const [types, setTypes] = useState<Set<PointType>>(new Set(["signal"]));
  const [playing, setPlaying] = useState<Schematic | null>(null);
  const [loadingGame, setLoadingGame] = useState(false);

  useEffect(() => {
    schematicsApi
      .list()
      .then((l) => {
        setList(l);
        if (l[0]) setSchematicId(l[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  function toggleType(t: PointType) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  async function start() {
    setError(null);
    setLoadingGame(true);
    try {
      setPlaying(await schematicsApi.get(schematicId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start");
    } finally {
      setLoadingGame(false);
    }
  }

  if (playing) {
    const visibleTypes = POINT_TYPES.filter((t) => types.has(t));
    const pool = playing.points.filter((p) => types.has(p.type));
    return (
      <div className="container container--wide">
        <h1>Pin Drop</h1>
        <PinDropGame
          schematic={playing}
          pool={pool}
          roundLength={ROUND_LENGTH}
          visibleTypes={visibleTypes}
          onExit={() => setPlaying(null)}
        />
      </div>
    );
  }

  return (
    <div className="container container--wide">
      <p><Link to="/">← Home</Link></p>
      <h1>Pin Drop</h1>
      <p className="muted">You'll be given a name — tap its spot on the blank schematic.</p>
      {error && <Alert>{error}</Alert>}
      {!list && !error && <Spinner />}
      {list && list.length === 0 && (
        <Card><p className="muted" style={{ margin: 0 }}>No schematics available yet.</p></Card>
      )}
      {list && list.length > 0 && (
        <Card>
          <div className="field">
            <label htmlFor="schematic">Schematic</label>
            <select
              id="schematic"
              className="input"
              value={schematicId}
              onChange={(e) => setSchematicId(e.target.value)}
            >
              {list.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>What do you want to drill?</label>
            <div className="schematic-toolbar" style={{ marginBottom: 0 }}>
              {POINT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip${types.has(t) ? " is-active" : ""}`}
                  aria-pressed={types.has(t)}
                  onClick={() => toggleType(t)}
                >
                  {TITLE[t]}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={start} loading={loadingGame} disabled={types.size === 0}>
            Start round
          </Button>
          {types.size === 0 && <p className="muted" style={{ fontSize: "0.85rem" }}>Pick at least one category.</p>}
        </Card>
      )}
    </div>
  );
}
