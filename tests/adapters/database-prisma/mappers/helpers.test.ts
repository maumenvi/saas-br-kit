import assert from "node:assert/strict";
import test from "node:test";
import {
  asRow,
  jsonArray,
  jsonValue,
  optionalString,
  safeMetadata,
  toDate,
  toIsoString,
} from "../../../../src/adapters/database-prisma/mappers/helpers.ts";
import { timestamp } from "../support.ts";

test("converts supported row, date, string, metadata and JSON values", () => {
  const date = new Date(timestamp);
  const row = { id: "row_1" };

  assert.equal(asRow(row), row);
  assert.equal(toIsoString(date), timestamp);
  assert.equal(toIsoString(timestamp), timestamp);
  assert.deepEqual(toDate(timestamp), date);
  assert.equal(toDate(undefined), undefined);
  assert.equal(optionalString("value"), "value");
  assert.equal(optionalString(1), undefined);
  assert.deepEqual(
    safeMetadata({ text: "yes", count: 2, enabled: true, nil: null, nested: { tags: ["a", "b"] } }),
    {
      text: "yes",
      count: 2,
      enabled: true,
      nil: null,
      nested: { tags: ["a", "b"] },
    },
  );
  assert.deepEqual(jsonArray(["one", 2, "three"]), ["one", "three"]);
  assert.deepEqual(jsonArray("one"), []);
  assert.deepEqual(jsonValue({ nested: [1, true, null, undefined] }), {
    nested: [1, true, null, null],
  });
});

test("rejects invalid rows and dates and ignores unsafe metadata", () => {
  assert.throws(() => asRow(null), /expected an object row/);
  assert.throws(() => asRow("row"), /expected an object row/);
  assert.throws(() => toIsoString(1), /expected a date-compatible value/);
  assert.equal(safeMetadata(null), undefined);
  assert.equal(safeMetadata([]), undefined);
  assert.deepEqual(safeMetadata({ nested: {}, array: [] }), { nested: {}, array: [] });
  assert.equal(safeMetadata({ invalid: undefined }), undefined);
});
