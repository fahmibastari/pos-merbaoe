import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";

import { Prisma } from "@/generated/prisma/client";
import { AuthorizationError } from "./guard";
import { ValidationError } from "./validation";
import { ActionError, actionFailure, actionSuccess } from "./action-result";

test("hasil sukses selalu memakai bentuk ok/data", () => {
  assert.deepEqual(actionSuccess({ id: 7 }), { ok: true, data: { id: 7 } });
});

test("galat validasi mempertahankan pesan per field", () => {
  const result = actionFailure(
    new ValidationError("Data tidak valid.", { amount: ["Jumlah harus positif."] }),
    { actionName: "testValidation" },
  );

  assert.deepEqual(result, {
    ok: false,
    error: "Data tidak valid.",
    fieldErrors: { amount: ["Jumlah harus positif."] },
  });
});

test("galat yang disengaja aman ditampilkan apa adanya", () => {
  assert.deepEqual(
    actionFailure(new ActionError("Stok tidak cukup."), {
      actionName: "testBusiness",
    }),
    { ok: false, error: "Stok tidak cukup." },
  );
  assert.deepEqual(
    actionFailure(new AuthorizationError("Sesi berakhir."), {
      actionName: "testAuthorization",
    }),
    { ok: false, error: "Sesi berakhir." },
  );
});

test("galat FK memakai penjelasan dan tidak membocorkan pesan Prisma", () => {
  const error = new Prisma.PrismaClientKnownRequestError(
    "Raw database detail must stay private",
    { code: "P2003", clientVersion: "7.9.1" },
  );
  const result = actionFailure(error, {
    actionName: "testDelete",
    foreignKeyMessage: "Data masih digunakan.",
  });

  assert.deepEqual(result, { ok: false, error: "Data masih digunakan." });
  assert.equal(JSON.stringify(result).includes("Raw database detail"), false);
});

test("galat tak terduga dicatat dan diganti pesan umum", () => {
  const originalConsoleError = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => logged.push(args);

  try {
    const result = actionFailure(new Error("rahasia internal"), {
      actionName: "testUnexpected",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.includes("rahasia internal"), false);
    }
    assert.equal(logged.length, 1);
  } finally {
    console.error = originalConsoleError;
  }
});
