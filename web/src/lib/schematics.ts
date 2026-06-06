import { api } from "./api.js";

export type PointType = "signal" | "station" | "crossing" | "milepost" | "ss";

export interface SchematicSummary {
  id: string;
  name: string;
  status: string;
  pointCount: number;
}

export interface SchematicPoint {
  id: string;
  type: PointType;
  label: string;
  x: number;
  y: number;
  track: string | null;
  order: number | null;
}

export interface SchematicTrack {
  id: string;
  color: string;
  polyline: [number, number][];
}

export interface Schematic {
  id: string;
  name: string;
  lineColor: string;
  status: string;
  viewBox: [number, number, number, number];
  tracks: SchematicTrack[];
  points: SchematicPoint[];
}

export interface PointInput {
  type: PointType;
  label: string;
  x: number;
  y: number;
  track?: string | null;
  order?: number | null;
}

export const schematicsApi = {
  list: () => api.get<{ schematics: SchematicSummary[] }>("/schematics").then((r) => r.schematics),
  get: (id: string) => api.get<{ schematic: Schematic }>(`/schematics/${id}`).then((r) => r.schematic),
  create: (json: unknown) =>
    api.post<{ schematic: Schematic }>("/schematics", json).then((r) => r.schematic),
  update: (id: string, data: { name?: string; status?: string; lineColor?: string }) =>
    api.put<{ schematic: Schematic }>(`/schematics/${id}`, data).then((r) => r.schematic),
  remove: (id: string) => api.del(`/schematics/${id}`),
  addPoint: (id: string, p: PointInput) =>
    api.post<{ point: SchematicPoint }>(`/schematics/${id}/points`, p).then((r) => r.point),
  updatePoint: (pointId: string, p: Partial<PointInput>) =>
    api.put<{ point: SchematicPoint }>(`/points/${pointId}`, p).then((r) => r.point),
  removePoint: (pointId: string) => api.del(`/points/${pointId}`),
};

export const POINT_TYPES: PointType[] = ["signal", "station", "crossing", "milepost", "ss"];
