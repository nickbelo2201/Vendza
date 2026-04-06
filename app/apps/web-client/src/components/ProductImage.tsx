"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
}

export function ProductImage({ src, fallbackSrc, alt }: ProductImageProps) {
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
    return (
      <ImageOff
        size={40}
        strokeWidth={1}
        style={{ color: "var(--color-text-muted)" }}
      />
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
