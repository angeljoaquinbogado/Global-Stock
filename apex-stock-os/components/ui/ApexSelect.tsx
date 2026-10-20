"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import {
  Children, Fragment, isValidElement,
  type ChangeEvent, type CSSProperties, type ReactElement,
  type ReactNode, type SelectHTMLAttributes,
  useEffect, useId, useMemo, useRef, useState
} from "react";
import { createPortal } from "react-dom";

type NativeProps = SelectHTMLAttributes<HTMLSelectElement>;
type OptionRecord = { value: string; label: ReactNode; disabled: boolean };
type ApexSelectProps = Omit<NativeProps, "size"> & { menuClassName?: string };

function collectOptions(children: ReactNode): OptionRecord[] {
  const result: OptionRecord[] = [];
  function walk(node: ReactNode) {
    Children.forEach(node, child => {
      if (!isValidElement(child)) return;
      if (child.type === "option") {
        const option = child as ReactElement<{
          value?: string | number; disabled?: boolean; children?: ReactNode
        }>;
        const raw = option.props.value ??
          (typeof option.props.children === "string" ? option.props.children : "");
        result.push({
          value: String(raw), label: option.props.children,
          disabled: Boolean(option.props.disabled)
        });
      } else if (child.type === "optgroup" || child.type === Fragment) {
        walk((child as ReactElement<{ children?: ReactNode }>).props.children);
      }
    });
  }
  walk(children);
  return result;
}

export function ApexSelect({
  children, className, menuClassName, value, defaultValue, disabled,
  onChange, id, name, required, autoFocus, tabIndex,
  "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...rest
}: ApexSelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();
  const options = useMemo(() => collectOptions(children), [children]);
  const initialValue = value !== undefined ? String(value)
    : defaultValue !== undefined ? String(defaultValue) : options[0]?.value ?? "";
  const [internalValue, setInternalValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({ visibility: "hidden" });
  const selectedValue = value !== undefined ? String(value) : internalValue;
  const selected = options.find(option => option.value === selectedValue) ?? options[0];

  useEffect(() => {
    if (value !== undefined) setInternalValue(String(value));
  }, [value]);

  function clearHoverClose() {
    if (hoverCloseTimer.current !== null) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }
  function scheduleHoverClose() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    clearHoverClose();
    hoverCloseTimer.current = setTimeout(() => {
      setOpen(false);
      hoverCloseTimer.current = null;
    }, 170);
  }
  function positionMenu() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
    const viewportWidth = viewport?.width ?? window.innerWidth;
    const padding = 12;
    const gap = 8;
    const below = Math.max(0, viewportBottom - rect.bottom - gap - padding);
    const above = Math.max(0, rect.top - viewportTop - gap - padding);
    const desiredHeight = Math.min(320, Math.max(52, options.length * 44 + 12));
    const upwards = below < desiredHeight && above > below;
    const available = upwards ? above : below;
    const height = Math.max(36, Math.min(desiredHeight, available));
    const width = Math.min(Math.max(180, rect.width), viewportWidth - padding * 2);
    const left = Math.max(padding, Math.min(rect.left, viewportWidth - padding - width));
    const top = upwards
      ? Math.max(viewportTop + padding, rect.top - gap - height)
      : Math.min(rect.bottom + gap, viewportBottom - padding - height);

    // The menu is portaled to body to avoid overflow clipping. Copy the
    // effective workspace variables, otherwise portal options revert to red
    // even when the customer selected green (or any other workspace accent).
    const style = getComputedStyle(button);
    const vars: Record<string, string> = {};
    const names = [
      "--apex-accent", "--apex-accent-soft", "--apex-accent-bright",
      "--apex-bg", "--apex-surface-strong", "--apex-text",
      "--apex-muted", "--apex-border", "--apex-crimson"
    ];
    for (const token of names) {
      const resolved = style.getPropertyValue(token).trim();
      if (resolved) vars[token] = resolved;
    }
    const accent = vars["--apex-accent"] || vars["--apex-crimson"] || "#8F0000";
    vars["--apex-accent"] = accent;
    if (!vars["--apex-accent-soft"]) {
      vars["--apex-accent-soft"] = "color-mix(in srgb," + accent + " 12%,transparent)";
    }
    setOpenAbove(upwards);
    setMenuStyle({
      ...vars, position: "fixed", left, top, width, maxWidth: width,
      maxHeight: height, zIndex: 10000, visibility: "visible"
    } as CSSProperties);
  }
  function openMenu(focusSelected = false) {
    if (disabled) return;
    clearHoverClose();
    positionMenu();
    setOpen(true);
    if (focusSelected) {
      requestAnimationFrame(() => {
        const buttons = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
        const index = Math.max(0, options.findIndex(item => item.value === selectedValue));
        buttons?.[index]?.focus();
      });
    }
  }

  useEffect(() => () => {
    if (hoverCloseTimer.current !== null) clearTimeout(hoverCloseTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      clearHoverClose();
      setOpen(false);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearHoverClose();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    window.visualViewport?.addEventListener("resize", positionMenu);
    window.visualViewport?.addEventListener("scroll", positionMenu);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
      window.visualViewport?.removeEventListener("resize", positionMenu);
      window.visualViewport?.removeEventListener("scroll", positionMenu);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", keydown);
    };
  // options.length is relevant to menu dimensions.
  }, [open, options.length]);

  function handleNativeChange(event: ChangeEvent<HTMLSelectElement>) {
    if (value === undefined) setInternalValue(event.target.value);
    onChange?.(event);
  }
  function choose(nextValue: string) {
    const element = selectRef.current;
    if (!element) return;
    if (value === undefined) setInternalValue(nextValue);
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
    setter?.call(element, nextValue);
    element.dispatchEvent(new Event("change", { bubbles: true }));
    clearHoverClose();
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }
  function moveFocus(step: number) {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    if (!buttons.length) return;
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const selectedIndex = Math.max(0, options.findIndex(option => option.value === selectedValue));
    let index = current < 0 ? selectedIndex : current;
    for (let trial = 0; trial < buttons.length; trial += 1) {
      index = (index + step + buttons.length) % buttons.length;
      if (!buttons[index].disabled) { buttons[index].focus(); return; }
    }
  }
  function isFinePointer() {
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  return (
    <div className="relative w-full"
      onMouseEnter={() => { if (isFinePointer()) openMenu(); }}
      onMouseLeave={scheduleHoverClose}
    >
      <select
        {...rest} ref={selectRef} id={id} name={name} required={required}
        value={value} defaultValue={value === undefined ? defaultValue : undefined}
        disabled={disabled} onChange={handleNativeChange}
        tabIndex={-1} aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
      >
        {children}
      </select>
      <button
        ref={buttonRef} type="button" disabled={disabled} autoFocus={autoFocus}
        tabIndex={tabIndex} aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox" aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (isFinePointer()) openMenu();
          else if (open) { clearHoverClose(); setOpen(false); }
          else openMenu();
        }}
        onKeyDown={event => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          openMenu(true);
        }}
        className={(className ?? "") +
          " relative flex items-center justify-between gap-3 text-left transition-colors hover:border-[var(--apex-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--apex-accent)]"}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? ""}</span>
        <ChevronDown size={16}
          className={"shrink-0 opacity-60 transition-transform duration-200 " + (open ? "rotate-180" : "")}/>
      </button>
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              key={listId}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              style={menuStyle}
              initial={{opacity:0,y:openAbove ? 9 : -9,scaleY:.96}}
              animate={{opacity:1,y:0,scaleY:1}}
              exit={{opacity:0,y:openAbove ? 7 : -7,scaleY:.97,pointerEvents:"none"}}
              transition={{type:"spring",stiffness:370,damping:31,mass:.75}}
              onMouseEnter={clearHoverClose}
              onMouseLeave={scheduleHoverClose}
              onKeyDown={event => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  moveFocus(event.key === "ArrowDown" ? 1 : -1);
                }
                if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  const enabled = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []);
                  enabled[event.key === "Home" ? 0 : enabled.length - 1]?.focus();
                }
                if (event.key === "Tab") { clearHoverClose(); setOpen(false); }
              }}
              className={"apex-select-menu overscroll-contain overflow-y-auto rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-1.5 text-[13px] text-[var(--apex-text)] shadow-[0_16px_45px_rgba(0,0,0,.16)] dark:shadow-[0_22px_60px_rgba(0,0,0,.5)] " + (menuClassName ?? "")}
            >
              {options.map(option => {
                const active = option.value === selectedValue;
                return (
                  <button
                    key={option.value} type="button" role="option"
                    aria-selected={active} disabled={option.disabled}
                    onClick={() => choose(option.value)}
                    className={"flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--apex-accent)] " +
                      (active
                        ? "bg-[var(--apex-accent)] text-white"
                        : "text-[var(--apex-text)] hover:bg-[var(--apex-accent-soft)]")}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {active && <Check size={14} className="shrink-0" aria-hidden="true"/>}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
