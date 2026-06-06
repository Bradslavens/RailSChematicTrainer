import { api } from "./api.js";
import type { PointType } from "./schematics.js";

export type GameMode = "pin-drop" | "name-it" | "flashcard" | "run-the-line";

export interface AttemptPayload {
  pointId: string;
  gameMode: GameMode;
  correct: boolean;
  responseMs?: number;
}

export const attemptsApi = {
  record: (a: AttemptPayload) => api.post<{ attempt: { id: string } }>("/attempts", a),
  summary: (gameMode?: GameMode) =>
    api
      .get<{ summary: { total: number; correct: number; accuracy: number } }>(
        `/attempts/summary${gameMode ? `?gameMode=${gameMode}` : ""}`,
      )
      .then((r) => r.summary),
};

export const TYPE_LABEL: Record<PointType, string> = {
  signal: "signal",
  station: "station",
  crossing: "crossing",
  milepost: "milepost",
  ss: "SS",
};
