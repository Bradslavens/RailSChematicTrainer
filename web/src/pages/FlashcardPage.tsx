import { useState } from "react";
import type { Schematic, PointType } from "../lib/schematics.js";
import { GameSetup } from "../games/GameSetup.js";
import { FlashcardGame } from "../games/FlashcardGame.js";

export function FlashcardPage() {
  const [game, setGame] = useState<{ schematic: Schematic; types: PointType[] } | null>(null);

  if (game) {
    return (
      <div className="container container--wide">
        <h1>Flashcard Drill</h1>
        <FlashcardGame schematic={game.schematic} types={game.types} onExit={() => setGame(null)} />
      </div>
    );
  }

  return (
    <GameSetup
      title="Flashcard Drill"
      blurb="Spaced repetition: review what's due, a little every day."
      onStart={(schematic, types) => setGame({ schematic, types })}
    />
  );
}
