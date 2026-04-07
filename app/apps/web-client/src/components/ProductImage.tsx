"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { CATEGORIES } from "../data/categories";

interface ProductImageProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  categorySlug?: string;
}

export function ProductImage({
  src,
  fallbackSrc,
  alt,
  categorySlug,
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null | undefined>(src);
  const [triedFallback, setTriedFallback] = useState(false);

  const handleError = () => {
    if (!triedFallback && fallbackSrc) {
      setImgSrc(fallbackSrc);
      setTriedFallback(true);
    } else {
      setImgSrc(null);
    }
  };

  if (!imgSrc) {
    const cat = CATEGORIES.find((c) => c.id === categorySlug);
    if (cat?.emoji) {
      return (
        <div
          style={{
            width: "100%",
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
            opacity: 0.55,
            userSelect: "none",
          }}
        >
          {cat.emoji}
        </div>
      );
    }
    return (
      <div
        style={{
          width: "100%",
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted)",
          opacity: 0.45,
        }}
      >
        <ImageOff size={44} strokeWidth={1.25} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      style={{
        maxHeight: 140,
        maxWidth: "100%",
        objectFit: "contain",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
}
