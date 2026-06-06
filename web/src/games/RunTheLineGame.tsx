import { useEffect, useMemo, useRef, useState } from "react";
import type { Schematic, SchematicPoint } from "../lib/schematics.js";
import { attemptsApi, TYPE_LABEL } from "../lib/attempts.js";
import { buildChoices } from "./nameIt.js";
import { orderAlongTrack } from "../schematic/geometry.js";
import { SchematicView } from "../schematic/SchematicView.js";
import { Card, Button } from "../components/ui.js";

export interface RunTheLineGameProps {
  schematic: Schematic;
  trackId: string;
  onExit: () => void;
}

const CHOICES = 4;

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function RunTheLineGame({ schematic, trackId, onExit }: RunTheLineGameProps) {
  const ordered = useMemo(() => {
    const track = schematic.tracks.find((t) => t.id === trackId);
    const onTrack = schematic.points.filter((p) => p.track === trackId);
    return track ? orderAlongTrack(onTrack, track.polyline) : onTrack;
  }, [schematic, trackId]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"asking" | "feedback" | "done">("asking");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());
  const questionStart = useRef(Date.now());

  useEffect(() => {
    if (phase === "done") return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt.current), 500);
    return () => clearInterval(id);
  }, [phase]);

  const target: SchematicPoint | undefined = ordered[idx];
  const choices = useMemo(
    () => (target ? buildChoices(target.label, ordered.map((p) => p.label), CHOICES) : []),
    [target, ordered],
  );

  function choose(label: string) {
    if (phase !== "asking" || !target) return;
    const correct = label === target.label;
    setPicked(label);
    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setScore((s) => s + 100 * newCombo);
      setCorrectCount((c) => c + 1);
    } else {
      setCombo(0);
    }
    setPhase("feedback");
    attemptsApi
      .record({ pointId: target.id, gameMode: "run-the-line", correct, responseMs: Date.now() - questionStart.current })
      .catch(() => {});
  }

  function next() {
    if (idx + 1 >= ordered.length) {
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setPhase("asking");
    questionStart.current = Date.now();
  }

  if (ordered.length === 0) {
    return (
      <Card>
        <p className="muted">This track has no markers to run. Try another track.</p>
        <Button onClick={onExit}>Back</Button>
      </Card>
    );
  }

  if (phase === "done") {
    const accuracy = Math.round((correctCount / ordered.length) * 100);
    return (
      <Card>
        <h2>Line complete! 🚆</h2>
        <p style={{ fontSize: "2rem", fontWeight: 800, margin: "0.5rem 0" }}>{score} pts</p>
        <p className="muted">
          {correctCount} / {ordered.length} correct ({accuracy}%) · best combo ×{maxCombo} · {formatTime(elapsed)}
        </p>
        <Button onClick={onExit} style={{ marginTop: "0.5rem" }}>Run again</Button>
      </Card>
    );
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">Stop {idx + 1} / {ordered.length} · {formatTime(elapsed)}</span>
        <span className="badge">{score} pts {combo > 1 ? `· ×${combo}` : ""}</span>
      </div>

      <Card>
        <p style={{ margin: "0 0 0.5rem" }}>
          Next stop — name this <span className={`type-tag type-${target.type}`}>{TYPE_LABEL[target.type]}</span>:
        </p>
        <div className="choice-grid">
          {choices.map((label) => {
            const cls =
              phase === "feedback"
                ? label === target.label
                  ? "choice is-correct"
                  : label === picked
                    ? "choice is-wrong"
                    : "choice"
                : "choice";
            return (
              <button key={label} type="button" className={cls} disabled={phase === "feedback"} onClick={() => choose(label)}>
                {label}
              </button>
            );
          })}
        </div>
        {phase === "feedback" && (
          <div style={{ marginTop: "0.85rem" }}>
            <Button className="btn--sm" onClick={next}>
              {idx + 1 >= ordered.length ? "See results" : "Next stop"}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <SchematicView
          schematic={schematic}
          showLabels={false}
          highlightPointId={target.id}
          revealedPointIds={phase === "feedback" ? new Set([target.id]) : undefined}
        />
      </Card>
    </div>
  );
}
