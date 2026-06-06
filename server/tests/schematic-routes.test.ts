import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers/db.js";
import { createApp } from "../src/app.js";
import { registerUser } from "../src/services/userService.js";
import { signToken } from "../src/domain/auth.js";

const app = createApp();
const secret = process.env.JWT_SECRET!;

async function tokens() {
  const admin = await registerUser("admin@example.com", "password123", "admin");
  const learner = await registerUser("learner@example.com", "password123", "learner");
  return {
    admin: signToken({ userId: admin.id, role: "admin" }, secret),
    learner: signToken({ userId: learner.id, role: "learner" }, secret),
  };
}

const sample = {
  name: "La Mesa Branch",
  viewBox: [0, 0, 700, 950],
  tracks: [{ id: "left", polyline: [[365, 40], [365, 910]] }],
  points: [{ type: "signal", label: "E18LA", x: 345, y: 95, track: "left" }],
};

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("POST /api/schematics", () => {
  it("lets an admin create a schematic", async () => {
    const { admin } = await tokens();
    const res = await request(app)
      .post("/api/schematics")
      .set("Authorization", `Bearer ${admin}`)
      .send(sample);
    expect(res.status).toBe(201);
    expect(res.body.schematic.name).toBe("La Mesa Branch");
  });

  it("forbids a learner (403)", async () => {
    const { learner } = await tokens();
    const res = await request(app)
      .post("/api/schematics")
      .set("Authorization", `Bearer ${learner}`)
      .send(sample);
    expect(res.status).toBe(403);
  });

  it("rejects invalid JSON with 400", async () => {
    const { admin } = await tokens();
    const res = await request(app)
      .post("/api/schematics")
      .set("Authorization", `Bearer ${admin}`)
      .send({ name: "" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/schematics", () => {
  it("requires authentication (401)", async () => {
    expect((await request(app).get("/api/schematics")).status).toBe(401);
  });

  it("returns the list for an authenticated learner", async () => {
    const { admin, learner } = await tokens();
    await request(app).post("/api/schematics").set("Authorization", `Bearer ${admin}`).send(sample);
    const res = await request(app).get("/api/schematics").set("Authorization", `Bearer ${learner}`);
    expect(res.status).toBe(200);
    expect(res.body.schematics).toHaveLength(1);
  });
});

describe("schematic and point mutations", () => {
  async function seedOne(adminToken: string) {
    const res = await request(app)
      .post("/api/schematics")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sample);
    return res.body.schematic;
  }

  it("updates metadata, manages points, and deletes (admin)", async () => {
    const { admin } = await tokens();
    const created = await seedOne(admin);

    const upd = await request(app)
      .put(`/api/schematics/${created.id}`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ status: "published" });
    expect(upd.body.schematic.status).toBe("published");

    const newPoint = await request(app)
      .post(`/api/schematics/${created.id}/points`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ type: "crossing", label: "University Ave", x: 200, y: 173 });
    expect(newPoint.status).toBe(201);
    const pointId = newPoint.body.point.id;

    const editPoint = await request(app)
      .put(`/api/points/${pointId}`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ label: "Allison Ave" });
    expect(editPoint.body.point.label).toBe("Allison Ave");

    expect(
      (await request(app).delete(`/api/points/${pointId}`).set("Authorization", `Bearer ${admin}`))
        .status,
    ).toBe(204);

    expect(
      (
        await request(app)
          .delete(`/api/schematics/${created.id}`)
          .set("Authorization", `Bearer ${admin}`)
      ).status,
    ).toBe(204);
  });

  it("forbids a learner from mutating points (403)", async () => {
    const { admin, learner } = await tokens();
    const created = await seedOne(admin);
    const res = await request(app)
      .post(`/api/schematics/${created.id}/points`)
      .set("Authorization", `Bearer ${learner}`)
      .send({ type: "crossing", label: "X", x: 1, y: 1 });
    expect(res.status).toBe(403);
  });
});
