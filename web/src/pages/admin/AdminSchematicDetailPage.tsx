import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ApiError } from "../../lib/api.js";
import {
  schematicsApi,
  POINT_TYPES,
  type Schematic,
  type SchematicPoint,
  type PointType,
} from "../../lib/schematics.js";
import { Card, Button, Alert, Spinner } from "../../components/ui.js";

export function AdminSchematicDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [schematic, setSchematic] = useState<Schematic | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setSchematic(await schematicsApi.get(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load schematic");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  if (error) return <div className="container"><Alert>{error}</Alert></div>;
  if (!schematic) return <Spinner />;

  async function togglePublish() {
    const next = schematic!.status === "published" ? "draft" : "published";
    await schematicsApi.update(id, { status: next });
    await load();
  }

  async function deleteSchematic() {
    if (!confirm(`Delete "${schematic!.name}"? This cannot be undone.`)) return;
    await schematicsApi.remove(id);
    navigate("/admin");
  }

  const counts = POINT_TYPES.map((t) => ({
    t,
    n: schematic.points.filter((p) => p.type === t).length,
  })).filter((c) => c.n > 0);

  return (
    <div className="container container--wide">
      <p><Link to="/admin">← All schematics</Link></p>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <h1 style={{ marginBottom: 0 }}>{schematic.name}</h1>
        <span className="badge">{schematic.status}</span>
      </div>
      <p className="muted">
        {counts.map((c) => `${c.n} ${c.t}`).join(" · ")} · viewBox {schematic.viewBox.join(" ")}
      </p>

      <Card>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={togglePublish}>
            {schematic.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button variant="danger" onClick={deleteSchematic}>Delete schematic</Button>
        </div>
      </Card>

      <Card>
        <h2>Markers</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Label</th>
                <th>X</th>
                <th>Y</th>
                <th>Track</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {schematic.points.map((p) => (
                <PointRow key={p.id} point={p} onChanged={load} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AddPointForm schematicId={id} onAdded={load} />
    </div>
  );
}

function PointRow({ point, onChanged }: { point: SchematicPoint; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(point);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await schematicsApi.updatePoint(point.id, {
        type: draft.type,
        label: draft.label,
        x: Number(draft.x),
        y: Number(draft.y),
        track: draft.track || null,
      });
      setEditing(false);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete marker "${point.label}"?`)) return;
    setBusy(true);
    try {
      await schematicsApi.removePoint(point.id);
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <tr>
        <td><span className={`type-tag type-${point.type}`}>{point.type}</span></td>
        <td>{point.label}</td>
        <td>{point.x}</td>
        <td>{point.y}</td>
        <td className="muted">{point.track ?? "—"}</td>
        <td style={{ whiteSpace: "nowrap" }}>
          <Button variant="secondary" className="btn--sm" onClick={() => setEditing(true)}>Edit</Button>{" "}
          <Button variant="danger" className="btn--sm" onClick={remove} loading={busy}>Delete</Button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <select
          className="input"
          aria-label="Type"
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value as PointType })}
        >
          {POINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td><input className="input" aria-label="Label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></td>
      <td><input className="input" aria-label="X" type="number" value={draft.x} onChange={(e) => setDraft({ ...draft, x: Number(e.target.value) })} style={{ width: "5rem" }} /></td>
      <td><input className="input" aria-label="Y" type="number" value={draft.y} onChange={(e) => setDraft({ ...draft, y: Number(e.target.value) })} style={{ width: "5rem" }} /></td>
      <td><input className="input" aria-label="Track" value={draft.track ?? ""} onChange={(e) => setDraft({ ...draft, track: e.target.value })} style={{ width: "5rem" }} /></td>
      <td style={{ whiteSpace: "nowrap" }}>
        <Button className="btn--sm" onClick={save} loading={busy}>Save</Button>{" "}
        <Button variant="secondary" className="btn--sm" onClick={() => { setDraft(point); setEditing(false); }}>Cancel</Button>
      </td>
    </tr>
  );
}

function AddPointForm({ schematicId, onAdded }: { schematicId: string; onAdded: () => Promise<void> }) {
  const empty = { type: "signal" as PointType, label: "", x: "", y: "", track: "" };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.label || form.x === "" || form.y === "") {
      setError("Label, X and Y are required.");
      return;
    }
    setBusy(true);
    try {
      await schematicsApi.addPoint(schematicId, {
        type: form.type,
        label: form.label,
        x: Number(form.x),
        y: Number(form.y),
        track: form.track || null,
      });
      setForm(empty);
      await onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add marker");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2>Add a marker</h2>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={onSubmit} className="row" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
        <label className="field" style={{ marginBottom: 0 }}>
          <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Type</span>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PointType })}>
            {POINT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Label</span>
          <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>X</span>
          <input className="input" type="number" value={form.x} onChange={(e) => setForm({ ...form, x: e.target.value })} style={{ width: "6rem" }} />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Y</span>
          <input className="input" type="number" value={form.y} onChange={(e) => setForm({ ...form, y: e.target.value })} style={{ width: "6rem" }} />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}>Track</span>
          <input className="input" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} style={{ width: "6rem" }} />
        </label>
        <Button type="submit" loading={busy}>Add</Button>
      </form>
    </Card>
  );
}
