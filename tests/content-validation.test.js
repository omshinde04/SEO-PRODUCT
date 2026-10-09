import test from "node:test";
import assert from "node:assert/strict";
import {isSlug} from "../lib/content/admin-config.js";
test("slugs reject traversal, spaces and malformed separators",()=>{assert.equal(isSlug("ghoti-market"),true);assert.equal(isSlug("../admin"),false);assert.equal(isSlug("Two words"),false);assert.equal(isSlug("-leading"),false);assert.equal(isSlug("double--dash"),false);});
test("admin resource names are allowlisted",()=>{const allowed=["places","guides","events","submissions","media","seo","seo-templates"];assert.equal(allowed.includes("users"),false);assert.equal(allowed.includes("places"),true);});
