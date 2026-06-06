import { useMemo, useRef, useState } from "react";
import type { Schematic, SchematicPoint, PointType } from "../lib/schematics.js";
import { attemptsApi, TYPE_LABEL } from "../lib/attempts.js";
import { buildQuestions } from "./pinDrop.js";
import { buildChoices } from "./nameIt.js";
import { SchematicView } from "../schematic/SchematicView.js";
import { Card, Button } from "../components/ui.js";

export interface NameItGameProps {
  schematic: Schematic;
  pool: SchematicPoint[];
  roundLength?: number;
  visibleTypes?: PointType[];
  onExit: () => void;
}

const CHOICES = 4;

export function NameItGame({ schematic, pool, roundLength = 10, visibleTypes, onExit }: NameItGameProps) {
  const questions = useMemo(() => buildQuestions(pool, roundLength), [pool, roundLength]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"asking" | "feedback" | "done">("asking");
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const startRef = useRef(Date.now());

  const target = questions[idx];
  const choices = useMemo(
    () => (target ? buildChoices(target.label, pool.map((p) => p.label), CHOICES) : []),
    [target, pool],
  );

  function choose(label: string) {
    if (phase !== "asking" || !target) return;
    const correct = label === target.label;
    setPicked(label);
    if (correct) {
      setScore((s) => s + 100);
      setCorrectCount((c) => c + 1);
    }
    setPhase("feedback");
    attemptsApi
      .record({ pointId: target.id, gameMode: "name-it", correct, responseMs: Date.now() - startRef.current })
      .catch(() => {});
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setPhase("done");
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
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
        <p className="muted">{correctCount} / {questions.length} correct ({accuracy}% accuracy)</p>
        <Button onClick={onExit} style={{ marginTop: "1rem" }}>Play again</Button>
      </Card>
    );
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">Question {idx + 1} / {questions.length}</span>
        <span className="badge">{score} pts</span>
      </div>

      <Card>
        <p style={{ margin: "0 0 0.5rem" }}>
          What is the glowing <span className={`type-tag type-${target.type}`}>{TYPE_LABEL[target.type]}</span>?
        </p>
        <div className="choice-grid">
          {choices.map((label) => {
            const isTarget = label === target.label;
            const isPicked = label === picked;
            const cls =
              phase === "feedback"
                ? isTarget
                  ? "choice is-correct"
                  : isPicked
                    ? "choice is-wrong"
                    : "choice"
                : "choice";
            return (
              <button
                key={label}
                type="button"
                className={cls}
                disabled={phase === "feedback"}
                onClick={() => choose(label)}
              >
                {label}
              </button>
            );
          })}
        </div>
        {phase === "feedback" && (
          <div style={{ marginTop: "0.85rem" }}>
            <Button className="btn--sm" onClick={next}>
              {idx + 1 >= questions.length ? "See results" : "Next"}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <SchematicView
          schematic={schematic}
          showLabels={false}
          visibleTypes={visibleTypes}
          highlightPointId={target.id}
          revealedPointIds={phase === "feedback" ? new Set([target.id]) : undefined}
        />
      </Card>
    </div>
  );
}
