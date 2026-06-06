import { useEffect, useRef, useState } from "react";
import type { Schematic, SchematicPoint, PointType } from "../lib/schematics.js";
import { attemptsApi, TYPE_LABEL } from "../lib/attempts.js";
import { progressApi } from "../lib/stats.js";
import { SchematicView } from "../schematic/SchematicView.js";
import { Card, Button, Spinner } from "../components/ui.js";

export interface FlashcardGameProps {
  schematic: Schematic;
  types: PointType[];
  roundLength?: number;
  onExit: () => void;
}

export function FlashcardGame({ schematic, types, roundLength = 20, onExit }: FlashcardGameProps) {
  const [state, setState] = useState<"loading" | "ready" | "empty" | "done">("loading");
  const [deck, setDeck] = useState<SchematicPoint[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [got, setGot] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    let active = true;
    progressApi
      .due(schematic.id, types, roundLength)
      .then((ids) => {
        if (!active) return;
        const order = new Map(ids.map((id, i) => [id, i]));
        const cards = schematic.points
          .filter((p) => order.has(p.id))
          .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
        setDeck(cards);
        setState(cards.length ? "ready" : "empty");
      })
      .catch(() => active && setState("empty"));
    return () => {
      active = false;
    };
  }, [schematic.id]);

  function grade(gotIt: boolean) {
    const card = deck[idx];
    if (!card) return;
    setReviewed((r) => r + 1);
    if (gotIt) setGot((g) => g + 1);
    attemptsApi
      .record({ pointId: card.id, gameMode: "flashcard", correct: gotIt, responseMs: Date.now() - startRef.current })
      .catch(() => {});
    if (idx + 1 >= deck.length) {
      setState("done");
      return;
    }
    setIdx((i) => i + 1);
    setShowBack(false);
    startRef.current = Date.now();
  }

  if (state === "loading") return <Spinner />;

  if (state === "empty") {
    return (
      <Card>
        <h2>All caught up! 🎉</h2>
        <p className="muted">No cards are due for review right now. Come back later, or try another game.</p>
        <Button onClick={onExit}>Back</Button>
      </Card>
    );
  }

  if (state === "done") {
    return (
      <Card>
        <h2>Review complete!</h2>
        <p style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.5rem 0" }}>{got} / {reviewed} remembered</p>
        <p className="muted">Cards you missed will come back around sooner.</p>
        <Button onClick={onExit} style={{ marginTop: "0.5rem" }}>Done</Button>
      </Card>
    );
  }

  const card = deck[idx];

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">Card {idx + 1} / {deck.length}</span>
        <span className="badge">{got} remembered</span>
      </div>

      <Card>
        {!showBack ? (
          <>
            <p style={{ margin: "0 0 0.6rem" }}>
              What is this glowing <span className={`type-tag type-${card.type}`}>{TYPE_LABEL[card.type]}</span>? Picture the name, then check.
            </p>
            <Button onClick={() => setShowBack(true)}>Reveal answer</Button>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 0.6rem" }}>
              This is <strong data-testid="card-answer">{card.label}</strong>. Did you get it?
            </p>
            <div className="row">
              <Button variant="danger" onClick={() => grade(false)}>Missed it</Button>
              <Button onClick={() => grade(true)}>Got it</Button>
            </div>
          </>
        )}
      </Card>

      <Card>
        <SchematicView
          schematic={schematic}
          showLabels={false}
          visibleTypes={types}
          highlightPointId={card.id}
          revealedPointIds={showBack ? new Set([card.id]) : undefined}
        />
      </Card>
    </div>
  );
}
