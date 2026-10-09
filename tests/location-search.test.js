import test from "node:test";
import assert from "node:assert/strict";
import { getPrimaryLocationTerm } from "../lib/business/location-search.js";

test("uses the locality first in a full OpenStreetMap label", () => {
    assert.equal(
        getPrimaryLocationTerm("Ghoti, Igatpuri Subdistrict, Maharashtra, India"),
        "Ghoti"
    );
});

test("supports district, state, and simple single-place searches", () => {
    assert.equal(getPrimaryLocationTerm("Igatpuri Subdistrict, Maharashtra, India"), "Igatpuri Subdistrict");
    assert.equal(getPrimaryLocationTerm("Nashik"), "Nashik");
});

test("normalizes whitespace and handles empty or non-string input safely", () => {
    assert.equal(getPrimaryLocationTerm("  Ghoti   ,   Igatpuri Subdistrict  , India "), "Ghoti");
    assert.equal(getPrimaryLocationTerm("   "), "");
    assert.equal(getPrimaryLocationTerm(null), "");
});
