import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../lib/api.js";
import { schematicsApi, type Schematic } from "../lib/schematics.js";
import { NameItGame } from "../games/NameItGame.js";
import { dailyDateStr, pickDaily, isDailyDone, markDailyDone } from "../games/daily.js";
import { Card, Alert, Spinner } from "../components/ui.js";

const DAILY_COUNT = 5;

export function DailyChallengePage() {
  const date = dailyDateStr();
  const [schematic, setSchematic] = useState<Schematic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(isDailyDone(date));

  useEffect(() => {
    schematicsApi
      .list()
      .then((l) => (l[0] ? schematicsApi.get(l[0].id) : null))
      .then(setSchematic)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  const questions = useMemo(
    () => (schematic ? pickDaily(schematic.points, DAILY_COUNT, date) : []),
    [schematic, date],
  );

  if (error) return <div className="container"><Alert>{error}</Alert></div>;

  if (done) {
    return (
      <div className="container container--wide">
        <p><Link to="/">← Home</Link></p>
        <Card>
          <h1>Daily Challenge</h1>
          <p style={{ fontSize: "1.3rem", fontWeight: 700 }}>Done for today ✓</p>
          <p className="muted">Come back tomorrow for a fresh set of {DAILY_COUNT}.</p>
          <Link className="btn btn--secondary" to="/">Back home</Link>
        </Card>
      </div>
    );
  }

  if (!schematic) return <Spinner />;
  if (questions.length === 0) {
    return <div className="container"><Card><p className="muted">No schematic available yet.</p></Card></div>;
  }

  return (
    <div className="container container--wide">
      <h1>Daily Challenge</h1>
      <p className="muted">Today's {questions.length} from {schematic.name}. One shot per day!</p>
      <NameItGame
        schematic={schematic}
        pool={schematic.points}
        fixedQuestions={questions}
        exitLabel="Finish"
        onExit={() => {
          markDailyDone(date);
          setDone(true);
        }}
      />
    </div>
  );
}
