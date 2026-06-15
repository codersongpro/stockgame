"use client";

interface Props {
  color: string;
  mark?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE = {
  xs: "h-5 w-5 text-[10px] rounded",
  sm: "h-7 w-7 text-sm rounded-md",
  md: "h-8 w-8 text-base rounded-lg",
  lg: "h-10 w-10 text-lg rounded-xl",
} as const;

export function CompanyMark({ color, mark, name, size = "md", className = "" }: Props) {
  const fallback = name ? name.slice(0, 1) : "?";
  return (
    <div
      className={`${SIZE[size]} flex shrink-0 items-center justify-center font-bold leading-none select-none ${className}`}
      style={{ background: color, color: "#fff" }}
      title={name}
    >
      {mark ?? fallback}
    </div>
  );
}
