"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "@/app/login/LogoutButton";
import { submitSale } from "./actions";
import { formatRupiah } from "@/lib/money";
import { EmptyState } from "@/components/EmptyState";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import { Feedback } from "@/components/Feedback";
import { Field } from "@/components/Field";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  currentStock: unknown;
};

type Recipe = {
  ingredient: Ingredient;
  quantityNeeded: unknown;
};

type Product = {
  id: number;
  name: string;
  sellingPrice: unknown;
  baseHpp: unknown;
  hasRecipe: boolean;
  recipes: Recipe[];
};

type CartItem = {
  product: Product;
  quantity: number;
};

function canAfford(product: Product, cart: CartItem[]): { ok: boolean; reason?: string } {
  if (!product.hasRecipe || product.recipes.length === 0) return { ok: true };

  for (const recipe of product.recipes) {
    const ing = recipe.ingredient;
    const needed = Number(recipe.quantityNeeded);
    const alreadyInCart = cart
      .filter((c) => c.product.recipes.some((r) => r.ingredient.id === ing.id))
      .reduce((sum, c) => {
        const r = c.product.recipes.find((r) => r.ingredient.id === ing.id);
        return sum + (r ? Number(r.quantityNeeded) * c.quantity : 0);
      }, 0);
    const available = Number(ing.currentStock) - alreadyInCart;
    if (available < needed) {
      return { ok: false, reason: `Stok ${ing.name} tidak cukup (${available.toFixed(0)} ${ing.unit} tersisa)` };
    }
  }
  return { ok: true };
}

export default function CashierPOS({
  products,
  cashierName,
}: {
  products: Product[];
  cashierName: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [payment, setPayment] = useState<"cash" | "qris" | "transfer">("cash");
  const [discountInput, setDiscountInput] = useState("0");
  const [taxRateInput, setTaxRateInput] = useState("0");
  const [cashReceivedInput, setCashReceivedInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{
    saleId: number;
    invoiceNumber: string;
    subtotalAmount: number;
    discountAmount: number;
    netAmount: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    cashReceived: number | null;
    changeAmount: number | null;
  } | null>(null);
  const [search, setSearch] = useState("");

  const subtotalAmount = cart.reduce(
    (sum, item) =>
      sum + Math.round(Number(item.product.sellingPrice) * item.quantity),
    0,
  );
  const discountAmount = Number(discountInput) || 0;
  const taxRate = Math.max(0, Number(taxRateInput) || 0);
  const netAmount = Math.max(0, subtotalAmount - discountAmount);
  const taxAmount = Math.round(netAmount * taxRate);
  const totalAmount = netAmount + taxAmount;
  const cashReceived = Number(cashReceivedInput) || 0;
  const changeAmount = Math.max(0, cashReceived - totalAmount);
  const discountInvalid =
    discountAmount < 0 || discountAmount > subtotalAmount;
  const discountError =
    discountAmount < 0
      ? "Diskon tidak boleh negatif."
      : "Diskon tidak boleh melebihi subtotal.";
  const cashInsufficient = payment === "cash" && cashReceived < totalAmount;

  function addToCart(product: Product) {
    const check = canAfford(product, cart);
    if (!check.ok) {
      setError(check.reason!);
      return;
    }
    setError(null);
    if (cart.length === 0) setIdempotencyKey(crypto.randomUUID());
    const existing = cart.find((item) => item.product.id === product.id);
    setCart(
      existing
        ? cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...cart, { product, quantity: 1 }],
    );
  }

  function updateQty(productId: number, delta: number) {
    const nextCart = cart
      .map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + delta }
          : item,
      )
      .filter((item) => item.quantity > 0);
    setCart(nextCart);
    if (nextCart.length === 0) setIdempotencyKey(null);
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (discountInvalid) {
      setError(discountError);
      return;
    }
    if (cashInsufficient) {
      setError(
        `Uang diterima kurang ${formatRupiah(totalAmount - cashReceived)}.`,
      );
      return;
    }
    setLoading(true);
    setError(null);

    // UUID dipertahankan bila hasil request tidak pasti. Retry akan mendapat
    // transaksi lama dari server alih-alih membuat penjualan dan stok kedua.
    const checkoutKey = idempotencyKey ?? crypto.randomUUID();
    if (idempotencyKey === null) setIdempotencyKey(checkoutKey);

    const fd = new FormData();
    fd.append("idempotencyKey", checkoutKey);
    fd.append("paymentMethod", payment);
    fd.append("discountAmount", String(discountAmount));
    fd.append("taxRate", String(taxRate));
    fd.append("cashReceived", payment === "cash" ? cashReceivedInput : "");
    fd.append("items", JSON.stringify(cart.map((c) => ({ productId: c.product.id, quantity: c.quantity }))));

    try {
      const result = await submitSale(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setLastReceipt({
        saleId: result.data.saleId,
        invoiceNumber: result.data.invoiceNumber,
        subtotalAmount: result.data.subtotalAmount,
        discountAmount: result.data.discountAmount,
        netAmount: result.data.netAmount,
        taxRate: result.data.taxRate,
        taxAmount: result.data.taxAmount,
        totalAmount: result.data.totalAmount,
        cashReceived: result.data.cashReceived,
        changeAmount: result.data.changeAmount,
      });
      setCart([]);
      setIdempotencyKey(null);
      setDiscountInput("0");
      setCashReceivedInput("");
    } catch {
      setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      {/* Left: Product Grid */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border-subtle)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.25rem" }}>☕</span>
            <span style={{ fontWeight: 800, fontSize: "1rem" }}>Merbaoe POS</span>
          </div>
          <div style={{ flex: 1, maxWidth: "280px" }}>
            <Field
              label="Cari menu"
              name="productSearch"
              id="cashier-product-search"
              control={<input className="input" placeholder="Nama menu..." value={search} onChange={(e) => setSearch(e.target.value)} />}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Kasir: <strong style={{ color: "var(--text-primary)" }}>{cashierName}</strong>
            </span>
            <Link href="/cashier/shift" className="btn btn-secondary btn-sm">
              Shift
            </Link>
            <LogoutButton
              id="btn-logout-cashier"
              className="btn btn-secondary btn-sm"
            />
          </div>
        </div>

        {/* Product Cards */}
        <div
          style={{
            flex: 1,
            padding: "1.25rem",
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "0.875rem",
            alignContent: "start",
          }}
        >
          {filteredProducts.length === 0 ? (
            <EmptyState
              title={products.length === 0 ? "Belum ada menu aktif" : "Menu tidak ditemukan"}
              description={products.length === 0 ? "Muat ulang setelah admin menambahkan dan mengaktifkan menu." : "Hapus pencarian untuk melihat seluruh menu yang tersedia."}
              action={
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => products.length === 0 ? window.location.reload() : setSearch("")}>
                  {products.length === 0 ? "Muat Ulang" : "Hapus Pencarian"}
                </button>
              }
            />
          ) : filteredProducts.map((product) => {
            const inCart = cart.find((c) => c.product.id === product.id);
            const check = canAfford(product, cart);
            const soldOut = !check.ok && !inCart;

            return (
              <button
                id={`product-${product.id}`}
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={soldOut}
                style={{
                  background: inCart ? "rgba(249,108,15,0.08)" : "var(--bg-card)",
                  border: `1.5px solid ${inCart ? "var(--brand-500)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "1.1rem 0.875rem",
                  cursor: soldOut ? "not-allowed" : "pointer",
                  opacity: soldOut ? 0.45 : 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.6rem",
                  textAlign: "center",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    borderRadius: "50%",
                    background: inCart ? "linear-gradient(135deg, var(--brand-500), var(--brand-700))" : "var(--bg-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                    boxShadow: inCart ? "0 4px 12px rgba(249,108,15,0.3)" : "none",
                  }}
                >
                  ☕
                </div>
                <p style={{ fontWeight: 700, fontSize: "0.82rem", lineHeight: 1.3, color: inCart ? "var(--brand-400)" : "var(--text-primary)" }}>
                  {product.name}
                </p>
                <p className="num" style={{ fontWeight: 800, fontSize: "0.9rem", color: inCart ? "var(--brand-400)" : "var(--text-primary)" }}>
                  {formatRupiah(Number(product.sellingPrice))}
                </p>
                {soldOut && (
                  <span className="badge badge-danger" style={{ position: "absolute", top: "0.4rem", right: "0.4rem", fontSize: "0.6rem" }}>Habis</span>
                )}
                {inCart && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0.4rem",
                      left: "0.4rem",
                      background: "var(--brand-500)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "1.3rem",
                      height: "1.3rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {inCart.quantity}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div
        style={{
          width: "340px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-surface)",
          overflow: "hidden",
        }}
      >
        {/* Cart Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>
            Keranjang {cart.length > 0 && <span className="badge badge-brand">{cart.length} item</span>}
          </h2>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem" }}>
          {cart.length === 0 ? (
            <EmptyState
              title="Keranjang masih kosong"
              description="Pilih menu dari daftar untuk memulai transaksi."
              icon="⌑"
              action={
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => document.getElementById("cashier-product-search")?.focus()}>
                  Cari Menu
                </button>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {cart.map((c) => (
                <div
                  key={c.product.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.7rem 0.875rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.product.name}</p>
                    <p className="num" style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{formatRupiah(Number(c.product.sellingPrice))} /pcs</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <button
                      id={`qty-minus-${c.product.id}`}
                      onClick={() => updateQty(c.product.id, -1)}
                      className="btn btn-sm btn-secondary"
                      style={{ width: "1.75rem", height: "1.75rem", padding: 0, fontSize: "1.1rem" }}
                    >−</button>
                    <span className="num" style={{ fontWeight: 700, fontSize: "0.9rem", minWidth: "1.5rem", textAlign: "center" }}>{c.quantity}</span>
                    <button
                      id={`qty-plus-${c.product.id}`}
                      onClick={() => updateQty(c.product.id, 1)}
                      className="btn btn-sm btn-secondary"
                      style={{ width: "1.75rem", height: "1.75rem", padding: 0, fontSize: "1.1rem" }}
                    >+</button>
                  </div>
                  <p className="num-right" style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--brand-400)", minWidth: "80px" }}>
                    {formatRupiah(Number(c.product.sellingPrice) * c.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Panel */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem", maxHeight: "72dvh", overflowY: "auto", flexShrink: 0 }}>
          {/* Error */}
          <Feedback tone="error" message={error} />

          {/* Success receipt */}
          {lastReceipt && (
            <Feedback tone="success" title="Transaksi berhasil">
              <p className="num" style={{ marginTop: "0.2rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                No. {lastReceipt.invoiceNumber}
              </p>
              <div className="num" style={{ marginTop: "0.35rem", color: "var(--text-secondary)", fontSize: "0.75rem", display: "grid", gap: "0.15rem" }}>
                <p>Subtotal: {formatRupiah(lastReceipt.subtotalAmount)}</p>
                <p>Diskon: −{formatRupiah(lastReceipt.discountAmount)}</p>
                <p>DPP: {formatRupiah(lastReceipt.netAmount)}</p>
                <p>Pajak ({Math.round(lastReceipt.taxRate * 100)}%): {formatRupiah(lastReceipt.taxAmount)}</p>
                <p style={{ fontWeight: 700, color: "var(--text-primary)" }}>Total: {formatRupiah(lastReceipt.totalAmount)}</p>
              </div>
              {lastReceipt.cashReceived !== null && (
                <>
                  <p className="num" style={{ marginTop: "0.2rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                    Diterima: {formatRupiah(lastReceipt.cashReceived)}
                  </p>
                  <p className="num" style={{ marginTop: "0.2rem", color: "var(--success)", fontSize: "0.8rem", fontWeight: 700 }}>
                    Kembalian: {formatRupiah(lastReceipt.changeAmount)}
                  </p>
                </>
              )}
              <Link
                href={`/cashier/receipt/${lastReceipt.saleId}`}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: "0.6rem" }}
              >
                Lihat &amp; Cetak Struk
              </Link>
            </Feedback>
          )}

          {/* Summary */}
          {cart.length > 0 && (
            <div className="num" style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.75rem", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>Subtotal</span><span>{formatRupiah(subtotalAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>Diskon</span><span>−{formatRupiah(discountAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>DPP</span><span>{formatRupiah(netAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>Pajak ({Math.round(taxRate * 100)}%)</span><span>{formatRupiah(taxAmount)}</span>
              </div>
              <div className="divider" style={{ margin: "0.25rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem" }}>
                <span>Total</span>
                <span style={{ color: "var(--brand-400)" }}>{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field
                label="Diskon (Rp)"
                name="discountPreview"
                id="cashier-discount"
                control={
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input num"
                    value={discountInput}
                    onChange={(event) => setDiscountInput(event.target.value)}
                  />
                }
              />
              <Field
                label="Pajak PB1"
                name="taxPreview"
                id="cashier-tax-rate"
                control={
                  <select
                    className="input"
                    value={taxRateInput}
                    onChange={(event) => setTaxRateInput(event.target.value)}
                  >
                    <option value="0">Tanpa pajak</option>
                    <option value="0.1">PB1 10%</option>
                  </select>
                }
              />
            </div>
          )}
          {discountInvalid && (
            <Feedback tone="error" message={discountError} compact />
          )}

          {/* Payment Method */}
          <div>
            <label className="label">Metode Pembayaran</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["cash", "qris", "transfer"] as const).map((m) => (
                <button
                  id={`payment-${m}`}
                  key={m}
                  type="button"
                  onClick={() => {
                    setPayment(m);
                    setError(null);
                  }}
                  className="btn btn-sm"
                  aria-pressed={payment === m}
                  style={{
                    flex: 1,
                    background: payment === m ? "rgba(249,108,15,0.12)" : "var(--bg-elevated)",
                    color: payment === m ? "var(--brand-400)" : "var(--text-secondary)",
                    border: `1px solid ${payment === m ? "rgba(249,108,15,0.3)" : "var(--border-default)"}`,
                    fontWeight: payment === m ? 700 : 500,
                  }}
                >
                  {m === "cash" ? "Tunai" : m === "qris" ? "QRIS" : "Transfer"}
                </button>
              ))}
            </div>
          </div>

          {payment === "cash" && cart.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Field
                label="Uang Diterima (Rp)"
                name="cashReceivedPreview"
                id="cashier-cash-received"
                control={
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    className="input num"
                    placeholder="Masukkan nominal tunai"
                    value={cashReceivedInput}
                    onChange={(event) => setCashReceivedInput(event.target.value)}
                  />
                }
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem" }}>
                <button type="button" className="btn btn-secondary btn-sm num" onClick={() => setCashReceivedInput(String(totalAmount))}>
                  Uang Pas
                </button>
                <button type="button" className="btn btn-secondary btn-sm num" onClick={() => setCashReceivedInput("50000")}>
                  Rp 50.000
                </button>
                <button type="button" className="btn btn-secondary btn-sm num" onClick={() => setCashReceivedInput("100000")}>
                  Rp 100.000
                </button>
              </div>
              <div className="num" style={{ display: "flex", justifyContent: "space-between", color: cashInsufficient ? "var(--danger)" : "var(--success)", fontSize: "0.82rem", fontWeight: 700 }}>
                <span>Kembalian</span>
                <span>{formatRupiah(changeAmount)}</span>
              </div>
            </div>
          )}

          {/* Checkout Button */}
          <button
            id="btn-checkout"
            onClick={handleCheckout}
            disabled={
              cart.length === 0 ||
              loading ||
              discountInvalid ||
              cashInsufficient
            }
            className="btn btn-success btn-lg num"
            aria-busy={loading}
            style={{ width: "100%" }}
          >
            <PendingButtonContent pending={loading} pendingLabel="Memproses pembayaran...">
              {`Bayar ${cart.length > 0 ? formatRupiah(totalAmount) : ""}`}
            </PendingButtonContent>
          </button>

          {cart.length > 0 && (
            <button id="btn-clear-cart" onClick={() => { setCart([]); setIdempotencyKey(null); setDiscountInput("0"); setCashReceivedInput(""); }} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
              Kosongkan Keranjang
            </button>
          )}
        </div>
      </div>
    </>
  );
}
