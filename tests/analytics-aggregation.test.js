import { test } from "node:test";
import assert from "node:assert/strict";

// Ensure MONGODB_URI exists for module evaluation
process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/test";

import { resolveDateRange, generateCsv } from "../lib/analytics/aggregate.js";

test("Date range resolution calculates equal-length comparison periods", () => {
    const range7d = resolveDateRange("7d");
    assert.equal(range7d.range, "7d");
    const currentDuration = range7d.endDate.getTime() - range7d.startDate.getTime();
    const prevDuration = range7d.prevEndDate.getTime() - range7d.prevStartDate.getTime();
    assert.equal(currentDuration, prevDuration);
    assert.equal(range7d.startDate.getTime(), range7d.prevEndDate.getTime());
});

test("Date range resolution supports custom dates cleanly", () => {
    const custom = resolveDateRange("custom", "2026-01-01T00:00:00Z", "2026-01-10T00:00:00Z");
    assert.equal(custom.range, "custom");
    assert.equal(custom.startDate.toISOString(), "2026-01-01T00:00:00.000Z");
    assert.equal(custom.endDate.toISOString(), "2026-01-10T00:00:00.000Z");
});

test("CSV generator correctly escapes quotes and commas per RFC-4180", () => {
    const headers = ["Page Title", "Page Path", "Views"];
    const rows = [
        ['Hotel "Kalinga" Dhaba, Nashik', "/businesses/kalinga-dhaba", 42],
        ["Simple Page", "/about", 10],
    ];

    const csv = generateCsv(headers, rows);
    assert.equal(csv.includes('"Hotel ""Kalinga"" Dhaba, Nashik"'), true);
    assert.equal(csv.includes('"/businesses/kalinga-dhaba"'), true);
    assert.equal(csv.includes('"42"'), true);
});
