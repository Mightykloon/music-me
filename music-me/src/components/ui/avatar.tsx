"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Metro people tiles are square; "circle" is kept for the odd exception */
  shape?: "circle" | "rounded";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
  "2xl": "w-32 h-32",
};

const pxMap = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
  "2xl": 128,
};

export function Avatar({
  src,
  alt,
  size = "md",
  shape = "rounded",
  className,
}: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        sizeMap[size],
        "relative overflow-hidden flex-shrink-0",
        shape === "circle" ? "rounded-full" : "",
        className
      )}
    >
      {src ? (
        src.startsWith("data:") ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt={alt} className="object-cover w-full h-full" />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={pxMap[size]}
            height={pxMap[size]}
            className="object-cover w-full h-full"
          />
        )
      ) : (
        <div className="w-full h-full bg-primary flex items-center justify-center text-white font-light text-sm lowercase">
          {initials}
        </div>
      )}
    </div>
  );
}
