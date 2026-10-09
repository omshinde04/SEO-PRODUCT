import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

import RateLimitEntry from "../models/RateLimitEntry.js";
import {
    clearLoginIdentityRateLimits,
    enforceLoginRateLimit,
    enforceSubmissionRateLimit,
    hashRateLimitKey,
} from "../lib/auth/rate-limit.js";

const mongoUri = process.env.TEST_MONGODB_URI;
const testSecret = "integration-test-secret-not-for-production-000000000000";
process.env.AUTH_RATE_LIMIT_SECRET ||= testSecret;

function requestFor(ip) {
    return new Request("http://localhost/api/test", {
        headers: { "x-real-ip": ip },
    });
}

async function connectTestDatabase() {
    await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
    });
}

async function cleanupKeys(keys) {
    await RateLimitEntry.deleteMany({ key: { $in: keys } }).exec();
}

test("login rate limits persist across calls and successful login can clear identity buckets", {
    skip: !mongoUri,
}, async () => {
    const email = `login-${randomUUID()}@example.test`;
    const ip = `test-ip-${randomUUID()}`;
    const request = requestFor(ip);
    const keys = [
        hashRateLimitKey("login-ip", ip),
        hashRateLimitKey("login-email", email),
        hashRateLimitKey("login-email-ip", email + "\u0000" + ip),
    ];

    await connectTestDatabase();
    try {
        for (let attempt = 0; attempt < 8; attempt += 1) {
            const result = await enforceLoginRateLimit(request, email);
            assert.equal(result.limited, false, `attempt ${attempt + 1} should be allowed`);
        }

        const blocked = await enforceLoginRateLimit(request, email);
        assert.equal(blocked.limited, true);
        assert.ok(blocked.retryAfterSeconds > 0);

        await clearLoginIdentityRateLimits(request, email);
        const afterSuccessfulLogin = await enforceLoginRateLimit(request, email);
        assert.equal(afterSuccessfulLogin.limited, false);
    } finally {
        await cleanupKeys(keys);
        await mongoose.disconnect();
    }
});

test("public business submissions are rate-limited by email and IP", {
    skip: !mongoUri,
}, async () => {
    const email = `submission-${randomUUID()}@example.test`;
    const ip = `test-ip-${randomUUID()}`;
    const request = requestFor(ip);
    const keys = [
        hashRateLimitKey("submission-ip", ip),
        hashRateLimitKey("submission-email", email),
        hashRateLimitKey("submission-email-ip", email + "\u0000" + ip),
    ];

    await connectTestDatabase();
    try {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            const result = await enforceSubmissionRateLimit(request, email);
            assert.equal(result.limited, false, `submission ${attempt + 1} should be allowed`);
        }

        const blocked = await enforceSubmissionRateLimit(request, email);
        assert.equal(blocked.limited, true);
        assert.ok(blocked.retryAfterSeconds > 0);
    } finally {
        await cleanupKeys(keys);
        await mongoose.disconnect();
    }
});
