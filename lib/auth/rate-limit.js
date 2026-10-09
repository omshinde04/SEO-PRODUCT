import LoginAttempt from "../../models/LoginAttempt.js";
import {
    getClientIp,
    hashRateLimitKey,
} from "./rate-limit-utils.js";

export { getClientIp, hashRateLimitKey };

const WINDOW_MS = 15 * 60 * 1000;
const IP_LIMIT = 30;
const EMAIL_LIMIT = 8;
const PAIR_LIMIT = 8;

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
            { upsert: true, new: true, updatePipeline: true }
        ).lean().exec();
    } catch (error) {
        // A concurrent first request may win the unique-key insert.
        if (error?.code !== 11000) throw error;
        record = await LoginAttempt.findOneAndUpdate(
            { key },
            updatePipeline,
            { upsert: false, new: true, updatePipeline: true }
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


const SUBMISSION_WINDOW_MS = 60 * 60 * 1000;
const SUBMISSION_IP_LIMIT = 10;
const SUBMISSION_EMAIL_LIMIT = 3;
const SUBMISSION_PAIR_LIMIT = 3;

/** Rate-limit public business submissions across app instances and restarts. */
export async function enforceSubmissionRateLimit(request, email) {
    const now = new Date();
    const ip = getClientIp(request);
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
        throw new TypeError("Email is required for submission rate limiting.");
    }

    if (ip) {
        const ipRecord = await incrementWindow(
            hashRateLimitKey("submission-ip", ip),
            now,
            SUBMISSION_WINDOW_MS
        );
        const ipResult = resultFor(ipRecord, SUBMISSION_IP_LIMIT, now, SUBMISSION_WINDOW_MS);
        if (ipResult.limited) return ipResult;
    }

    const emailRecord = await incrementWindow(
        hashRateLimitKey("submission-email", normalizedEmail),
        now,
        SUBMISSION_WINDOW_MS
    );
    const emailResult = resultFor(
        emailRecord,
        SUBMISSION_EMAIL_LIMIT,
        now,
        SUBMISSION_WINDOW_MS
    );
    if (emailResult.limited) return emailResult;

    if (ip) {
        const pairRecord = await incrementWindow(
            hashRateLimitKey("submission-email-ip", normalizedEmail + "\u0000" + ip),
            now,
            SUBMISSION_WINDOW_MS
        );
        const pairResult = resultFor(
            pairRecord,
            SUBMISSION_PAIR_LIMIT,
            now,
            SUBMISSION_WINDOW_MS
        );
        if (pairResult.limited) return pairResult;
    }

    return { limited: false, retryAfterSeconds: 0 };
}
