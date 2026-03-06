import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    token: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  watchlist: defineTable({
    userId: v.id("users"),
    mediaId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("watching"),
      v.literal("completed"),
      v.literal("planning"),
      v.literal("on_hold"),
    ),
    addedAt: v.number(),
  })
    .index("by_user_addedAt", ["userId", "addedAt"])
    .index("by_user_media", ["userId", "mediaId"]),

  history: defineTable({
    userId: v.id("users"),
    mediaId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.union(v.string(), v.null()),
    lastWatchedAt: v.number(),
    season: v.optional(v.number()),
    episode: v.optional(v.number()),
  })
    .index("by_user_lastWatchedAt", ["userId", "lastWatchedAt"])
    .index("by_user_media", ["userId", "mediaId"]),
});
