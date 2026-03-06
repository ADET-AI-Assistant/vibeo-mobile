const encoder = new TextEncoder();

export const sha256 = async (value: string) => {
  const input = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", input);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const createSessionToken = () => {
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  }
};

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
