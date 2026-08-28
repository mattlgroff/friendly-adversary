import assert from "node:assert/strict";
import test from "node:test";
import { invoiceTotal } from "./invoice.js";

test("totals an invoice", () => {
  const amounts = [0.015, 0.015, 0.015];
  const expected = amounts
    .map((amount) => Math.round(amount * 100) / 100)
    .reduce((total, amount) => total + amount, 0);

  assert.equal(invoiceTotal(amounts), expected);
});
