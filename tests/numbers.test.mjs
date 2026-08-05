import assert from "node:assert/strict";
import test from "node:test";
import { toLatinDigits } from "../src/lib/formatters/numbers.ts";

test("يحوّل الأرقام العربية فقط ويحافظ على النص العربي", () => {
  assert.equal(toLatinDigits("المطاعم ١٢٣"), "المطاعم 123");
  assert.equal(toLatinDigits("لوحة الإدارة"), "لوحة الإدارة");
  assert.equal(toLatinDigits("السعر ۱۵۰ دج"), "السعر 150 دج");
});
