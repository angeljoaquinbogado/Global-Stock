"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Mail, Send } from "lucide-react";

const SUPPORT_EMAIL = "support.globalstock@gmail.com";

const TOPICS = [
  "Crear cuenta o recuperar acceso",
  "Instalar la app en celular o PC",
  "Configurar stock, precios o caja",
  "Vincular el escáner de códigos móvil",
  "Reportar un error o sugerir mejora"
] as const;

export function SupportInteractive() {
  const [copied, setCopied] = useState(false);
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [accountEmail, setAccountEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const subject = `[Soporte Global Stock] ${topic}`;
  const body = [
    `Motivo: ${topic}`,
    accountEmail ? `Correo de mi cuenta: ${accountEmail}` : "Correo de mi cuenta: ",
    "",
    message || "Hola equipo de Global Stock, necesito ayuda con..."
  ].join("\n");

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ef5350]">
            Canal directo
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Correo de soporte técnico
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/65">
            Si no tenés una aplicación de correo configurada en tu computadora, copiá la dirección o abrí Gmail directo desde el navegador.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5">
            <Mail size={16} className="shrink-0 text-[#ef5350]" />
            <span className="text-sm font-medium text-white select-all">{SUPPORT_EMAIL}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-base font-semibold text-white">Para responderte más rápido</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
            <li>• Indicá el correo con el que iniciás sesión en Global Stock.</li>
            <li>• Contanos si usás celular (Android / iPhone) o computadora (Windows / Mac).</li>
            <li>• Si ves algún mensaje en pantalla, describilo en pocas palabras.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ef5350]">
          Asistente de consulta
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">
          Prepará tu mensaje en segundos
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="sup-topic" className="block text-xs font-semibold text-white/75">
              ¿Con qué necesitás ayuda?
            </label>
            <select
              id="sup-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#121216] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#8F0000]"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sup-email" className="block text-xs font-semibold text-white/75">
              Tu correo en Global Stock (opcional)
            </label>
            <input
              id="sup-email"
              type="email"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="ejemplo@tunegocio.com"
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#121216] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#8F0000]"
            />
          </div>

          <div>
            <label htmlFor="sup-msg" className="block text-xs font-semibold text-white/75">
              Contanos tu consulta
            </label>
            <textarea
              id="sup-msg"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribí acá lo que necesitás resolver..."
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#121216] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#8F0000]"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={gmailHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#8F0000] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#a80000]"
            >
              <ExternalLink size={16} />
              Enviar con Gmail Web
            </a>
            <a
              href={mailtoHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1]"
            >
              <Send size={16} />
              Abrir app de correo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}