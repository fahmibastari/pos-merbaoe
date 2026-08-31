"use client";

import { Icon } from "@/components/Icon";

export function PrintButton() {
  return (
    <button className="btn btn-secondary" type="button" onClick={() => window.print()}>
      <Icon name="print" />
      Cetak / Simpan PDF
    </button>
  );
}
