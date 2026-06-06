import { Router } from "express";
import { registerSchema, loginSchema, signToken, type Role } from "../domain/auth.js";
import {
  registerUser,
  authenticateUser,
  getUserById,
  publicUser,
  UserError,
} from "../services/userService.js";
import { getSecret, requireAuth, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  try {
    const user = await registerUser(parsed.data.email, parsed.data.password);
    const token = signToken({ userId: user.id, role: user.role as Role }, getSecret());
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err instanceof UserError) {
      res.status(409).json({ error: err.message });
      return;
    }
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  try {
    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    const token = signToken({ userId: user.id, role: user.role as Role }, getSecret());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    if (err instanceof UserError) {
      res.status(401).json({ error: err.message });
      return;
    }
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});
