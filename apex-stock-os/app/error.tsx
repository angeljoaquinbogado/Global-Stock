"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const copy = {
  es: {
    title: "Algo salió mal",
    body: "Global Stock encontró un error inesperado. Podés intentar cargar esta sección nuevamente.",
    retry: "Reintentar"
  },
  en: {
    title: "Something went wrong",
    body: "Global Stock hit an unexpected error. You can try loading this section again.",
    retry: "Try again"
  },
  pt: {
    title: "Algo deu errado",
    body: "O Global Stock encontrou um erro inesperado. Tente carregar esta seção novamente.",
    retry: "Tentar novamente"
  },
  fr: {
    title: "Une erreur est survenue",
    body: "Global Stock a rencontré une erreur inattendue. Vous pouvez réessayer de charger cette section.",
    retry: "Réessayer"
  },
  de: {
    title: "Etwas ist schiefgelaufen",
    body: "Global Stock ist auf einen unerwarteten Fehler gestoßen. Du kannst diesen Bereich erneut laden.",
    retry: "Erneut versuchen"
  }
} as const;

type Lang = keyof typeof copy;

export default function ErrorBoundary({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [language, setLanguage] = useState<Lang>("es");

  useEffect(() => {
    const lang = document.documentElement.lang.slice(0, 2) as Lang;
    if (lang in copy) setLanguage(lang);
  }, []);

  const t = copy[language];

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--apex-bg)] p-6 text-[var(--apex-text)]">
      <section className="apex-card w-full max-w-md p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#8F0000]/10 text-[#8F0000]">
          <AlertTriangle size={22} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
          {t.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--apex-muted)]">
          {t.body}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#8F0000] px-5 text-sm font-semibold text-white"
        >
          <RefreshCw size={16} />
          {t.retry}
        </button>
      </section>
    </main>
  );
}
