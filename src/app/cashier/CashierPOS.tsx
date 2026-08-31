"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "@/app/login/LogoutButton";
import { submitSale } from "./actions";
import { formatQuantity, formatRupiah, toNumber } from "@/lib/money";
import type { CashierProductDTO } from "@/lib/dto";
import { EmptyState } from "@/components/EmptyState";
import { PendingButtonContent } from "@/components/PendingButtonContent";
import { Feedback } from "@/components/Feedback";
import CashierNav from "./CashierNav";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { ProductPhoto } from "@/components/ProductPhoto";
import styles from "./CashierPOS.module.css";
import { filterCatalogProducts } from "@/lib/product-category";
import {
  nextEnabledProductIndex,
  resolveCashierShortcut,
  type ProductNavigationKey,
} from "@/lib/cashier-keyboard";
import {
  cashierCartStorageKey,
  cashierCartStoragePrefix,
  restoreCashierCart,
  serializeCashierCart,
} from "@/lib/cashier-cart";

type CartItem = {
  product: CashierProductDTO;
  quantity: number;
};

function canAfford(product: CashierProductDTO, cart: CartItem[]): { ok: boolean; reason?: string } {
  if (!product.hasRecipe || product.recipes.length === 0) return { ok: true };

  for (const recipe of product.recipes) {
    const ing = recipe.ingredient;
    const needed = toNumber(recipe.quantityNeeded);
    const alreadyInCart = cart
      .filter((c) => c.product.recipes.some((r) => r.ingredient.id === ing.id))
      .reduce((sum, c) => {
        const r = c.product.recipes.find((r) => r.ingredient.id === ing.id);
        return sum + (r ? toNumber(r.quantityNeeded) * c.quantity : 0);
      }, 0);
    const available = toNumber(ing.currentStock) - alreadyInCart;
    if (available < needed) {
      return {
        ok: false,
        reason: `Stok ${ing.name} tidak cukup. Dibutuhkan ${formatQuantity(needed)} ${ing.unit}, tersedia ${formatQuantity(Math.max(0, available))} ${ing.unit}.`,
      };
    }
  }
  return { ok: true };
}

export default function CashierPOS({
  products,
  categories,
  cashierId,
  shiftId,
  cashierName,
  role,
}: {
  products: CashierProductDTO[];
  categories: { id: number; name: string }[];
  cashierId: number;
  shiftId: number;
  cashierName: string;
  role: "admin" | "kasir";
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
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [keyboardAnnouncement, setKeyboardAnnouncement] = useState("");
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [cartPersistenceReady, setCartPersistenceReady] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashReceivedInputRef = useRef<HTMLInputElement>(null);
  const checkoutButtonRef = useRef<HTMLButtonElement>(null);
  const productRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const cartStorageKey = cashierCartStorageKey(cashierId, shiftId);

  const subtotalAmount = cart.reduce(
    (sum, item) =>
      sum + Math.round(toNumber(item.product.sellingPrice) * item.quantity),
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

  function addToCart(product: CashierProductDTO): boolean {
    const check = canAfford(product, cart);
    if (!check.ok) {
      setError(check.reason!);
      return false;
    }
    setError(null);
    setCartNotice(null);
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
    setKeyboardAnnouncement(
      `${product.name} ditambahkan. Jumlah ${existing ? existing.quantity + 1 : 1}.`,
    );
    return true;
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
    setCartNotice(null);
    if (nextCart.length === 0) setIdempotencyKey(null);
  }

  function clearPersistedCart() {
    try {
      window.sessionStorage.removeItem(cartStorageKey);
    } catch {
      // Penyimpanan browser boleh gagal; transaksi tetap harus dapat berjalan.
    }
  }

  function clearCart() {
    setCart([]);
    setIdempotencyKey(null);
    setDiscountInput("0");
    setCashReceivedInput("");
    setCartNotice(null);
    clearPersistedCart();
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
      setCartNotice(null);
      clearPersistedCart();
      setKeyboardAnnouncement(`Transaksi ${result.data.invoiceNumber} berhasil.`);
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    } catch {
      setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = useMemo(
    () => filterCatalogProducts(products, search, activeCategoryId),
    [products, search, activeCategoryId],
  );
  const hasCatalogFilter = search.trim() !== "" || activeCategoryId !== null;
  const disabledProductIndexes = filteredProducts.flatMap((product, index) => {
    const inCart = cart.some((item) => item.product.id === product.id);
    return !canAfford(product, cart).ok && !inCart ? [index] : [];
  });
  const rovingProductIndex =
    activeProductIndex < filteredProducts.length &&
    !disabledProductIndexes.includes(activeProductIndex)
      ? activeProductIndex
      : nextEnabledProductIndex({
          currentIndex: -1,
          itemCount: filteredProducts.length,
          key: "Home",
          disabledIndexes: disabledProductIndexes,
        });

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    try {
      const storage = window.sessionStorage;
      const storagePrefix = cashierCartStoragePrefix(cashierId);
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key?.startsWith(storagePrefix) && key !== cartStorageKey) {
          storage.removeItem(key);
        }
      }

      const restored = restoreCashierCart(
        storage.getItem(cartStorageKey),
        products,
      );
      if (restored.status === "restored") {
        setCart(restored.items);
        setIdempotencyKey(crypto.randomUUID());
        const totalQuantity = restored.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        const message =
          restored.discardedQuantity > 0
            ? `Keranjang dipulihkan: ${totalQuantity} porsi. ${restored.discardedQuantity} porsi tidak dimuat karena menu atau stok berubah.`
            : `Keranjang sebelumnya dipulihkan: ${totalQuantity} porsi.`;
        setCartNotice(message);
      } else if (restored.status === "expired") {
        storage.removeItem(cartStorageKey);
        setCartNotice("Keranjang lama sudah melewati 8 jam dan dikosongkan.");
      } else if (restored.status === "invalid") {
        storage.removeItem(cartStorageKey);
      }
    } finally {
      setCartPersistenceReady(true);
    }
  }, [cartStorageKey, cashierId, products]);

  useEffect(() => {
    if (!cartPersistenceReady) return;
    try {
      if (cart.length === 0) {
        window.sessionStorage.removeItem(cartStorageKey);
      } else {
        window.sessionStorage.setItem(
          cartStorageKey,
          serializeCashierCart(cart),
        );
      }
    } catch {
      // Kuota atau kebijakan browser tidak boleh memblokir operasi kasir.
    }
  }, [cart, cartPersistenceReady, cartStorageKey]);

  useEffect(() => {
    function handleGlobalShortcut(event: globalThis.KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const shortcut = resolveCashierShortcut({
        key: event.key,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        targetTagName: target?.tagName,
        isContentEditable: target?.isContentEditable,
      });

      if (shortcut === "search") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      if (shortcut === "payment") {
        event.preventDefault();
        if (cart.length === 0) {
          setKeyboardAnnouncement("Keranjang masih kosong. Pilih menu terlebih dahulu.");
          searchInputRef.current?.focus();
        } else if (payment === "cash") {
          cashReceivedInputRef.current?.focus();
          cashReceivedInputRef.current?.select();
        } else {
          checkoutButtonRef.current?.focus();
        }
      }
    }

    window.addEventListener("keydown", handleGlobalShortcut);
    return () => window.removeEventListener("keydown", handleGlobalShortcut);
  }, [cart.length, payment]);

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    const firstProduct = filteredProducts[0];
    if (!firstProduct || search.trim() === "") return;

    event.preventDefault();
    if (addToCart(firstProduct)) setSearch("");
  }

  function handleProductKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const navigationKeys: ProductNavigationKey[] = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (!navigationKeys.includes(event.key as ProductNavigationKey)) return;

    event.preventDefault();
    const nextIndex = nextEnabledProductIndex({
      currentIndex: index,
      itemCount: filteredProducts.length,
      key: event.key as ProductNavigationKey,
      disabledIndexes: disabledProductIndexes,
    });
    if (nextIndex === null) return;

    setActiveProductIndex(nextIndex);
    productRefs.current[nextIndex]?.focus();
  }

  function handleCashReceivedKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || loading) return;
    event.preventDefault();
    void handleCheckout();
  }

  return (
    <div className={styles.pos}>
      {/* Left: Product Grid */}
      <div className={styles.catalog}>
        {/* Header */}
        <div className={styles.header}>
          <Image
            src="/Logo-Vertikal.png"
            alt="Kopi Merbaoe"
            width={950}
            height={516}
            loading="eager"
            className={styles.brandImage}
          />
          <div className={styles.searchArea}>
            <Field
              label="Cari menu"
              name="productSearch"
              id="cashier-product-search"
              control={
                <input
                  ref={searchInputRef}
                  className="input"
                  placeholder="Nama menu..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  aria-keyshortcuts="/ Enter"
                />
              }
            />
            <p className={styles.keyboardHints} aria-label="Shortcut keyboard kasir">
              <span><kbd>/</kbd> cari</span>
              <span><kbd>Enter</kbd> tambah hasil</span>
              <span><kbd>F2</kbd> pembayaran</span>
              <span><kbd>← →</kbd> pilih menu</span>
            </p>
          </div>
          <div className={styles.operator}>
            <span className={styles.operatorName}>
              Kasir: <strong>{cashierName}</strong>
            </span>
            <CashierNav current="pos" role={role} />
            <LogoutButton
              id="btn-logout-cashier"
              className="btn btn-secondary btn-sm"
            />
          </div>
        </div>

        <nav className={styles.categoryFilters} aria-label="Filter kategori menu">
          <button
            type="button"
            className={`${styles.categoryFilter} ${activeCategoryId === null ? styles.categoryFilterActive : ""}`.trim()}
            aria-pressed={activeCategoryId === null}
            onClick={() => setActiveCategoryId(null)}
          >
            Semua
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              className={`${styles.categoryFilter} ${activeCategoryId === category.id ? styles.categoryFilterActive : ""}`.trim()}
              aria-pressed={activeCategoryId === category.id}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </nav>

        {/* Product Cards */}
        <div
          className={styles.productGrid}
          role="group"
          aria-label="Daftar menu. Gunakan tombol panah untuk berpindah antar-menu."
        >
          {filteredProducts.length === 0 ? (
            <EmptyState
              title={products.length === 0 ? "Belum ada menu aktif" : "Menu tidak ditemukan"}
              description={products.length === 0 ? "Muat ulang setelah admin menambahkan dan mengaktifkan menu." : "Ubah kata pencarian atau kategori untuk melihat menu lain."}
              action={
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                  if (products.length === 0) window.location.reload();
                  else {
                    setSearch("");
                    setActiveCategoryId(null);
                  }
                }}>
                  {products.length === 0 ? "Muat Ulang" : hasCatalogFilter ? "Lihat Semua Menu" : "Muat Ulang"}
                </button>
              }
            />
          ) : filteredProducts.map((product, index) => {
            const inCart = cart.find((c) => c.product.id === product.id);
            const check = canAfford(product, cart);
            const soldOut = !check.ok && !inCart;

            return (
              <button
                id={`product-${product.id}`}
                key={product.id}
                ref={(element) => { productRefs.current[index] = element; }}
                onClick={() => addToCart(product)}
                onFocus={() => setActiveProductIndex(index)}
                onKeyDown={(event) => handleProductKeyDown(event, index)}
                disabled={soldOut}
                tabIndex={index === rovingProductIndex ? 0 : -1}
                className={`${styles.product} ${inCart ? styles.productSelected : ""}`.trim()}
              >
                <ProductPhoto
                  name={product.name}
                  src={product.imageUrl}
                  sizes="(max-width: 600px) 45vw, (max-width: 1000px) 30vw, 13rem"
                  loading={index < 5 ? "eager" : "lazy"}
                  className={styles.productPhoto}
                />
                <span className={styles.productBody}>
                  <span className={styles.productName}>{product.name}</span>
                  <span className={`num ${styles.productPrice}`}>
                    {formatRupiah(product.sellingPrice)}
                  </span>
                </span>
                {soldOut && (
                  <span className={`badge badge-danger ${styles.productStatus}`}>Habis</span>
                )}
                {inCart && (
                  <span className={styles.productCount} aria-label={`${inCart.quantity} di keranjang`}>
                    {inCart.quantity}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className={styles.cart}>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {keyboardAnnouncement}
        </p>
        {/* Cart Header */}
        <div className={styles.cartHeader}>
          <h2>
            Keranjang {cart.length > 0 && <span className="badge badge-brand">{cart.length} item</span>}
          </h2>
        </div>

        {/* Cart Items */}
        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <EmptyState
              title="Keranjang masih kosong"
              description="Pilih menu dari daftar untuk memulai transaksi."
              icon={<Icon name="cart" size={22} />}
              action={
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => document.getElementById("cashier-product-search")?.focus()}>
                  Cari Menu
                </button>
              }
            />
          ) : (
            <div className={styles.cartList}>
              {cart.map((c) => (
                <div key={c.product.id} className={styles.cartRow}>
                  <div className={styles.cartProduct}>
                    <p className={styles.cartProductName}>{c.product.name}</p>
                    <p className={`num ${styles.cartUnitPrice}`}>{formatRupiah(c.product.sellingPrice)} /pcs</p>
                  </div>
                  <div className={styles.cartControls}>
                    <button
                      id={`qty-minus-${c.product.id}`}
                      type="button"
                      onClick={() => updateQty(c.product.id, -1)}
                      className={`btn btn-sm btn-secondary ${styles.quantityButton}`}
                      aria-label={`Kurangi ${c.product.name}`}
                    ><Icon name="minus" /></button>
                    <span className={`num ${styles.quantity}`}>{c.quantity}</span>
                    <button
                      id={`qty-plus-${c.product.id}`}
                      type="button"
                      onClick={() => updateQty(c.product.id, 1)}
                      className={`btn btn-sm btn-secondary ${styles.quantityButton}`}
                      aria-label={`Tambah ${c.product.name}`}
                    ><Icon name="plus" /></button>
                  </div>
                  <p className={`num-right ${styles.cartLineTotal}`}>
                    {formatRupiah(toNumber(c.product.sellingPrice) * c.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Panel */}
        <div className={styles.checkout}>
          {/* Error */}
          <Feedback tone="info" message={cartNotice} />
          <Feedback tone="error" message={error} />

          {/* Success receipt */}
          {lastReceipt && (
            <Feedback tone="success" title="Transaksi berhasil">
              <p className={`num ${styles.receiptMeta}`}>
                No. {lastReceipt.invoiceNumber}
              </p>
              <div className={`num ${styles.receiptBreakdown}`}>
                <p>Subtotal: {formatRupiah(lastReceipt.subtotalAmount)}</p>
                <p>Diskon: −{formatRupiah(lastReceipt.discountAmount)}</p>
                <p>DPP: {formatRupiah(lastReceipt.netAmount)}</p>
                <p>Pajak ({Math.round(lastReceipt.taxRate * 100)}%): {formatRupiah(lastReceipt.taxAmount)}</p>
                <p className={styles.receiptTotal}>Total: {formatRupiah(lastReceipt.totalAmount)}</p>
              </div>
              {lastReceipt.cashReceived !== null && (
                <>
                  <p className={`num ${styles.receiptMeta}`}>
                    Diterima: {formatRupiah(lastReceipt.cashReceived)}
                  </p>
                  <p className={`num ${styles.receiptMeta} ${styles.receiptChange}`}>
                    Kembalian: {formatRupiah(lastReceipt.changeAmount)}
                  </p>
                </>
              )}
              <Link
                href={`/cashier/receipt/${lastReceipt.saleId}`}
                className={`btn btn-secondary btn-sm ${styles.receiptLink}`}
              >
                Lihat &amp; Cetak Struk
              </Link>
            </Feedback>
          )}

          {/* Summary */}
          {cart.length > 0 && (
            <div className={`num ${styles.summary}`}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span><span>{formatRupiah(subtotalAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Diskon</span><span>−{formatRupiah(discountAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>DPP</span><span>{formatRupiah(netAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Pajak ({Math.round(taxRate * 100)}%)</span><span>{formatRupiah(taxAmount)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total</span>
                <span>{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div className={styles.twoFields}>
              <Field
                label="Diskon (Rp)"
                name="discountPreview"
                id="cashier-discount"
                errorMessage={discountInvalid ? discountError : null}
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
          {/* Payment Method */}
          {cart.length > 0 && (
            <fieldset className={styles.fieldset}>
              <legend className="label">Metode Pembayaran</legend>
              <div className={styles.paymentMethods}>
                {(["cash", "qris", "transfer"] as const).map((m) => (
                  <button
                    id={`payment-${m}`}
                    key={m}
                    type="button"
                    onClick={() => {
                      setPayment(m);
                      setError(null);
                    }}
                    className={`btn btn-sm btn-secondary ${styles.paymentButton} ${payment === m ? styles.paymentActive : ""}`.trim()}
                    aria-pressed={payment === m}
                  >
                    {m === "cash" ? "Tunai" : m === "qris" ? "QRIS" : "Transfer"}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {payment === "cash" && cart.length > 0 && (
            <div className={styles.cashFields}>
              <Field
                label="Uang Diterima (Rp)"
                name="cashReceivedPreview"
                id="cashier-cash-received"
                errorMessage={
                  cashReceivedInput !== "" && cashInsufficient
                    ? `Uang diterima kurang ${formatRupiah(totalAmount - cashReceived)}.`
                    : null
                }
                control={
                  <input
                    ref={cashReceivedInputRef}
                    type="number"
                    min="0"
                    step="1"
                    required
                    className="input num"
                    placeholder="Masukkan nominal tunai"
                    value={cashReceivedInput}
                    onChange={(event) => setCashReceivedInput(event.target.value)}
                    onKeyDown={handleCashReceivedKeyDown}
                    aria-keyshortcuts="F2 Enter"
                  />
                }
              />
              <div className={styles.cashShortcuts}>
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
              <div className={`num ${styles.change} ${cashInsufficient ? styles.changeInsufficient : styles.changeEnough}`}>
                <span>Kembalian</span>
                <span>{formatRupiah(changeAmount)}</span>
              </div>
            </div>
          )}

          {/* Checkout Button */}
          {cart.length > 0 && (
            <button
              ref={checkoutButtonRef}
              id="btn-checkout"
              onClick={handleCheckout}
              disabled={loading || discountInvalid || cashInsufficient}
              className={`btn btn-primary btn-lg num ${styles.fullWidth}`}
              aria-busy={loading}
              aria-keyshortcuts="F2 Enter"
            >
              <PendingButtonContent pending={loading} pendingLabel="Memproses pembayaran...">
                {`Bayar ${formatRupiah(totalAmount)}`}
              </PendingButtonContent>
            </button>
          )}

          {cart.length > 0 && (
            <button id="btn-clear-cart" onClick={clearCart} className={`btn btn-secondary btn-sm ${styles.fullWidth}`}>
              Kosongkan Keranjang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
