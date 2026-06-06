import { useState } from "react";
import type { Schematic, PointType } from "../lib/schematics.js";
import { GameSetup } from "../games/GameSetup.js";
import { NameItGame } from "../games/NameItGame.js";

const ROUND_LENGTH = 10;

export function NameItPage() {
  const [game, setGame] = useState<{ schematic: Schematic; types: PointType[] } | null>(null);

  if (game) {
    const pool = game.schematic.points.filter((p) => game.types.includes(p.type));
    return (
      <div className="container container--wide">
        <h1>Name It</h1>
        <NameItGame
          schematic={game.schematic}
          pool={pool}
          roundLength={ROUND_LENGTH}
          visibleTypes={game.types}
          onExit={() => setGame(null)}
        />
      </div>
    );
  }

  return (
    <GameSetup
      title="Name It"
      blurb="A marker glows on the diagram — pick its correct name."
      onStart={(schematic, types) => setGame({ schematic, types })}
    />
  );
}
