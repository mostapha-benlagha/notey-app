import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

export function PinInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  className,
}: PinInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const chars = value.replace(/\D/g, "").slice(0, length).split("");
    return Array.from({ length }, (_, index) => chars[index] ?? "");
  }, [length, value]);

  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);

  function commit(nextDigits: string[]) {
    onChange(nextDigits.join(""));
  }

  return (
    <div className={cn("flex gap-2", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit}
          aria-label={`Digit ${index + 1}`}
          className="h-12 w-12 rounded-2xl border border-input bg-white/95 text-center text-lg font-semibold tracking-[0.2em] text-foreground shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(event) => {
            const nextChar = event.target.value.replace(/\D/g, "").slice(-1);
            const nextDigits = [...digits];
            nextDigits[index] = nextChar;
            commit(nextDigits);

            if (nextChar && index < length - 1) {
              refs.current[index + 1]?.focus();
              refs.current[index + 1]?.select();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
              refs.current[index - 1]?.select();
            }

            if (event.key === "ArrowLeft" && index > 0) {
              refs.current[index - 1]?.focus();
              refs.current[index - 1]?.select();
            }

            if (event.key === "ArrowRight" && index < length - 1) {
              refs.current[index + 1]?.focus();
              refs.current[index + 1]?.select();
            }
          }}
          onFocus={(event) => {
            event.target.select();
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!pasted) {
              return;
            }

            const nextDigits = Array.from({ length }, (_, position) => pasted[position] ?? "");
            commit(nextDigits);
            const focusIndex = Math.min(pasted.length, length - 1);
            refs.current[focusIndex]?.focus();
            refs.current[focusIndex]?.select();
          }}
        />
      ))}
    </div>
  );
}
