"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  Fragment,
  isValidElement,
  type ChangeEvent,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";

type NativeProps = SelectHTMLAttributes<HTMLSelectElement>;

type OptionRecord = {
  value: string;
  label: ReactNode;
  disabled: boolean;
};

type ApexSelectProps = Omit<NativeProps, "size"> & {
  menuClassName?: string;
};

function collectOptions(children: ReactNode): OptionRecord[] {
  const result: OptionRecord[] = [];

  function walk(node: ReactNode) {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;

      if (child.type === "option") {
        const option = child as ReactElement<{
          value?: string | number;
          disabled?: boolean;
          children?: ReactNode;
        }>;

        const rawValue =
          option.props.value ??
          (typeof option.props.children === "string"
            ? option.props.children
            : "");

        result.push({
          value: String(rawValue),
          label: option.props.children,
          disabled: Boolean(option.props.disabled)
        });
        return;
      }

      if (
        child.type === "optgroup" ||
        child.type === Fragment
      ) {
        walk(
          (child as ReactElement<{ children?: ReactNode }>).props.children
        );
      }
    });
  }

  walk(children);
  return result;
}

export function ApexSelect({
  children,
  className,
  menuClassName,
  value,
  defaultValue,
  disabled,
  onChange,
  id,
  name,
  required,
  autoFocus,
  tabIndex,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}: ApexSelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => collectOptions(children), [children]);

  const initialValue =
    value !== undefined
      ? String(value)
      : defaultValue !== undefined
        ? String(defaultValue)
        : options[0]?.value ?? "";

  const [internalValue, setInternalValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const selectedValue =
    value !== undefined ? String(value) : internalValue;

  const selected =
    options.find((option) => option.value === selectedValue) ?? options[0];

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(String(value));
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 8;

      const visualViewport = window.visualViewport;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportHeight = visualViewport?.height ?? window.innerHeight;
      const viewportBottom = viewportTop + viewportHeight;
      const viewportWidth = visualViewport?.width ?? window.innerWidth;

      const spaceBelow = Math.max(
        0,
        viewportBottom - rect.bottom - gap - viewportPadding
      );
      const spaceAbove = Math.max(
        0,
        rect.top - viewportTop - gap - viewportPadding
      );

      // Enough for every option up to the menu cap. If it does not fit below,
      // use the side with more room and make the menu scroll inside that space.
      const preferredHeight = Math.min(
        320,
        Math.max(52, options.length * 44 + 12)
      );
      const openAbove =
        spaceBelow < preferredHeight && spaceAbove > spaceBelow;

      const availableSpace = openAbove ? spaceAbove : spaceBelow;
      const menuHeight = Math.max(
        52,
        Math.min(preferredHeight, availableSpace)
      );

      const menuWidth = Math.min(
        Math.max(180, rect.width),
        viewportWidth - viewportPadding * 2
      );
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        Math.max(
          viewportPadding,
          viewportWidth - viewportPadding - menuWidth
        )
      );

      const top = openAbove
        ? Math.max(
            viewportTop + viewportPadding,
            rect.top - gap - menuHeight
          )
        : Math.min(
            rect.bottom + gap,
            viewportBottom - viewportPadding - menuHeight
          );

      setMenuStyle({
        position: "fixed",
        left,
        width: menuWidth,
        maxWidth: menuWidth,
        maxHeight: menuHeight,
        top,
        bottom: undefined,
        zIndex: 10000
      });
    };

    updatePosition();

    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleNativeChange(event: ChangeEvent<HTMLSelectElement>) {
    if (value === undefined) {
      setInternalValue(event.target.value);
    }
    onChange?.(event);
  }

  function choose(nextValue: string) {
    const nativeSelect = selectRef.current;
    if (!nativeSelect) return;

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    const setter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value"
    )?.set;

    setter?.call(nativeSelect, nextValue);
    nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  return (
    <div className="relative w-full">
      <select
        {...rest}
        ref={selectRef}
        id={id}
        name={name}
        required={required}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        disabled={disabled}
        onChange={handleNativeChange}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
      >
        {children}
      </select>

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        autoFocus={autoFocus}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={
          (className ?? "") +
          " relative flex items-center justify-between gap-3 text-left"
        }
      >
        <span className="min-w-0 flex-1 truncate">
          {selected?.label ?? ""}
        </span>
        <ChevronDown
          size={16}
          className={
            "shrink-0 opacity-60 transition-transform duration-150 " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            style={menuStyle}
            className={
              "apex-select-menu overscroll-contain overflow-y-auto rounded-2xl border border-white/10 bg-[#171719] p-1.5 text-[13px] text-white shadow-[0_22px_60px_rgba(0,0,0,.5)] " +
              (menuClassName ?? "")
            }
          >
            {options.map((option) => {
              const active = option.value === selectedValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  onClick={() => choose(option.value)}
                  className={
                    "flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left transition-colors duration-150 " +
                    (active
                      ? "bg-[#8F0000] text-white"
                      : "text-white/78 hover:bg-white/[0.06] hover:text-white")
                  }
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active ? <Check size={14} className="shrink-0" /> : null}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
