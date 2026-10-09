import test from "node:test";
import assert from "node:assert/strict";

import {
    getClientIp,
    hashRateLimitKey,
} from "../lib/auth/rate-limit-utils.js";

const testSecret = "test-only-secret-with-at-least-32-characters";

test("rate-limit identities are stored as stable keyed digests", () => {
    const first = hashRateLimitKey("login-email", "Admin@Example.com", testSecret);
    const second = hashRateLimitKey("login-email", "admin@example.com", testSecret);

    assert.equal(first, second);
    assert.match(first, /^[a-f0-9]{64}$/);
    assert.equal(first.includes("admin@example.com"), false);
});

test("rate-limit digests are isolated by scope and secret", () => {
    const emailKey = hashRateLimitKey("login-email", "admin@example.com", testSecret);
    const ipKey = hashRateLimitKey("login-ip", "admin@example.com", testSecret);
    const otherSecretKey = hashRateLimitKey(
        "login-email",
        "admin@example.com",
        "another-test-secret-with-at-least-32-characters"
    );

    assert.notEqual(emailKey, ipKey);
    assert.notEqual(emailKey, otherSecretKey);
});

test("rate-limit hashing rejects weak or missing secrets", () => {
    assert.throws(
        () => hashRateLimitKey("login-email", "admin@example.com", "weak"),
        /at least 32 characters/
    );
});

test("client IP extraction prefers the platform-provided address", () => {
    const request = new Request("https://example.com/api/auth/login", {
        headers: {
            "x-vercel-forwarded-for": "203.0.113.10",
            "x-real-ip": "203.0.113.20",
            "x-forwarded-for": "203.0.113.30, 10.0.0.1",
        },
    });

    assert.equal(getClientIp(request), "203.0.113.10");
});

test("client IP extraction supports proxy fallback and missing addresses", () => {
    const forwarded = new Request("https://example.com", {
        headers: { "x-forwarded-for": "203.0.113.40, 10.0.0.1" },
    });
    const missing = new Request("https://example.com");

    assert.equal(getClientIp(forwarded), "203.0.113.40");
    assert.equal(getClientIp(missing), null);
});
