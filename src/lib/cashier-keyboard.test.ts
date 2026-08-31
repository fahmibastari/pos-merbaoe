import assert from "node:assert/strict";
import test from "node:test";
import {
  nextEnabledProductIndex,
  resolveCashierShortcut,
} from "./cashier-keyboard";

test("slash memindahkan fokus ke pencarian hanya di luar field input", () => {
  assert.equal(resolveCashierShortcut({ key: "/", targetTagName: "BODY" }), "search");
  assert.equal(resolveCashierShortcut({ key: "/", targetTagName: "INPUT" }), null);
  assert.equal(resolveCashierShortcut({ key: "/", isContentEditable: true }), null);
  assert.equal(resolveCashierShortcut({ key: "/", ctrlKey: true }), null);
});

test("F2 menuju pembayaran termasuk ketika fokus berada di field", () => {
  assert.equal(resolveCashierShortcut({ key: "F2", targetTagName: "INPUT" }), "payment");
  assert.equal(resolveCashierShortcut({ key: "F2", altKey: true }), null);
});

test("navigasi kartu berputar dan melewati menu yang tidak tersedia", () => {
  assert.equal(
    nextEnabledProductIndex({
      currentIndex: 0,
      itemCount: 4,
      key: "ArrowRight",
      disabledIndexes: [1],
    }),
    2,
  );
  assert.equal(
    nextEnabledProductIndex({
      currentIndex: 0,
      itemCount: 4,
      key: "ArrowLeft",
      disabledIndexes: [3],
    }),
    2,
  );
  assert.equal(
    nextEnabledProductIndex({
      currentIndex: 2,
      itemCount: 4,
      key: "Home",
      disabledIndexes: [0],
    }),
    1,
  );
});

test("navigasi kartu mengembalikan null bila seluruh menu nonaktif", () => {
  assert.equal(
    nextEnabledProductIndex({
      currentIndex: 0,
      itemCount: 2,
      key: "ArrowRight",
      disabledIndexes: [0, 1],
    }),
    null,
  );
});
