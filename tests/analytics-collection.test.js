import { test } from "node:test";
import assert from "node:assert/strict";
import {
    sanitizePagePath,
    inferPageType,
    sanitizeReferrer,
    isInternalOrAdminRoute,
} from "../lib/analytics/sanitize.js";
import { parseUserAgent } from "../lib/analytics/user-agent.js";
import { hashRateLimitKey } from "../lib/auth/rate-limit-utils.js";

test("URL sanitization strips sensitive parameters while keeping benign params", () => {
    const raw = "/businesses?q=dhaba&token=secret123&password=pass&email=user@test.com&location=ghoti";
    const clean = sanitizePagePath(raw);
    assert.equal(clean, "/businesses?q=dhaba&location=ghoti");
    assert.equal(clean.includes("token="), false);
    assert.equal(clean.includes("secret123"), false);
    assert.equal(clean.includes("user@test.com"), false);
});

test("Page type inference recognizes GaavConnect routes accurately", () => {
    assert.equal(inferPageType("/"), "home");
    assert.equal(inferPageType("/businesses/hotel-kalinga"), "business");
    assert.equal(inferPageType("/businesses"), "business");
    assert.equal(inferPageType("/categories/agro-resorts"), "category");
    assert.equal(inferPageType("/locations/ghoti"), "location");
    assert.equal(inferPageType("/places/bhavali-dam"), "place");
    assert.equal(inferPageType("/guides/nashik-food-trail"), "guide");
    assert.equal(inferPageType("/events/nashik-wine-fest"), "event");
    assert.equal(inferPageType("/privacy"), "info");
    assert.equal(inferPageType("/unknown-custom-page"), "other");
});

test("Referrer sanitization exposes only hostnames and classifies source categories", () => {
    const google = sanitizeReferrer("https://www.google.com/search?q=ghoti+dhabas&oq=ghoti");
    assert.equal(google.source, "search");
    assert.equal(google.hostname, "www.google.com");

    const insta = sanitizeReferrer("https://instagram.com/p/some-post?igshid=xyz");
    assert.equal(insta.source, "social");
    assert.equal(insta.hostname, "instagram.com");

    const external = sanitizeReferrer("https://travelblog.in/top-places/nashik");
    assert.equal(external.source, "referral");
    assert.equal(external.hostname, "travelblog.in");

    const direct = sanitizeReferrer("");
    assert.equal(direct.source, "direct");
    assert.equal(direct.hostname, "direct");
});

test("Admin and private routes are strictly excluded from analytics tracking", () => {
    assert.equal(isInternalOrAdminRoute("/admin/dashboard"), true);
    assert.equal(isInternalOrAdminRoute("/admin/businesses"), true);
    assert.equal(isInternalOrAdminRoute("/api/admin/businesses"), true);
    assert.equal(isInternalOrAdminRoute("/api/auth/login"), true);
    assert.equal(isInternalOrAdminRoute("/businesses/kalinga-dhaba"), false);
    assert.equal(isInternalOrAdminRoute("/"), false);
});

test("User-Agent classification identifies broad devices and browsers without invasive fingerprinting", () => {
    const chromeDesktop =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const parsedChrome = parseUserAgent(chromeDesktop);
    assert.equal(parsedChrome.deviceType, "desktop");
    assert.equal(parsedChrome.browserFamily, "Chrome");
    assert.equal(parsedChrome.osFamily, "Windows");

    const iphoneSafari =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    const parsedIphone = parseUserAgent(iphoneSafari);
    assert.equal(parsedIphone.deviceType, "mobile");
    assert.equal(parsedIphone.browserFamily, "Safari");
    assert.equal(parsedIphone.osFamily, "iOS");

    const androidSamsung =
        "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36";
    const parsedSamsung = parseUserAgent(androidSamsung);
    assert.equal(parsedSamsung.deviceType, "mobile");
    assert.equal(parsedSamsung.browserFamily, "Samsung Internet");
    assert.equal(parsedSamsung.osFamily, "Android");
});

test("Visitor hashes are irreversible HMAC digests with scope isolation", () => {
    const secret = "a_super_secure_random_key_that_is_at_least_32_characters_long!";
    const hash1 = hashRateLimitKey("analytics-visitor", "192.168.1.1|Chrome", secret);
    const hash2 = hashRateLimitKey("analytics-visitor", "192.168.1.1|Chrome", secret);
    const hashDiff = hashRateLimitKey("analytics-visitor", "192.168.1.2|Chrome", secret);

    assert.equal(hash1, hash2);
    assert.notEqual(hash1, hashDiff);
    assert.equal(hash1.length, 64);
    assert.equal(hash1.includes("192.168.1.1"), false);
});
