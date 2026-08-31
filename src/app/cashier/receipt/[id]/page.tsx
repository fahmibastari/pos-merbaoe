import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getActiveSession } from "@/lib/guard";
import { formatRupiah, formatRupiahPlain } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { PrintReceiptButton } from "./PrintReceiptButton";
import styles from "./receipt.module.css";

export const metadata: Metadata = { title: "Struk Transaksi" };

type ReceiptPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const wibDateTime = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  dateStyle: "medium",
  timeStyle: "medium",
});

const paymentLabels = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
} as const;

export default async function ReceiptPage({
  params,
  searchParams,
}: ReceiptPageProps) {
  const session = await getActiveSession();
  if (!session) redirect("/login");

  const [{ id: rawId }, query] = await Promise.all([params, searchParams]);
  const saleId = Number(rawId);
  if (!Number.isSafeInteger(saleId) || saleId <= 0) notFound();

  const paperValue = Array.isArray(query.paper) ? query.paper[0] : query.paper;
  const paper = paperValue === "58" ? "58" : "80";
  const sale = await prisma.sale.findFirst({
    where: {
      id: saleId,
      ...(session.role === "kasir" ? { cashierId: session.userId } : {}),
    },
    include: {
      cashier: { select: { name: true } },
      details: { orderBy: { id: "asc" } },
    },
  });
  if (!sale) notFound();

  const storeAddress =
    process.env.STORE_ADDRESS?.trim() || "Alamat kafe belum dikonfigurasi";
  const paperClass = paper === "58" ? styles.paper58 : styles.paper80;

  return (
    <main className={styles.page}>
      <nav className={styles.controls} aria-label="Kontrol struk">
        <Link href="/cashier" className="btn btn-secondary">
          Kembali ke Kasir
        </Link>
        <div className={styles.paperSelector} aria-label="Lebar kertas">
          {(["58", "80"] as const).map((width) => (
            <Link
              key={width}
              href={`/cashier/receipt/${sale.id}?paper=${width}`}
              className={`${styles.paperLink} ${paper === width ? styles.paperLinkActive : ""}`}
              aria-current={paper === width ? "page" : undefined}
            >
              {width} mm
            </Link>
          ))}
        </div>
        <PrintReceiptButton />
      </nav>

      <article
        className={`${styles.receipt} ${paperClass}`}
        aria-label={`Struk ${sale.invoiceNumber}`}
      >
        <header className={styles.header}>
          <Image
            src="/Logo-IconOnly.png"
            alt="Kopi Merbaoe"
            width={1355}
            height={601}
            className={styles.receiptLogo}
          />
          <p className={styles.address}>{storeAddress}</p>
        </header>

        <hr className={styles.separator} />
        <dl className={styles.meta}>
          <dt>Invoice</dt><dd className={styles.invoice}>{sale.invoiceNumber}</dd>
          <dt>Waktu (WIB)</dt><dd>{wibDateTime.format(sale.transactionDate)}</dd>
          <dt>Kasir</dt><dd>{sale.cashier.name}</dd>
          <dt>Pembayaran</dt><dd>{paymentLabels[sale.paymentMethod]}</dd>
        </dl>
        <hr className={styles.separator} />

        <table className={styles.items}>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Harga</th><th>Jumlah</th></tr>
          </thead>
          <tbody>
            {sale.details.map((detail) => (
              <tr key={detail.id}>
                <td className={styles.productName}>{detail.productName}</td>
                <td>{detail.quantity}</td>
                <td>{formatRupiahPlain(detail.sellingPrice)}</td>
                <td>{formatRupiahPlain(detail.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className={styles.separator} />
        <dl className={styles.totals}>
          <dt>Subtotal</dt><dd>{formatRupiah(sale.subtotalAmount)}</dd>
          <dt>Diskon</dt><dd>-{formatRupiah(sale.discountAmount)}</dd>
          <dt>DPP</dt><dd>{formatRupiah(sale.netAmount)}</dd>
          <dt>Pajak ({Math.round(Number(sale.taxRate) * 100)}%)</dt>
          <dd>{formatRupiah(sale.taxAmount)}</dd>
          <dt className={styles.totalRow}>TOTAL</dt>
          <dd className={styles.totalRow}>{formatRupiah(sale.totalAmount)}</dd>
          {sale.paymentMethod === "cash" && (
            <>
              <dt>Diterima</dt><dd>{formatRupiah(sale.cashReceived)}</dd>
              <dt>Kembalian</dt><dd>{formatRupiah(sale.changeAmount)}</dd>
            </>
          )}
        </dl>

        {sale.status === "voided" && (
          <><hr className={styles.separator} /><p className={styles.voided}>TRANSAKSI DIBATALKAN</p></>
        )}
        <footer className={styles.footer}>
          <p>Terima kasih</p>
          <p>Simpan struk ini sebagai bukti transaksi</p>
        </footer>
      </article>
    </main>
  );
}
