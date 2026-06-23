"use client";

import type { SpriteSheetCrop } from "@/lib/assetMap";

export function SpriteSheetImage({
  crop,
  className = "",
}: {
  crop: SpriteSheetCrop;
  className?: string;
}) {
  const x = crop.cols <= 1 ? 0 : (crop.col / (crop.cols - 1)) * 100;
  const y = crop.rows <= 1 ? 0 : (crop.row / (crop.rows - 1)) * 100;

  return (
    <div
      aria-label={crop.alt}
      className={`overflow-hidden bg-transparent ${className}`}
      role="img"
      style={{
        backgroundImage: `url(${crop.src})`,
        backgroundPosition: `${x}% ${y}%`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${crop.cols * 100}% ${crop.rows * 100}%`,
      }}
    />
  );
}
