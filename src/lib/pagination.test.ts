import assert from "node:assert/strict";
import test from "node:test";
import { getStringParam, pageHref, paginate, parsePage } from "./pagination";

test("parameter query mengambil satu nilai dan halaman tidak sah kembali ke satu", () => {
  assert.equal(getStringParam([" kopi ", "teh"]), "kopi");
  assert.equal(parsePage("3"), 3);
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("1.5"), 1);
  assert.equal(parsePage("abc"), 1);
});

test("pagination membatasi halaman agar tidak melewati hasil terakhir", () => {
  assert.deepEqual(paginate(41, 99, 20), {
    page: 3,
    totalPages: 3,
    skip: 40,
    take: 20,
  });
  assert.deepEqual(paginate(0, 2, 20), {
    page: 1,
    totalPages: 1,
    skip: 0,
    take: 20,
  });
});

test("tautan halaman mempertahankan filter dan menghilangkan page=1", () => {
  assert.equal(
    pageHref("/admin/products", { q: "kopi susu", from: "" }, 2),
    "/admin/products?q=kopi+susu&page=2",
  );
  assert.equal(pageHref("/admin/products", { q: "kopi" }, 1), "/admin/products?q=kopi");
});
