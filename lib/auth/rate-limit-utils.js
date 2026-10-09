import { createHmac } from "node:crypto";

export function hashRateLimitKey(scope, identity, secret) {
    const keySecret =
        secret || process.env.AUTH_RATE_LIMIT_SECRET || process.env.JWT_SECRET;

    if (typeof scope !== "string" || !scope ||
        typeof identity !== "string" || !identity) {
        throw new TypeError("A rate-limit scope and identity are required.");
    }
    if (typeof keySecret !== "string" || keySecret.length < 32) {
        throw new Error("Rate-limit hashing requires a secret of at least 32 characters.");
    }

    return createHmac("sha256", keySecret)
        .update(scope + "\u0000" + identity.toLowerCase(), "utf8")
        .digest("hex");
}

/**
 * The application must run behind a trusted proxy that overwrites these
 * headers. Configure the hosting platform accordingly; never forward
 * user-controlled forwarding headers directly from an untrusted proxy.
 */
export function getClientIp(request) {
    const vercelIp = request.headers.get("x-vercel-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const forwardedFor = request.headers.get("x-forwarded-for");

    const value = (vercelIp || realIp || forwardedFor || "").split(",")[0];
    const ip = value.trim().slice(0, 128);

    return ip || null;
}
