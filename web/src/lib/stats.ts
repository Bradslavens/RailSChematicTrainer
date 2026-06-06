import { api } from "./api.js";
import type { PointType } from "./schematics.js";

export interface MyStats {
  xp: number;
  level: number;
  intoLevel: number;
  perLevel: number;
  currentStreak: number;
  longestStreak: number;
}

export interface LeaderRow {
  email: string;
  xp: number;
  level: number;
}

export interface MasteryRow {
  type: PointType;
  total: number;
  mastered: number;
  avgMastery: number;
}

export const statsApi = {
  me: () => api.get<{ stats: MyStats }>("/stats/me").then((r) => r.stats),
  leaderboard: () => api.get<{ leaderboard: LeaderRow[] }>("/stats/leaderboard").then((r) => r.leaderboard),
  mastery: (schematicId: string) =>
    api.get<{ mastery: MasteryRow[] }>(`/stats/mastery?schematicId=${schematicId}`).then((r) => r.mastery),
};

export const progressApi = {
  due: (schematicId: string, types: PointType[], limit = 20) =>
    api
      .get<{ pointIds: string[] }>(
        `/progress/due?schematicId=${schematicId}&types=${types.join(",")}&limit=${limit}`,
      )
      .then((r) => r.pointIds),
};
