"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SpeechAlternative = { transcript?: string };
type SpeechResult = { 0?: SpeechAlternative };
type SpeechEvent = { results?: ArrayLike<SpeechResult> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function VoiceInputButton({
  onTranscript,
  accentColor
}: {
  onTranscript: (text: string) => void;
  accentColor: string;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    return () => {
      recognition.current?.abort();
      recognition.current = null;
    };
  }, []);

  function toggleListening() {
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }

    const speechWindow = window as SpeechWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const next = new SpeechRecognition();
    next.lang = "es-AR";
    next.interimResults = false;
    next.maxAlternatives = 1;
    next.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) onTranscript(transcript);
    };
    next.onerror = () => setListening(false);
    next.onend = () => {
      setListening(false);
      recognition.current = null;
    };
    recognition.current = next;
    setListening(true);
    try {
      next.start();
    } catch {
      setListening(false);
      recognition.current = null;
    }
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={!supported}
      aria-label={supported ? (listening ? "Detener dictado por voz" : "Dictar consulta por voz") : "El dictado por voz no está disponible en este navegador"}
      title={!supported ? "El dictado por voz no está disponible en este navegador" : listening ? "Detener dictado" : "Dictar por voz"}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-35"
      style={{
        borderColor: listening ? accentColor : "var(--apex-border)",
        color: listening ? "#ffffff" : "var(--apex-text)",
        backgroundColor: listening ? accentColor : "var(--apex-surface)"
      }}
    >
      {listening ? <MicOff size={17} /> : <Mic size={17} />}
    </button>
  );
}
