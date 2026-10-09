import { createHmac } from "node:crypto";

import LoginAttempt from "@/models/LoginAttempt";

const WINDOW_MS = 15 * 60 * 1000;
const IP_LIMIT = 30;
const EMAIL_LIMIT = 8;
const PAIR_LIMIT = 8;

function getSecret() {
    const secret = process.env.AUTH_RATE_LIMIT_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("AUTH_RATE_LIMIT_SECRET or a strong JWT_SECRET is required for login rate limiting.");
    }
    return secret;
}

/** Store only keyed digests so database records do not expose emails or IP addresses. */
export function hashRateLimitKey(scope, identity, secret = getSecret()) {
    if (typeof scope !== "string" || !scope || typeof identity !== "string" || !identity) {
        throw new TypeError("A rate-limit scope and identity are required.");
    }
    if (typeof secret !== "string" || secret.length < 32) {
        throw new Error("Rate-limit hashing requires a secret of at least 32 characters.");
    }

    return createHmac("sha256", secret)
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

    const value = vercelIp || realIp || forwardedFor?.split(",")[0] || "";
    const ip = value.trim().slice(0, 128);

    return ip || null;
}

async function incrementWindow(key, now, windowMs = WINDOW_MS) {
    const cutoff = new Date(now.getTime() - windowMs);
    const expiresAt = new Date(now.getTime() + windowMs);
    const updatePipeline = [
        {
            $set: {
                count: {
                    $cond: [
                        {
                            $gt: [
                                { $ifNull: ["$windowStartedAt", new Date(0)] },
                                cutoff,
                            ],
                        },
                        { $add: [{ $ifNull: ["$count", 0] }, 1] },
                        1,
                    ],
                },
                windowStartedAt: {
                    $cond: [
                        {
                            $gt: [
                                { $ifNull: ["$windowStartedAt", new Date(0)] },
                                cutoff,
                            ],
                        },
                        "$windowStartedAt",
                        now,
                    ],
                },
                expiresAt,
            },
        },
    ];

    let record;
    try {
        record = await LoginAttempt.findOneAndUpdate(
            { key },
            updatePipeline,
            { upsert: true, new: true }
        ).lean().exec();
    } catch (error) {
        // A concurrent first request may win the unique-key insert.
        if (error?.code !== 11000) throw error;
        record = await LoginAttempt.findOneAndUpdate(
            { key },
            updatePipeline,
            { upsert: false, new: true }
        ).lean().exec();
    }

    if (!record) {
        throw new Error("Could not update login rate-limit counter.");
    }

    return record;
}

function resultFor(record, limit, now, windowMs = WINDOW_MS) {
    const limited = record.count > limit;
    const windowEndsAt = new Date(record.windowStartedAt).getTime() + windowMs;

    return {
        limited,
        count: record.count,
        limit,
        retryAfterSeconds: limited
            ? Math.max(1, Math.ceil((windowEndsAt - now.getTime()) / 1000))
            : 0,
    };
}

/**
 * Apply persistent, cross-instance throttling to login requests.
 * The IP bucket slows credential stuffing; the email bucket protects one
 * account across IPs; the combined bucket limits repeated attempts per pair.
 */
export async function enforceLoginRateLimit(request, email) {
    const now = new Date();
    const ip = getClientIp(request);

    if (ip) {
        const ipRecord = await incrementWindow(
            hashRateLimitKey("login-ip", ip),
            now
        );
        const ipResult = resultFor(ipRecord, IP_LIMIT, now);
        if (ipResult.limited) return ipResult;
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
        throw new TypeError("Email is required for login rate limiting.");
    }

    const emailRecord = await incrementWindow(
        hashRateLimitKey("login-email", normalizedEmail),
        now
    );
    const emailResult = resultFor(emailRecord, EMAIL_LIMIT, now);
    if (emailResult.limited) return emailResult;

    if (ip) {
        const pairRecord = await incrementWindow(
            hashRateLimitKey("login-email-ip", normalizedEmail + "\u0000" + ip),
            now
        );
        const pairResult = resultFor(pairRecord, PAIR_LIMIT, now);
        if (pairResult.limited) return pairResult;
    }

    return { limited: false, retryAfterSeconds: 0 };
}

export async function clearLoginIdentityRateLimits(request, email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return;

    const keys = [
        hashRateLimitKey("login-email", normalizedEmail),
    ];
    const ip = getClientIp(request);

    if (ip) {
        keys.push(
            hashRateLimitKey("login-email-ip", normalizedEmail + "\u0000" + ip)
        );
    }

    await LoginAttempt.deleteMany({ key: { $in: keys } }).exec();
}
