import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

export const getProfile = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    return {
      uid: user._id,
      email: user.email,
      onboarded: true,
      totalWatchTime: 0,
      favoriteMovies: [],
    };
  },
});
