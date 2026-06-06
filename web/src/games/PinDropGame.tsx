import { useMemo, useRef, useState } from "react";
import type { Schematic, SchematicPoint, PointType } from "../lib/schematics.js";
import { attemptsApi, TYPE_LABEL } from "../lib/attempts.js";
import { gradeTap, buildQuestions, type PinDropGrade } from "./pinDrop.js";
import { SchematicView } from "../schematic/SchematicView.js";
import { Card, Button } from "../components/ui.js";

export interface PinDropGameProps {
  schematic: Schematic;
  pool: SchematicPoint[];
  roundLength?: number;
  visibleTypes?: PointType[];
  onExit: () => void;
}

const LEVEL_MESSAGE = {
  perfect: "🎯 Bullseye!",
  close: "👀 So close!",
  miss: "❌ Not quite.",
} as const;

export function PinDropGame({ schematic, pool, roundLength = 10, visibleTypes, onExit }: PinDropGameProps) {
  const questions = useMemo(() => buildQuestions(pool, roundLength), [pool, roundLength]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"asking" | "feedback" | "done">("asking");
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [grade, setGrade] = useState<PinDropGrade | null>(null);
  const startRef = useRef(Date.now());

  const target = questions[idx];

  function handleTap(point: SchematicPoint) {
    if (phase !== "asking" || !target) return;
    const g = gradeTap(point, target);
    setGrade(g);
    setChosenId(point.id);
    setScore((s) => s + g.points);
    if (g.correct) setCorrectCount((c) => c + 1);
    setPhase("feedback");
    attemptsApi
      .record({
        pointId: target.id,
        gameMode: "pin-drop",
        correct: g.correct,
        responseMs: Date.now() - startRef.current,
      })
      .catch(() => {/* non-blocking */});
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1);
    setChosenId(null);
    setGrade(null);
    setPhase("asking");
    startRef.current = Date.now();
  }

  if (questions.length === 0) {
    return (
      <Card>
        <p className="muted">No markers to play with. Pick at least one category.</p>
        <Button onClick={onExit}>Back</Button>
      </Card>
    );
  }

  if (phase === "done") {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <Card>
        <h2>Round complete!</h2>
        <p style={{ fontSize: "2rem", fontWeight: 800, margin: "0.5rem 0" }}>{score} pts</p>
        <p className="muted">
          {correctCount} / {questions.length} correct ({accuracy}% accuracy)
        </p>
        <div className="row" style={{ marginTop: "1rem" }}>
          <Button onClick={onExit}>Play again</Button>
        </div>
      </Card>
    );
  }

  const revealed = phase === "feedback" && target ? new Set([target.id, ...(chosenId ? [chosenId] : [])]) : undefined;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">Question {idx + 1} / {questions.length}</span>
        <span className="badge">{score} pts</span>
      </div>

      <Card>
        {phase === "asking" ? (
          <p style={{ margin: 0 }}>
            Tap the <span className={`type-tag type-${target.type}`}>{TYPE_LABEL[target.type]}</span>{" "}
            labeled <strong data-testid="prompt-label">{target.label}</strong>
          </p>
        ) : (
          grade && (
            <div className={`feedback feedback--${grade.level}`} role="status">
              <strong>{LEVEL_MESSAGE[grade.level]}</strong> {target.label} · +{grade.points} pts
              <div style={{ marginTop: "0.6rem" }}>
                <Button className="btn--sm" onClick={next}>
                  {idx + 1 >= questions.length ? "See results" : "Next"}
                </Button>
              </div>
            </div>
          )
        )}
      </Card>

      <Card>
        <SchematicView
          schematic={schematic}
          showLabels={false}
          visibleTypes={visibleTypes}
          highlightPointId={phase === "feedback" ? target.id : null}
          revealedPointIds={revealed}
          onPointClick={phase === "asking" ? handleTap : undefined}
        />
      </Card>
    </div>
  );
}
