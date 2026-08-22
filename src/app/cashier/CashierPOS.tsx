"use client";

import { useState } from "react";
import { logoutAction } from "@/app/login/actions";
import { submitSale } from "./actions";

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

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

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
  const [payment, setPayment] = useState<"cash" | "qris" | "transfer">("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<{ invoiceId: string; total: number } | null>(null);
  const [search, setSearch] = useState("");

  const total = cart.reduce((sum, c) => sum + Number(c.product.sellingPrice) * c.quantity, 0);
  const totalHpp = cart.reduce((sum, c) => sum + Number(c.product.baseHpp) * c.quantity, 0);
  const grossProfit = total - totalHpp;

  function addToCart(product: Product) {
    const check = canAfford(product, cart);
    if (!check.ok) {
      setError(check.reason!);
      return;
    }
    setError(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c)
        .filter((c) => c.quantity > 0)
    );
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("paymentMethod", payment);
    fd.append("items", JSON.stringify(cart.map((c) => ({ productId: c.product.id, quantity: c.quantity }))));

    const result = await submitSale(fd);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setLastReceipt({ invoiceId: `TRX-${Date.now()}`, total });
      setCart([]);
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
          <div style={{ flex: 1 }}>
            <input
              className="input"
              placeholder="Cari menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: "280px" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Kasir: <strong style={{ color: "var(--text-primary)" }}>{cashierName}</strong>
            </span>
            <form action={logoutAction}>
              <button id="btn-logout-cashier" type="submit" className="btn btn-secondary btn-sm">Keluar</button>
            </form>
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
          {filteredProducts.map((product) => {
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
                <p style={{ fontWeight: 800, fontSize: "0.9rem", color: inCart ? "var(--brand-400)" : "var(--text-primary)" }}>
                  {formatRp(Number(product.sellingPrice))}
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "0.75rem", color: "var(--text-muted)" }}>
              <span style={{ fontSize: "2.5rem" }}>🛒</span>
              <p style={{ fontSize: "0.85rem" }}>Pilih menu dari kiri</p>
            </div>
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
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{formatRp(Number(c.product.sellingPrice))} /pcs</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <button
                      id={`qty-minus-${c.product.id}`}
                      onClick={() => updateQty(c.product.id, -1)}
                      className="btn btn-sm btn-secondary"
                      style={{ width: "1.75rem", height: "1.75rem", padding: 0, fontSize: "1.1rem" }}
                    >−</button>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", minWidth: "1.5rem", textAlign: "center" }}>{c.quantity}</span>
                    <button
                      id={`qty-plus-${c.product.id}`}
                      onClick={() => updateQty(c.product.id, 1)}
                      className="btn btn-sm btn-secondary"
                      style={{ width: "1.75rem", height: "1.75rem", padding: 0, fontSize: "1.1rem" }}
                    >+</button>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--brand-400)", minWidth: "80px", textAlign: "right" }}>
                    {formatRp(Number(c.product.sellingPrice) * c.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Panel */}
        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {/* Error */}
          {error && (
            <div style={{ padding: "0.65rem 0.875rem", borderRadius: "var(--radius-md)", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: "0.78rem", fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}

          {/* Success receipt */}
          {lastReceipt && (
            <div style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "var(--success)", fontSize: "0.8rem" }}>
              <p style={{ fontWeight: 700 }}>✓ Transaksi Berhasil!</p>
              <p style={{ marginTop: "0.2rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>Total: {formatRp(lastReceipt.total)}</p>
            </div>
          )}

          {/* Summary */}
          {cart.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", padding: "0.75rem", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>Subtotal</span><span>{formatRp(total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <span>Est. HPP</span><span>−{formatRp(totalHpp)}</span>
              </div>
              <div className="divider" style={{ margin: "0.25rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem" }}>
                <span>Total</span>
                <span style={{ color: "var(--brand-400)" }}>{formatRp(total)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Est. Laba Kotor</span>
                <span style={{ color: "var(--success)", fontWeight: 600 }}>{formatRp(grossProfit)}</span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="label">Metode Pembayaran</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["cash", "qris", "transfer"] as const).map((m) => (
                <button
                  id={`payment-${m}`}
                  key={m}
                  onClick={() => setPayment(m)}
                  className="btn btn-sm"
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

          {/* Checkout Button */}
          <button
            id="btn-checkout"
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="btn btn-success btn-lg"
            style={{ width: "100%" }}
          >
            {loading ? (
              <>
                <span style={{ width: "1rem", height: "1rem", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Memproses...
              </>
            ) : (
              `Bayar ${cart.length > 0 ? formatRp(total) : ""}`
            )}
          </button>

          {cart.length > 0 && (
            <button id="btn-clear-cart" onClick={() => setCart([])} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
              Kosongkan Keranjang
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
