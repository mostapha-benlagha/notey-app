import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ParsedOption {
  value: string;
  label: React.ReactNode;
  disabled: boolean;
}

function parseOptions(children: React.ReactNode): ParsedOption[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) {
      return [];
    }

    if (typeof child.type === "string" && child.type === "option") {
      const optionProps = child.props as { value?: string; disabled?: boolean; children?: React.ReactNode };
      return [
        {
          value: optionProps.value ?? "",
          label: optionProps.children,
          disabled: Boolean(optionProps.disabled),
        },
      ];
    }

    return [];
  });
}

export function Select({
  className,
  children,
  value,
  onChange,
  disabled,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const options = React.useMemo(() => parseOptions(children), [children]);
  const selectedOption =
    options.find((option) => option.value === value) ??
    options.find((option) => !option.disabled) ??
    options[0];

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (!onChange) {
        return;
      }

      onChange({
        target: { value: nextValue },
        currentTarget: { value: nextValue },
      } as React.ChangeEvent<HTMLSelectElement>);
    },
    [onChange],
  );

  if (!selectedOption) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full max-w-full items-center justify-between gap-3 overflow-hidden rounded-xl border border-input bg-white px-3 py-2 text-sm text-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          aria-label={props["aria-label"]}
          aria-disabled={disabled}
        >
          <span className="min-w-0 flex-1 truncate text-left">{selectedOption.label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={10}
        className="w-[var(--radix-dropdown-menu-trigger-width)] max-w-[min(var(--radix-dropdown-menu-content-available-width),24rem)]"
      >
        {options.map((option) => {
          const isSelected = option.value === selectedOption.value;
          return (
            <DropdownMenuItem
              key={`${option.value}:${String(option.label)}`}
              disabled={option.disabled}
              className={cn(isSelected && "bg-secondary/70")}
              onSelect={() => handleValueChange(option.value)}
            >
              <div className="flex w-full min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
