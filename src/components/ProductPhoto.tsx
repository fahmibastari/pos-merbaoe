"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./ProductPhoto.module.css";

export function ProductPhoto({
  name,
  src,
  sizes,
  className = "",
  compact = false,
  loading = "lazy",
}: {
  name: string;
  src: string | null;
  sizes: string;
  className?: string;
  compact?: boolean;
  loading?: "eager" | "lazy";
}) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "M";

  return (
    <div className={`${styles.frame} ${compact ? styles.compact : ""} ${className}`.trim()}>
      {src && !failed ? (
        <Image
          src={src}
          alt={`Foto ${name}`}
          fill
          sizes={sizes}
          loading={loading}
          className={styles.image}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.fallback} aria-label={`${name}, foto belum tersedia`}>
          <span aria-hidden="true" className={styles.initial}>{initial}</span>
          <span className={styles.note}>Foto belum tersedia</span>
        </div>
      )}
    </div>
  );
}
