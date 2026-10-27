"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

export function VoiceOutputButton({
  text,
  accentColor = "#8f0000",
  compact = false
}: {
  text: string;
  accentColor?: string;
  compact?: boolean;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function toggleSpeech() {
    if (!supported || !text.trim()) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 5000));
    utterance.lang = "es-AR";
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={toggleSpeech}
      disabled={!supported || !text.trim()}
      aria-label={!supported ? "La lectura en voz alta no está disponible" : speaking ? "Detener lectura en voz alta" : "Leer respuesta en voz alta"}
      title={!supported ? "La lectura en voz alta no está disponible en este navegador" : speaking ? "Detener lectura" : "Leer en voz alta"}
      className={compact
        ? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10 disabled:opacity-35"
        : "inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--apex-border)] px-3 text-xs font-medium transition hover:bg-[var(--apex-surface)] disabled:opacity-35"}
      style={speaking ? { backgroundColor: accentColor, color: "#fff", borderColor: accentColor } : undefined}
    >
      {speaking ? <VolumeX size={15}/> : <Volume2 size={15}/>}
      {!compact && (speaking ? "Detener audio" : "Escuchar respuesta")}
    </button>
  );
}
