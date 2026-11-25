"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Mail,
  Send
} from "lucide-react";

const SUPPORT_EMAIL = "support.globalstock@gmail.com";

const TOPICS = [
  "Crear cuenta o recuperar acceso",
  "Instalar la app en celular o PC",
  "Configurar stock, precios o caja",
  "Vincular el escáner de códigos móvil",
  "Reportar un error o sugerir mejora"
] as const;

export function SupportInteractive() {
  const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [sentReady, setSentReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape as unknown as EventListener);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape as unknown as EventListener);
    };
  }, []);

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
    }
  }

  function buildGmailUrl(includeFormContent: boolean) {
    const subject = includeFormContent
      ? `[Soporte Global Stock] ${selectedTopic}`
      : "Consulta de soporte · Global Stock";
    const body = includeFormContent && message.trim()
      ? `Motivo: ${selectedTopic}\n\nDetalle:\n${message.trim()}`
      : "";
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: SUPPORT_EMAIL,
      su: subject
    });
    if (body) params.set("body", body);
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  function buildMailtoUrl(includeFormContent: boolean) {
    const subject = includeFormContent
      ? `[Soporte Global Stock] ${selectedTopic}`
      : "Consulta de soporte · Global Stock";
    const body = includeFormContent && message.trim()
      ? `Motivo: ${selectedTopic}\n\nDetalle:\n${message.trim()}`
      : "";
    const query = new URLSearchParams({ subject });
    if (body) query.set("body", body);
    return `mailto:${SUPPORT_EMAIL}?${query.toString()}`;
  }

  function handleSendInquiry() {
    const gmailUrl = buildGmailUrl(true);
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    setSentReady(true);
  }

  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const currentIdx = TOPICS.indexOf(selectedTopic as (typeof TOPICS)[number]);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (currentIdx + 1) % TOPICS.length;
      setSelectedTopic(TOPICS[next]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (currentIdx - 1 + TOPICS.length) % TOPICS.length;
      setSelectedTopic(TOPICS[prev]);
    }
  }

  return (
    <div className="gs-sup-grid">
      {/* Columna izquierda: Canal directo con Copiar, Abrir Gmail y App de correo */}
      <div className="gs-sup-col">
        <article className="gs-sup-glass-card has-glow">
          <span className="gs-sup-eyebrow">Canal directo</span>
          <h2 className="gs-sup-card-title">Correo de soporte técnico</h2>
          <p className="gs-sup-card-desc">
            Copiá nuestra dirección o abrí directamente Gmail o la aplicación de correo que uses en tu dispositivo.
          </p>

          <div className="gs-sup-mail-pill">
            <span className="gs-sup-mail-addr">
              <Mail size={16} aria-hidden="true" />
              {SUPPORT_EMAIL}
            </span>
            <button
              type="button"
              onClick={handleCopyEmail}
              className={`gs-sup-copy-btn ${copied ? "is-copied" : ""}`}
            >
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          <div className="gs-sup-direct-btns">
            <a
              href={buildGmailUrl(false)}
              target="_blank"
              rel="noopener noreferrer"
              className="gs-sup-sec-btn"
            >
              <ExternalLink size={15} aria-hidden="true" />
              Abrir Gmail
            </a>
            <a href={buildMailtoUrl(false)} className="gs-sup-sec-btn">
              <Mail size={15} aria-hidden="true" />
              App de correo
            </a>
          </div>
        </article>

        <article className="gs-sup-glass-card">
          <span className="gs-sup-eyebrow">Guía rápida</span>
          <h2 className="gs-sup-card-title">Para responderte más rápido</h2>
          <ul className="gs-sup-tips">
            <li>Indicá el correo con el que iniciás sesión en Global Stock.</li>
            <li>Contanos si usás celular (Android / iPhone) o computadora (Windows / Mac).</li>
            <li>Si ves algún mensaje en pantalla, describilo en pocas palabras.</li>
          </ul>
        </article>
      </div>

      {/* Columna derecha: Asistente de consulta con Dropdown Liquid Glass y botón único "Enviar" */}
      <article className="gs-sup-glass-card has-glow">
        <span className="gs-sup-eyebrow">Asistente de consulta</span>
        <h2 className="gs-sup-card-title">Prepará tu mensaje en segundos</h2>
        <p className="gs-sup-card-desc">
          Elegí el motivo, escribí tu consulta y tocá Enviar para abrir el mensaje listo con asunto y destinatario.
        </p>

        <div className="gs-sup-field" ref={dropdownRef}>
          <label id="support-topic-label" className="gs-sup-label">
            ¿Con qué necesitás ayuda?
          </label>
          <div className="gs-lg-select">
            <button
              type="button"
              className="gs-lg-select-trigger"
              aria-labelledby="support-topic-label"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
              onKeyDown={handleTriggerKeyDown}
            >
              <span>{selectedTopic}</span>
              <ChevronDown size={18} aria-hidden="true" className="gs-lg-select-chevron" />
            </button>

            {menuOpen && (
              <ul
                role="listbox"
                aria-labelledby="support-topic-label"
                className="gs-lg-select-menu"
              >
                {TOPICS.map((topic) => {
                  const isSelected = topic === selectedTopic;
                  return (
                    <li
                      key={topic}
                      role="option"
                      aria-selected={isSelected}
                      className={`gs-lg-select-option ${isSelected ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedTopic(topic);
                        setMenuOpen(false);
                        setSentReady(false);
                      }}
                    >
                      <span>{topic}</span>
                      {isSelected && <Check size={16} aria-hidden="true" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="gs-sup-field">
          <label htmlFor="support-message-input" className="gs-sup-label">
            Detalle de tu consulta
          </label>
          <textarea
            id="support-message-input"
            className="gs-sup-textarea"
            placeholder="Escribí acá lo que necesitás resolver..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (sentReady) setSentReady(false);
            }}
          />
        </div>

        <div className="gs-sup-submit-row">
          <button
            type="button"
            onClick={handleSendInquiry}
            className="gs-sup-submit-btn"
          >
            <Send size={16} aria-hidden="true" />
            Enviar
          </button>

          {sentReady && (
            <span role="status" className="gs-sup-sent-badge">
              <CheckCircle2 size={15} aria-hidden="true" />
              Mensaje preparado para {SUPPORT_EMAIL}
            </span>
          )}
        </div>
      </article>
    </div>
  );
}