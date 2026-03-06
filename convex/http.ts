import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });

const getBearerToken = (request: Request) => {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const parseJsonBody = async (request: Request) => {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
};

const getAuthedUser = async (ctx: any, request: Request) => {
  const token = getBearerToken(request);
  if (!token) return null;

  const auth = await ctx.runQuery(internal.auth.getUserFromToken, { token });
  if (!auth) return null;

  return { ...auth, token };
};

http.route({
  path: "/auth/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await parseJsonBody(request);
      const email = typeof body.email === "string" ? body.email : "";
      const password = typeof body.password === "string" ? body.password : "";
      const name = typeof body.name === "string" ? body.name : undefined;

      if (!email || !password) {
        return json(400, { error: "Email and password are required." });
      }

      const result = await ctx.runMutation(internal.auth.registerWithPassword, {
        email,
        password,
        name,
      });

      return json(200, result);
    } catch (error: any) {
      return json(400, { error: error?.message || "Registration failed." });
    }
  }),
});

http.route({
  path: "/auth/login",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await parseJsonBody(request);
      const email = typeof body.email === "string" ? body.email : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!email || !password) {
        return json(400, { error: "Email and password are required." });
      }

      const result = await ctx.runMutation(internal.auth.loginWithPassword, { email, password });
      return json(200, result);
    } catch (error: any) {
      return json(401, { error: error?.message || "Login failed." });
    }
  }),
});

http.route({
  path: "/auth/logout",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const token = getBearerToken(request);
    if (!token) {
      return json(200, { success: true });
    }

    await ctx.runMutation(internal.auth.logoutSession, { token });
    return json(200, { success: true });
  }),
});

http.route({
  path: "/profile",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await getAuthedUser(ctx, request);
    if (!auth) {
      return json(401, { error: "Unauthorized" });
    }

    const profile = await ctx.runQuery(internal.profile.getProfile, { userId: auth.userId });
    return json(200, profile);
  }),
});

http.route({
  path: "/watchlist",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await getAuthedUser(ctx, request);
    if (!auth) {
      return json(401, { error: "Unauthorized" });
    }

    const rows = await ctx.runQuery(internal.watchlist.getWatchlist, { userId: auth.userId });
    const items = rows.map((row: any) => ({
      mediaId: row.mediaId,
      mediaType: row.mediaType,
      title: row.title,
      posterPath: row.posterPath,
      status: row.status,
      addedAt: row.addedAt,
    }));

    return json(200, items);
  }),
});

http.route({
  path: "/watchlist/add",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await getAuthedUser(ctx, request);
    if (!auth) {
      return json(401, { error: "Unauthorized" });
    }

    try {
      const body = await parseJsonBody(request);
      await ctx.runMutation(internal.watchlist.addToWatchlist, {
        userId: auth.userId,
        mediaId: Number(body.mediaId),
        mediaType: body.mediaType,
        title: body.title,
        posterPath: body.posterPath ?? null,
        status: body.status,
        addedAt: Number(body.addedAt || Date.now()),
      });

      return json(200, { success: true });
    } catch (error: any) {
      return json(400, { error: error?.message || "Failed to add watchlist item." });
    }
  }),
});

http.route({
  path: "/watchlist/remove",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await getAuthedUser(ctx, request);
    if (!auth) {
      return json(401, { error: "Unauthorized" });
    }

    const body = await parseJsonBody(request);
    await ctx.runMutation(internal.watchlist.removeFromWatchlist, {
      userId: auth.userId,
      mediaId: Number(body.mediaId),
    });

    return json(200, { success: true });
  }),
});

http.route({
  path: "/history",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await getAuthedUser(ctx, request);
    if (!auth) {
      return json(401, { error: "Unauthorized" });
    }

    const rows = await ctx.runQuery(internal.history.getHistory, { userId: auth.userId });
    const items = rows.map((row: any) => ({
      mediaId: row.mediaId,
      mediaType: row.mediaType,
      title: row.title,
      posterPath: row.posterPath,
      lastWatchedAt: row.lastWatchedAt,
      season: row.season,
      episode: row.episode,
    }));

    return json(200, items);
  }),
});

http.route({
  path: "/history/upsert",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await getAuthedUser(ctx, request);
    if (!auth) {
      return json(401, { error: "Unauthorized" });
    }

    try {
      const body = await parseJsonBody(request);
      await ctx.runMutation(internal.history.upsertHistory, {
        userId: auth.userId,
        mediaId: Number(body.mediaId),
        mediaType: body.mediaType,
        title: body.title,
        posterPath: body.posterPath ?? null,
        lastWatchedAt: Number(body.lastWatchedAt || Date.now()),
        season: typeof body.season === "number" ? body.season : undefined,
        episode: typeof body.episode === "number" ? body.episode : undefined,
      });

      return json(200, { success: true });
    } catch (error: any) {
      return json(400, { error: error?.message || "Failed to update history." });
    }
  }),
});

export default http;
