import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { processSale, type CheckoutInput } from "./checkout-service";
import { processSaleVoid } from "./void-sale-service";
import { APPROVAL_WINDOW_MS, setApprovalPin, verifyApproval } from "./approval";
import { ActionError } from "./action-result";
import { getManagedUsers } from "./user-management";

test("catatan, diskon persen/nominal, retry, PIN dan Void kasir menjaga snapshot dan stok", { skip: process.env.RUN_DB_TESTS !== "1" }, async () => {
  const suffix = randomUUID();
  const admin = await prisma.user.create({ data: { name: "QA Approval Admin", username: `approval-${suffix}`, passwordHash: "test-only", role: "admin" } });
  const cashier = await prisma.user.create({ data: { name: "QA Approval Kasir", username: `notes-${suffix}`, passwordHash: "test-only", role: "kasir" } });
  const other = await prisma.user.create({ data: { name: "QA Other Kasir", username: `other-${suffix}`, passwordHash: "test-only", role: "kasir" } });
  const ids = [admin.id, cashier.id, other.id];
  const ingredient = await prisma.ingredient.create({ data: { name: `QA Notes ${suffix}`, unit: "gram", currentStock: 100, stockValue: 1000, averageCost: 10 } });
  const product = await prisma.product.create({ data: { name: `QA Notes ${suffix}`, category: { connect: { slug: "kopi" } }, sellingPrice: 101, baseHpp: 20, hasRecipe: true, recipes: { create: { ingredientId: ingredient.id, quantityNeeded: 2 } } } });
  try {
    await prisma.cashierShift.create({ data: { cashierId: cashier.id, openingCash: 0 } });
    await assert.rejects(verifyApproval(cashier.id, "discount", { approvalAdminId: admin.id, approvalPin: "246810" }), ActionError);
    await setApprovalPin(admin.id, admin.id, "246810");
    const storedAdmin = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    assert.notEqual(storedAdmin.approvalPinHash, "246810");
    assert.equal(await bcrypt.compare("246810", storedAdmin.approvalPinHash!), true);
    const managed = (await getManagedUsers()).find((user) => user.id === admin.id)!;
    assert.equal(managed.hasApprovalPin, true);
    assert.equal(JSON.stringify(managed).includes(storedAdmin.approvalPinHash!), false);
    await assert.rejects(setApprovalPin(cashier.id, admin.id, "123456"), ActionError);
    await assert.rejects(setApprovalPin(admin.id, cashier.id, "123456"), ActionError);
    const input: CheckoutInput = { idempotencyKey: randomUUID(), paymentMethod: "qris", discountAmount: 0, discountType: "percentage", discountValue: 12.5, taxRate: 0, cashReceived: null,
      approvalAdminId: admin.id, approvalPin: "246810", items: [{ productId: product.id, quantity: 1, notes: "less sugar" }, { productId: product.id, quantity: 1, notes: "less ice" }] };
    await assert.rejects(processSale(cashier.id, { ...input, approvalPin: "000000" }), ActionError);
    assert.equal(await prisma.sale.count({ where: { cashierId: cashier.id } }), 0);
    assert.equal(Number((await prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } })).currentStock), 100);
    const [left, right] = await Promise.all([processSale(cashier.id, input), processSale(cashier.id, input)]);
    assert.equal(left.saleId, right.saleId);
    assert.equal(left.discountAmount, 25);
    assert.equal(left.totalAmount, 177);
    const sale = await prisma.sale.findUniqueOrThrow({ where: { id: left.saleId }, include: { details: { orderBy: { id: "asc" } } } });
    assert.equal(sale.discountApprovedBy, admin.id);
    assert.equal(Number(sale.discountValue), 12.5);
    assert.equal(sale.discountType, "percentage");
    assert.deepEqual(sale.details.map((item) => item.notes), ["less sugar", "less ice"]);
    assert.equal(Number(sale.totalHpp), 40);
    assert.equal(Number((await prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } })).currentStock), 96);
    await assert.rejects(processSale(cashier.id, { ...input, items: [{ ...input.items[0], notes: "tanpa susu" }] }), /checkout yang berbeda/);
    await assert.rejects(processSaleVoid(left.saleId, other.id, "Tidak boleh lintas kasir", input), ActionError);
    await assert.rejects(processSaleVoid(left.saleId, cashier.id, "PIN salah", { ...input, approvalPin: "000000" }), ActionError);
    assert.equal((await prisma.sale.findUniqueOrThrow({ where: { id: left.saleId } })).status, "completed");
    await processSaleVoid(left.saleId, cashier.id, "Pesanan salah", input);
    assert.equal((await prisma.sale.findUniqueOrThrow({ where: { id: left.saleId } })).voidedBy, admin.id);
    assert.equal(Number((await prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } })).currentStock), 100);
    await assert.rejects(processSaleVoid(left.saleId, cashier.id, "Lagi", input), /sudah dibatalkan/);
    const voidAudit = await prisma.auditLog.findFirstOrThrow({ where: { entity: "sale", entityId: left.saleId, action: "void" } });
    assert.equal(voidAudit.userId, cashier.id);
    assert.equal((voidAudit.afterData as { approverId: number }).approverId, admin.id);
    const amount = await processSale(cashier.id, { ...input, idempotencyKey: randomUUID(), discountType: "amount", discountValue: 10.5, items: [{ productId: product.id, quantity: 1 }] });
    assert.equal(amount.discountAmount, 11);
    const voids = await Promise.allSettled([
      processSaleVoid(amount.saleId, cashier.id, "Void bersamaan", input),
      processSaleVoid(amount.saleId, cashier.id, "Void bersamaan", input),
    ]);
    assert.equal(voids.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(Number((await prisma.ingredient.findUniqueOrThrow({ where: { id: ingredient.id } })).currentStock), 100);
    const audits = await prisma.auditLog.findMany({ where: { userId: { in: ids } } });
    assert.equal(JSON.stringify(audits).includes("246810"), false);
    assert.equal(JSON.stringify(audits).includes(storedAdmin.approvalPinHash!), false);
    const now = new Date();
    for (let i = 0; i < 5; i++) await assert.rejects(verifyApproval(cashier.id, "void", { approvalAdminId: admin.id, approvalPin: "000000" }, now), ActionError);
    await assert.rejects(verifyApproval(cashier.id, "void", input, now), ActionError);
    await verifyApproval(cashier.id, "discount", input, now); // scopes are independent
    await verifyApproval(cashier.id, "void", input, new Date(now.getTime() + APPROVAL_WINDOW_MS + 1));
    await setApprovalPin(admin.id, admin.id, "135790");
    await assert.rejects(verifyApproval(cashier.id, "discount", input), ActionError);
    await prisma.user.update({ where: { id: admin.id }, data: { isActive: false } });
    await assert.rejects(verifyApproval(cashier.id, "discount", { ...input, approvalPin: "135790" }), ActionError);
  } finally {
    await prisma.$transaction(async (tx) => {
      await tx.stockTransaction.deleteMany({ where: { ingredientId: ingredient.id } });
      await tx.sale.deleteMany({ where: { cashierId: { in: ids } } });
      await tx.cashierShift.deleteMany({ where: { cashierId: { in: ids } } });
      await tx.product.delete({ where: { id: product.id } });
      await tx.ingredient.delete({ where: { id: ingredient.id } });
      await tx.auditLog.deleteMany({ where: { userId: { in: ids } } });
      await tx.user.deleteMany({ where: { id: { in: ids } } });
    }, { timeout: 30_000 });
  }
});
