"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
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

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-white/70 transition hover:bg-white/[0.07] hover:text-white"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[72px] border-b border-[#211417] bg-[#080809]/98 px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,.45)] backdrop-blur-xl sm:px-8">
          <nav className="mx-auto grid w-full max-w-[1240px] gap-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-white/58 transition hover:bg-white/[0.04] hover:text-white"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#211417] pt-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white/[0.04] px-4 text-xs font-semibold text-white/68"
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
        </div>
      )}
    </div>
  );
}
