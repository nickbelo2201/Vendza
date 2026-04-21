"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { CATEGORIES } from "../data/categories";

interface ProductImageProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  categorySlug?: string;
}

function transformSupabaseImageUrl(url: string, width: number = 400, quality: number = 80): string {
  if (!url) return url;

  // Se já é uma URL de render/image, não transformar novamente
  if (url.includes("/storage/v1/render/image/")) {
    return url;
  }

  // Converter URL de /storage/v1/object/public/ para /storage/v1/render/image/public/
  if (url.includes("/storage/v1/object/public/")) {
    const transformed = url.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    return `${transformed}?width=${width}&quality=${quality}`;
  }

  return url;
}

export function ProductImage({
  src,
  fallbackSrc,
  alt,
  categorySlug,
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null | undefined>(
    src ? transformSupabaseImageUrl(src) : src
  );
  const [triedFallback, setTriedFallback] = useState(false);

  const handleError = () => {
    if (!triedFallback && fallbackSrc) {
      const transformedFallback = transformSupabaseImageUrl(fallbackSrc);
      setImgSrc(transformedFallback);
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
    <div style={{ position: "relative", width: "100%", height: 140 }}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        onError={handleError}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}
