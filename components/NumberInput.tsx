"use client";

import { useEffect, useState } from "react";

/**
 * Numeric text input that you can fully clear and retype. The previous
 * `<input type="number" value={n} onChange={Math.max(min, Number(v))}>` pattern
 * clamped on every keystroke, so clearing the field snapped it to `min` (e.g. 1)
 * and the leading digit could never be changed. This keeps a local editing
 * string and only commits the clamped number, fixing that bug.
 */
export function NumberInput({
  value,
  min = 0,
  max,
  step,
  disabled,
  onCommit,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onCommit: (v: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(String(value));

  // Re-sync when the external value changes (e.g. a preset button or slider).
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (n: number) => {
    let v = Math.max(min, n);
    if (max != null) v = Math.min(max, v);
    return v;
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      step={step}
      disabled={disabled}
      className={className}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d]/g, "");
        setText(t);
        if (t !== "") onCommit(clamp(Number(t)));
      }}
      onBlur={() => {
        if (text === "") {
          setText(String(min));
          onCommit(min);
        } else {
          const v = clamp(Number(text));
          setText(String(v));
          onCommit(v);
        }
      }}
    />
  );
}
