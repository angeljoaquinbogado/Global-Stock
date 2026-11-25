"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Laptop,
  Mail,
  MessageSquareText,
  Send,
  UserCheck
} from "lucide-react";

const SUPPORT_EMAIL = "support.globalstock@gmail.com";

const TOPICS = [
  "Crear cuenta o recuperar acceso",
  "Instalar la app en celular o PC",
  "Configurar stock, precios o caja",
  "Vincular el escáner de códigos móvil",
  "Reportar un error o sugerir mejora"
] as const;

const QUICK_TIPS = [
  {
    icon: UserCheck,
    title: "1. Tu correo de acceso",
    detail: "Indicá el correo con el que iniciás sesión en Global Stock."
  },
  {
    icon: Laptop,
    title: "2. Tu dispositivo",
    detail: "Contanos si usás celular (Android / iPhone) o PC (Windows / Mac)."
  },
  {
    icon: MessageSquareText,
    title: "3. Qué ocurrió",
    detail: "Si ves algún aviso o error en pantalla, describilo en pocas palabras."
  }
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
    const body =
      includeFormContent && message.trim()
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
    const body =
      includeFormContent && message.trim()
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
      setSelectedTopic(TOPICS[(currentIdx + 1) % TOPICS.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedTopic(TOPICS[(currentIdx - 1 + TOPICS.length) % TOPICS.length]);
    }
  }

  return (
    <div className="gs-sup-layout">
      <div className="gs-sup-grid">
        {/* Tarjeta Izquierda: Canal directo */}
        <article className="gs-sup-glass-card gs-sup-anim-1">
          <div className="gs-sup-card-top">
            <span className="gs-sup-eyebrow">Canal directo</span>
            <h2 className="gs-sup-card-title">Correo de soporte técnico</h2>
            <p className="gs-sup-card-desc">
              Copiá nuestra dirección o abrí directamente Gmail o la aplicación de correo instalada en tu dispositivo.
            </p>
          </div>

          <div className="gs-sup-card-bottom">
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
                <span>{copied ? "Copiado" : "Copiar"}</span>
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
                <span>Abrir Gmail</span>
              </a>
              <a href={buildMailtoUrl(false)} className="gs-sup-sec-btn">
                <Mail size={15} aria-hidden="true" />
                <span>App de correo</span>
              </a>
            </div>
          </div>
        </article>

        {/* Tarjeta Derecha: Asistente de consulta */}
        <article className="gs-sup-glass-card gs-sup-anim-2">
          <div className="gs-sup-card-top">
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
          </div>

          <div className="gs-sup-card-bottom">
            <div className="gs-sup-submit-row">
              <button
                type="button"
                onClick={handleSendInquiry}
                className="gs-sup-submit-btn"
              >
                <Send size={16} aria-hidden="true" />
                <span>Enviar</span>
              </button>

              {sentReady && (
                <span role="status" className="gs-sup-sent-badge">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  <span>Mensaje listo para {SUPPORT_EMAIL}</span>
                </span>
              )}
            </div>
          </div>
        </article>
      </div>

      {/* Franja inferior simétrica de 3 columnas */}
      <section className="gs-sup-tips-section gs-sup-anim-3" aria-labelledby="sup-tips-heading">
        <div className="gs-sup-tips-head">
          <span className="gs-sup-eyebrow">Guía rápida</span>
          <h2 id="sup-tips-heading" className="gs-sup-tips-title">
            Para responderte más rápido
          </h2>
        </div>

        <div className="gs-sup-tips-grid">
          {QUICK_TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <div key={tip.title} className="gs-sup-tip-card">
                <span className="gs-sup-tip-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{tip.title}</strong>
                  <p>{tip.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}