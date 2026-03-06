import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getWatchlist = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("watchlist")
      .withIndex("by_user_addedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const addToWatchlist = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_media", (q) => q.eq("userId", args.userId).eq("mediaId", args.mediaId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        mediaType: args.mediaType,
        title: args.title,
        posterPath: args.posterPath,
        status: args.status,
        addedAt: args.addedAt,
      });
      return;
    }

    await ctx.db.insert("watchlist", args);
  },
});

export const removeFromWatchlist = internalMutation({
  args: {
    userId: v.id("users"),
    mediaId: v.number(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("watchlist")
      .withIndex("by_user_media", (q) => q.eq("userId", args.userId).eq("mediaId", args.mediaId))
      .collect();

    await Promise.all(entries.map((entry) => ctx.db.delete(entry._id)));
  },
});
