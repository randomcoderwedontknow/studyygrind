import { useEffect, useState } from "react";
import { clampInteger, clampNumeric, isAllowedNumericDraft, parseDraftNumber } from "../../lib/numeric-input";

type Props = {
  id?: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  fallback: number;
  className?: string;
  "aria-label"?: string;
  inputMode?: "numeric" | "decimal";
  allowDecimal?: boolean;
  style?: React.CSSProperties;
};

export function NumericInput({
  id,
  value,
  onChange,
  min,
  max,
  fallback,
  className,
  "aria-label": ariaLabel,
  inputMode = "numeric",
  allowDecimal = false,
  style,
}: Props) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const parsed = parseDraftNumber(raw);
    const clamped = allowDecimal
      ? clampNumeric(parsed, min, max, fallback)
      : clampInteger(parsed, min, max, fallback);
    onChange(clamped);
    setText(String(clamped));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={inputMode}
      value={text}
      className={className}
      aria-label={ariaLabel}
      style={style}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(text);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (!isAllowedNumericDraft(raw, allowDecimal)) return;
        setText(raw);
        if (raw !== "") {
          const parsed = parseDraftNumber(raw);
          if (Number.isFinite(parsed)) onChange(parsed);
        }
      }}
    />
  );
}
