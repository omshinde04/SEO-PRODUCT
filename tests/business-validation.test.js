import test from "node:test";
import assert from "node:assert/strict";
import {
    optionalUrlSchema,
    requiredUrlSchema,
    validateCoordinatePair,
    validatePublishedBusiness,
    validateWeeklyHours,
    weeklyHoursSchema,
} from "../lib/business/validation.js";

test("optional URLs accept empty values and valid HTTP(S) URLs only", () => {
    assert.equal(optionalUrlSchema.safeParse("").success, true);
    assert.equal(optionalUrlSchema.safeParse("https://example.com/profile").success, true);
    assert.equal(optionalUrlSchema.safeParse("javascript:alert(1)").success, false);
});

test("required URLs reject empty and non-HTTP(S) values", () => {
    assert.equal(requiredUrlSchema.safeParse("").success, false);
    assert.equal(requiredUrlSchema.safeParse("https://example.com/image.webp").success, true);
    assert.equal(requiredUrlSchema.safeParse("ftp://example.com/file").success, false);
});

test("weekly opening hours accept closed days and valid multiple periods", () => {
    const result = weeklyHoursSchema.safeParse({
        monday: [
            { open: "09:00", close: "12:00" },
            { open: "13:00", close: "18:00" },
        ],
        tuesday: [],
    });
    assert.equal(result.success, true);
});

test("weekly opening hours reject invalid ranges and overlapping periods", () => {
    assert.notEqual(
        validateWeeklyHours({ monday: [{ open: "18:00", close: "09:00" }] }),
        null
    );
    assert.notEqual(
        validateWeeklyHours({
            monday: [
                { open: "09:00", close: "13:00" },
                { open: "12:00", close: "18:00" },
            ],
        }),
        null
    );
});

test("coordinates must be both present or both empty", () => {
    assert.equal(validateCoordinatePair({}, { latitude: 19.7, longitude: 73.5 }), null);
    assert.equal(validateCoordinatePair({}, { latitude: 19.7, longitude: null }) !== null, true);
    assert.equal(validateCoordinatePair({}, { latitude: null, longitude: null }), null);
});

test("published businesses require a name, description, category and location", () => {
    assert.match(
        validatePublishedBusiness({ status: "published", name: "Cafe", description: "", category: "c", location: "l" }),
        /description/
    );
    assert.equal(
        validatePublishedBusiness({ status: "published", name: "Cafe", description: "A local cafe", category: "c", location: "l" }),
        null
    );
    assert.equal(
        validatePublishedBusiness({ status: "draft", name: "Cafe", description: "", category: null, location: null }),
        null
    );
});
