import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { createSessionToken, SESSION_TTL_MS, sha256 } from "./lib";

const toPublicUser = (user: { _id: any; email: string; name?: string }) => ({
  id: user._id,
  email: user.email,
  name: user.name ?? null,
});

export const registerWithPassword = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      throw new Error("Email is already registered.");
    }

    const passwordHash = await sha256(args.password);
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash,
      name: args.name?.trim() || undefined,
      createdAt: Date.now(),
    });

    const token = createSessionToken();
    await ctx.db.insert("sessions", {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Failed to create user session.");
    }

    return { token, user: toPublicUser(user) };
  },
});

export const loginWithPassword = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const passwordHash = await sha256(args.password);
    if (passwordHash !== user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const token = createSessionToken();
    await ctx.db.insert("sessions", {
      token,
      userId: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return { token, user: toPublicUser(user) };
  },
});

export const logoutSession = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

export const getUserFromToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) {
      return null;
    }

    if (session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name ?? null,
      token: session.token,
    };
  },
});
