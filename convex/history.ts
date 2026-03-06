import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getHistory = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("history")
      .withIndex("by_user_lastWatchedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const upsertHistory = internalMutation({
  args: {
    userId: v.id("users"),
    mediaId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.union(v.string(), v.null()),
    lastWatchedAt: v.number(),
    season: v.optional(v.number()),
    episode: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("history")
      .withIndex("by_user_media", (q) => q.eq("userId", args.userId).eq("mediaId", args.mediaId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        mediaType: args.mediaType,
        title: args.title,
        posterPath: args.posterPath,
        lastWatchedAt: args.lastWatchedAt,
        season: args.season,
        episode: args.episode,
      });
      return;
    }

    await ctx.db.insert("history", args);
  },
});
