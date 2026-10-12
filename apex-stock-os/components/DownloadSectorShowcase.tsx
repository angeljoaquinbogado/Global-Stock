"use client";

import {
  Beef, BookOpen, BriefcaseBusiness, Carrot, Croissant, Eye,
  Factory, Gem, Hammer, Laptop, Leaf, PawPrint, Pill,
  Scissors, Shirt, ShoppingBag, Store, UtensilsCrossed, Warehouse
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const sectors = [
  { id: "almacen", icon: Store, label: "Almacén / Kiosco", group: "Rubro", title: "Productos de todos los días", body: "Llevá los precios y el stock del negocio sin una planilla aparte.", accent: "#B2182B", surface: "#B2182B22" },
  { id: "indumentaria", icon: Shirt, label: "Indumentaria", group: "Rubro", title: "Ropa, calzado y accesorios", body: "Revisá cuántas unidades tenés y prepará reposiciones por producto.", accent: "#1C62C2", surface: "#1C62C222" },
  { id: "carniceria", icon: Beef, label: "Carnicería", group: "Rubro", title: "Carnes y embutidos", body: "Registrá insumos, cantidades y costos desde el inventario.", accent: "#7F3FC2", surface: "#7F3FC222" },
  { id: "verduleria", icon: Carrot, label: "Verdulería", group: "Rubro", title: "Frutas y verduras", body: "Controlá productos y ajustá existencias cuando entra mercadería.", accent: "#C27124", surface: "#C2712422" },
  { id: "panaderia", icon: Croissant, label: "Panadería", group: "Rubro", title: "Pan, facturas y pastelería", body: "Organizá ingredientes, productos y compras en el mismo negocio.", accent: "#286C9A", surface: "#286C9A22" },
  { id: "farmacia", icon: Pill, label: "Farmacia", group: "Rubro", title: "Medicamentos y perfumería", body: "Consultá productos y existencias. No reemplaza controles sanitarios ni trazabilidad regulatoria.", accent: "#AF3A57", surface: "#AF3A5722" },
  { id: "libreria", icon: BookOpen, label: "Librería", group: "Rubro", title: "Libros, útiles y papelería", body: "Encontrá cada artículo por nombre o código y revisá existencias.", accent: "#369C79", surface: "#369C7922" },
  { id: "ferreteria", icon: Hammer, label: "Ferretería", group: "Rubro", title: "Herramientas y materiales", body: "Buscá repuestos, piezas y materiales por código y stock.", accent: "#B2182B", surface: "#B2182B22" },
  { id: "electronica", icon: Laptop, label: "Electrónica", group: "Rubro", title: "Celulares y accesorios", body: "Mantené organizado el catálogo de equipos, accesorios y precios.", accent: "#1C62C2", surface: "#1C62C222" },
  { id: "dietetica", icon: Leaf, label: "Dietética", group: "Rubro", title: "Productos naturales", body: "Revisá lo disponible y prepará una lista de reposición.", accent: "#7F3FC2", surface: "#7F3FC222" },
  { id: "estetica", icon: Scissors, label: "Estética", group: "Rubro", title: "Cosmética y tratamientos", body: "Llevá los insumos que usás y sus costos de compra.", accent: "#C27124", surface: "#C2712422" },
  { id: "optica", icon: Eye, label: "Óptica", group: "Rubro", title: "Anteojos y lentes", body: "Buscá modelos y accesorios. No reemplaza registros sanitarios.", accent: "#286C9A", surface: "#286C9A22" },
  { id: "veterinaria", icon: PawPrint, label: "Veterinaria", group: "Rubro", title: "Alimentos y productos para mascotas", body: "Organizá alimentos y productos, con alertas de stock bajo.", accent: "#AF3A57", surface: "#AF3A5722" },
  { id: "joyeria", icon: Gem, label: "Joyería", group: "Rubro", title: "Joyas, relojes y accesorios", body: "Consultá existencias y precios de cada artículo.", accent: "#369C79", surface: "#369C7922" },
  { id: "peluqueria", icon: Scissors, label: "Peluquería", group: "Rubro", title: "Cuidado del cabello", body: "Tené a mano cuánto queda de cada producto e insumo.", accent: "#B2182B", surface: "#B2182B22" },
  { id: "restaurante", icon: UtensilsCrossed, label: "Restaurante", group: "Rubro", title: "Cocina e ingredientes", body: "Revisá ingredientes, compras y mercadería que necesitás.", accent: "#1C62C2", surface: "#1C62C222" },
  { id: "mayorista", icon: Warehouse, label: "Mayorista / Depósito", group: "Rubro", title: "Distribución y almacenamiento", body: "Llevá existencias y movimientos de distintos productos.", accent: "#7F3FC2", surface: "#7F3FC222" },
  { id: "fabricacion", icon: Factory, label: "Taller / Fábrica", group: "Rubro", title: "Materiales y repuestos", body: "Controlá insumos y componentes para trabajar sin faltantes.", accent: "#C27124", surface: "#C2712422" },
  { id: "tienda-online", icon: ShoppingBag, label: "Tienda online", group: "Rubro", title: "Productos y pedidos", body: "Mantené tu catálogo organizado. La sincronización exige conectar la tienda.", accent: "#286C9A", surface: "#286C9A22" },
  { id: "servicios", icon: BriefcaseBusiness, label: "Servicios", group: "Rubro", title: "Insumos de trabajo", body: "Registrá los materiales que usás para prestar tus servicios.", accent: "#AF3A57", surface: "#AF3A5722" },
  { id: "otro", icon: Store, label: "Otro negocio", group: "Rubro", title: "Tu actividad", body: "Arrancá con un catálogo simple y sumá funciones según las necesites.", accent: "#369C79", surface: "#369C7922" }
];

export function DownloadSectorShowcase() {
  const [active, setActive] = useState("almacen");
  const reduceMotion = useReducedMotion();
  const current = sectors.find((item) => item.id === active) ?? sectors[0];
  const CurrentIcon = current.icon;

  const activate = (id: string) => {
    setActive((currentId) => (currentId === id ? currentId : id));
  };

  return (
    <section className="border-t border-white/[0.045] bg-[#0a0a0c] text-white">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[.74fr_1.26fr] lg:items-start">
          <div>
            <p className="gs-download-kicker text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
              Para quién es
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
              Para negocios que
              <span className="block text-white/34">necesitan control.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#a8a8b0]">
              Almacenes, ferreterías, restaurantes, talleres y otros negocios pueden empezar
              con productos y stock. Después suman las herramientas que necesitan.
            </p>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sectors.map(({ id, icon: Icon, label, accent, surface }) => {
                const selected = active === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onMouseEnter={() => activate(id)}
                    onFocus={() => activate(id)}
                    onClick={() => activate(id)}
                    className={
                      "gs-sector-card group flex min-h-[86px] flex-col items-start justify-between rounded-[20px] bg-[#111216] px-3.5 py-3 text-left outline-none transition-[background-color,box-shadow,color] duration-160 [transition-timing-function:var(--ease-out)] " +
                      (selected
                        ? "text-white shadow-[0_14px_38px_rgba(0,0,0,.22)]"
                        : "text-white/58 hover:bg-[#15161b] hover:text-white")
                    }
                    style={
                      selected
                        ? {
                            boxShadow:
                              "inset 0 0 0 1px " +
                              accent +
                              "45, 0 14px 38px rgba(0,0,0,.22)"
                          }
                        : undefined
                    }
                    aria-pressed={selected}
                  >
                    <span
                      className="gs-sector-icon grid h-8 w-8 place-items-center rounded-xl"
                      style={{ background: surface, color: accent }}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="mt-3 text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
              transition={{
                duration: reduceMotion ? 0 : 0.23,
                ease: [0.23, 1, 0.32, 1]
              }}
              className="mt-4 overflow-hidden rounded-[30px] bg-[#111217] p-6 shadow-[0_24px_64px_rgba(0,0,0,.22)] sm:p-7"
              style={{
                boxShadow:
                  "inset 0 0 0 1px " +
                  current.accent +
                  "24, 0 24px 64px rgba(0,0,0,.22)"
              }}
            >
              <div className="grid gap-5 sm:grid-cols-[56px_1fr] sm:items-start">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: current.surface, color: current.accent }}
                >
                  <CurrentIcon size={21} />
                </span>

                <div>
                  <p
                    className="gs-download-kicker text-[10px] font-bold uppercase tracking-[.14em] text-[#8F0000]"
                    style={{ color: "#8F0000" }}
                  >
                    {current.group}
                  </p>
                  <h3 className="mt-2 max-w-2xl text-2xl font-semibold leading-[1.04] tracking-[-.04em] sm:text-3xl">
                    {current.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a0a0a9]">
                    {current.body}
                  </p>
                </div>
              </div>
            </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}