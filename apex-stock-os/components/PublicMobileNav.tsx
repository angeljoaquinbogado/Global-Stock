"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const links = [
  { href: "/download#download-features", label: "Producto" },
  { href: "/download#download-feature-catalog", label: "Funcionalidades" },
  { href: "/download#download-sectors", label: "Para quién" },
  { href: "/download#download-install", label: "Instalar" },
  { href: "/support", label: "Soporte" }
];

export function PublicMobileNav() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.04] text-white/72 outline-none transition-colors duration-150 hover:bg-white/[0.07] hover:text-white"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              transform: reduceMotion
                ? "translate3d(0,0,0)"
                : "translate3d(0,-8px,0)"
            }}
            animate={{
              opacity: 1,
              transform: "translate3d(0,0,0)"
            }}
            exit={{
              opacity: 0,
              transform: reduceMotion
                ? "translate3d(0,0,0)"
                : "translate3d(0,-6px,0)"
            }}
            transition={{
              duration: reduceMotion ? 0.12 : 0.18,
              ease: [0.23, 1, 0.32, 1]
            }}
            className="gs-public-glass absolute inset-x-0 top-[68px] border-b border-white/[0.045] bg-[#08090b]/98 px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,.45)] backdrop-blur-xl sm:px-8"
          >
            <nav className="mx-auto grid w-full max-w-[1240px] gap-1">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-white/58 transition-colors duration-150 hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.045] pt-4">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/[0.04] px-4 text-xs font-semibold text-white/70"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#c91527] px-4 text-xs font-semibold text-white"
                >
                  Abrir app
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
