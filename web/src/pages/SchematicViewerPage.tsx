import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ApiError } from "../lib/api.js";
import { schematicsApi, POINT_TYPES, type Schematic, type PointType } from "../lib/schematics.js";
import { SchematicView } from "../schematic/SchematicView.js";
import { Card, Button, Alert, Spinner } from "../components/ui.js";

const TYPE_LABELS: Record<PointType, string> = {
  signal: "Signals",
  station: "Stations",
  crossing: "Crossings",
  milepost: "Mileposts",
  ss: "SS",
};

export function SchematicViewerPage() {
  const { id = "" } = useParams();
  const [schematic, setSchematic] = useState<Schematic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [hidden, setHidden] = useState<Set<PointType>>(new Set());

  useEffect(() => {
    schematicsApi
      .get(id)
      .then(setSchematic)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, [id]);

  if (error) return <div className="container"><Alert>{error}</Alert></div>;
  if (!schematic) return <Spinner />;

  const visibleTypes = POINT_TYPES.filter((t) => !hidden.has(t));

  function toggleType(t: PointType) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  return (
    <div className="container container--wide">
      <p><Link to="/schematics">← All schematics</Link></p>
      <h1>{schematic.name}</h1>

      <div className="schematic-toolbar">
        <Button variant={showLabels ? "primary" : "secondary"} className="btn--sm" onClick={() => setShowLabels((v) => !v)}>
          {showLabels ? "Hide labels" : "Show labels"}
        </Button>
        {POINT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip${hidden.has(t) ? "" : " is-active"}`}
            aria-pressed={!hidden.has(t)}
            onClick={() => toggleType(t)}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <Card>
        <SchematicView schematic={schematic} showLabels={showLabels} visibleTypes={visibleTypes} />
      </Card>
    </div>
  );
}
