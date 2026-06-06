import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../lib/api.js";
import { schematicsApi, type SchematicSummary } from "../../lib/schematics.js";
import { Card, Alert, Spinner } from "../../components/ui.js";

export function AdminSchematicsPage() {
  const [schematics, setSchematics] = useState<SchematicSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function readText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
      reader.readAsText(file);
    });
  }

  async function load() {
    try {
      setSchematics(await schematicsApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load schematics");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    setMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await readText(file));
    } catch {
      setUploadError(`"${file.name}" is not valid JSON.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setBusy(true);
    try {
      const created = await schematicsApi.create(parsed);
      setMessage(`Uploaded "${created.name}" (${created.points.length} points).`);
      await load();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="container container--wide">
      <h1>Schematics</h1>
      <p className="muted">Upload a schematic JSON file, or manage existing ones.</p>

      <Card>
        <h2>Upload a schematic</h2>
        <p className="muted">Select a <code>.json</code> file describing the schematic.</p>
        {uploadError && <Alert>{uploadError}</Alert>}
        {message && <div className="toast" role="status">{message}</div>}
        <label className="btn btn--primary" style={{ cursor: busy ? "not-allowed" : "pointer" }}>
          {busy ? "Uploading…" : "Choose JSON file"}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={onFile}
            disabled={busy}
            style={{ display: "none" }}
          />
        </label>
      </Card>

      <Card>
        <h2>Existing schematics</h2>
        {error && <Alert>{error}</Alert>}
        {!schematics && !error && <Spinner />}
        {schematics && schematics.length === 0 && <p className="muted">None yet. Upload one above.</p>}
        {schematics && schematics.length > 0 && (
          <ul className="list">
            {schematics.map((s) => (
              <Link key={s.id} to={`/admin/schematics/${s.id}`} className="list-item">
                <span>
                  <strong>{s.name}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: "0.85rem" }}>
                    {s.pointCount} markers
                  </span>
                </span>
                <span className="badge">{s.status}</span>
              </Link>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
