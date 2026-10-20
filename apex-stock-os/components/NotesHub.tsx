"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  ListTodo,
  Pin,
  Plus,
  StickyNote,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  loadCloudWorkspace,
  saveCloudWorkspace
} from "@/lib/cloud-workspace";
import { businessStorageKey } from "@/lib/business-storage";
import type { LanguageCode } from "./GlobalPreferences";

export type CalendarNote = {
  id: string;
  text: string;
  date: string;
  done: boolean;
  createdAt: string;
};

type FreeNote = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  language: LanguageCode;
  locale: string;
  notes: CalendarNote[];
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  selectedNotes: CalendarNote[];
  noteDraft: string;
  setNoteDraft: (value: string) => void;
  addNote: () => void;
  toggleNote: (id: string) => void;
  removeNote: (id: string) => void;
  calendarMonth: Date;
  setCalendarMonth: (date: Date) => void;
  businessId: string | null;
  demoMode: boolean;
};

type Tab = "bloc" | "tasks" | "calendar";

const copy: Record<
  LanguageCode,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    bloc: string;
    tasks: string;
    calendar: string;
    newNote: string;
    noteTitle: string;
    noteBody: string;
    save: string;
    emptyBloc: string;
    pinned: string;
    pin: string;
    delete: string;
    remindersTitle: string;
    remindersSubtitle: string;
    reminderPlaceholder: string;
    addReminder: string;
    noReminders: string;
    compactCalendar: string;
    previousMonth: string;
    nextMonth: string;
    previousYear: string;
    nextYear: string;
    today: string;
    selectedDay: string;
  }
> = {
  es: {
    eyebrow: "Organización",
    title: "Agenda",
    subtitle:
      "Bloc libre, recordatorios y calendario en un solo lugar, sin obligarte a poner fecha a todo.",
    bloc: "Bloc",
    tasks: "Recordatorios",
    calendar: "Calendario",
    newNote: "Nueva nota",
    noteTitle: "Título",
    noteBody: "Escribí lo que necesites...",
    save: "Guardar nota",
    emptyBloc: "Todavía no hay notas libres.",
    pinned: "Fijada",
    pin: "Fijar",
    delete: "Eliminar",
    remindersTitle: "Recordatorios",
    remindersSubtitle: "Tareas y compras que sí tienen una fecha.",
    reminderPlaceholder: "Ej.: mañana comprar 20 anzuelos...",
    addReminder: "Agregar recordatorio",
    noReminders: "No hay recordatorios para esta fecha.",
    compactCalendar: "Calendario compacto",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    previousYear: "Año anterior",
    nextYear: "Año siguiente",
    today: "Hoy",
    selectedDay: "Día seleccionado"
  },
  en: {
    eyebrow: "Organization",
    title: "Agenda",
    subtitle:
      "Free-form notes, reminders and calendar in one place without forcing a date on everything.",
    bloc: "Notebook",
    tasks: "Reminders",
    calendar: "Calendar",
    newNote: "New note",
    noteTitle: "Title",
    noteBody: "Write anything you need...",
    save: "Save note",
    emptyBloc: "No free-form notes yet.",
    pinned: "Pinned",
    pin: "Pin",
    delete: "Delete",
    remindersTitle: "Reminders",
    remindersSubtitle: "Tasks and purchases that do need a date.",
    reminderPlaceholder: "Example: buy 20 hooks tomorrow...",
    addReminder: "Add reminder",
    noReminders: "No reminders for this date.",
    compactCalendar: "Compact calendar",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    previousYear: "Previous year",
    nextYear: "Next year",
    today: "Today",
    selectedDay: "Selected day"
  },
  pt: {
    eyebrow: "Organização",
    title: "Agenda",
    subtitle:
      "Bloco livre, lembretes e calendário em um só lugar sem obrigar tudo a ter data.",
    bloc: "Bloco",
    tasks: "Lembretes",
    calendar: "Calendário",
    newNote: "Nova nota",
    noteTitle: "Título",
    noteBody: "Escreva o que precisar...",
    save: "Salvar nota",
    emptyBloc: "Ainda não há notas livres.",
    pinned: "Fixada",
    pin: "Fixar",
    delete: "Excluir",
    remindersTitle: "Lembretes",
    remindersSubtitle: "Tarefas e compras que realmente têm uma data.",
    reminderPlaceholder: "Ex.: amanhã comprar 20 anzóis...",
    addReminder: "Adicionar lembrete",
    noReminders: "Não há lembretes para esta data.",
    compactCalendar: "Calendário compacto",
    previousMonth: "Mês anterior",
    nextMonth: "Próximo mês",
    previousYear: "Ano anterior",
    nextYear: "Próximo ano",
    today: "Hoje",
    selectedDay: "Dia selecionado"
  },
  fr: {
    eyebrow: "Organisation",
    title: "Agenda",
    subtitle:
      "Bloc libre, rappels et calendrier au même endroit sans imposer une date à tout.",
    bloc: "Bloc",
    tasks: "Rappels",
    calendar: "Calendrier",
    newNote: "Nouvelle note",
    noteTitle: "Titre",
    noteBody: "Écrivez ce dont vous avez besoin...",
    save: "Enregistrer",
    emptyBloc: "Aucune note libre pour le moment.",
    pinned: "Épinglée",
    pin: "Épingler",
    delete: "Supprimer",
    remindersTitle: "Rappels",
    remindersSubtitle: "Tâches et achats qui nécessitent une date.",
    reminderPlaceholder: "Ex. : acheter 20 hameçons demain...",
    addReminder: "Ajouter un rappel",
    noReminders: "Aucun rappel pour cette date.",
    compactCalendar: "Calendrier compact",
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    previousYear: "Année précédente",
    nextYear: "Année suivante",
    today: "Aujourd’hui",
    selectedDay: "Jour sélectionné"
  },
  de: {
    eyebrow: "Organisation",
    title: "Agenda",
    subtitle:
      "Freie Notizen, Erinnerungen und Kalender an einem Ort, ohne alles datieren zu müssen.",
    bloc: "Notizblock",
    tasks: "Erinnerungen",
    calendar: "Kalender",
    newNote: "Neue Notiz",
    noteTitle: "Titel",
    noteBody: "Schreib, was du brauchst...",
    save: "Notiz speichern",
    emptyBloc: "Noch keine freien Notizen.",
    pinned: "Angeheftet",
    pin: "Anheften",
    delete: "Löschen",
    remindersTitle: "Erinnerungen",
    remindersSubtitle: "Aufgaben und Einkäufe mit einem festen Datum.",
    reminderPlaceholder: "Beispiel: morgen 20 Haken kaufen...",
    addReminder: "Erinnerung hinzufügen",
    noReminders: "Keine Erinnerungen für dieses Datum.",
    compactCalendar: "Kompakter Kalender",
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    previousYear: "Vorheriges Jahr",
    nextYear: "Nächstes Jahr",
    today: "Heute",
    selectedDay: "Ausgewählter Tag"
  }
};

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NotesHub({
  language,
  locale,
  notes,
  selectedDate,
  setSelectedDate,
  selectedNotes,
  noteDraft,
  setNoteDraft,
  addNote,
  toggleNote,
  removeNote,
  calendarMonth,
  setCalendarMonth,
  businessId,
  demoMode
}: Props) {
  const t = copy[language];
  const [tab, setTab] = useState<Tab>("bloc");
  const [freeNotes, setFreeNotes] = useState<FreeNote[]>([]);
  const [freeNotesReady, setFreeNotesReady] = useState(false);
  const [freeTitle, setFreeTitle] = useState("");
  const [freeBody, setFreeBody] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let next: FreeNote[] = [];
      const storageKey = businessStorageKey(
        "global-stock-free-notes-v1",
        businessId,
        demoMode
      );

      try {
        const raw = storageKey ? localStorage.getItem(storageKey) : null;
        if (raw) {
          const parsed = JSON.parse(raw) as FreeNote[];
          if (Array.isArray(parsed)) next = parsed;
        }
      } catch {
        next = [];
      }

      if (!demoMode && businessId) {
        const cloud = await loadCloudWorkspace(businessId);
        if (Array.isArray(cloud?.state.freeNotes)) {
          next = cloud.state.freeNotes as FreeNote[];
        }
      }

      if (!cancelled) {
        setFreeNotes(next);
        setFreeNotesReady(true);
      }
    }

    setFreeNotesReady(false);
    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [businessId, demoMode]);

  useEffect(() => {
    if (!freeNotesReady) return;

    const storageKey = businessStorageKey(
      "global-stock-free-notes-v1",
      businessId,
      demoMode
    );
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(freeNotes));
    }

    if (demoMode || !businessId) return;

    const timer = window.setTimeout(() => {
      void saveCloudWorkspace(businessId, {
        freeNotes
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [businessId, demoMode, freeNotes, freeNotesReady]);

  const sortedFreeNotes = useMemo(
    () =>
      [...freeNotes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      }),
    [freeNotes]
  );

  function saveFreeNote() {
    const title = freeTitle.trim();
    const body = freeBody.trim();
    if (!title && !body) return;

    const now = new Date().toISOString();
    setFreeNotes((current) => [
      {
        id: crypto.randomUUID(),
        title: title || t.newNote,
        body,
        pinned: false,
        createdAt: now,
        updatedAt: now
      },
      ...current
    ]);
    setFreeTitle("");
    setFreeBody("");
  }

  function togglePin(id: string) {
    setFreeNotes((current) =>
      current.map((note) =>
        note.id === id
          ? {
              ...note,
              pinned: !note.pinned,
              updatedAt: new Date().toISOString()
            }
          : note
      )
    );
  }

  function deleteFreeNote(id: string) {
    setFreeNotes((current) => current.filter((note) => note.id !== id));
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8F0000]">
          {t.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          {t.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--apex-muted)]">
          {t.subtitle}
        </p>
      </section>

      <div className="inline-flex rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-1">
        {(
          [
            ["bloc", t.bloc, StickyNote],
            ["tasks", t.tasks, ListTodo],
            ["calendar", t.calendar, CalendarDays]
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={
              "flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors duration-150 " +
              (tab === id
                ? "bg-[#8F0000] text-white"
                : "text-[var(--apex-muted)]")
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

        {tab === "bloc" && (
          <div className="grid gap-3 xl:grid-cols-[360px_1fr]">
            <section className="apex-card h-fit p-4">
              <div className="flex items-center gap-2">
                <StickyNote size={17} className="text-[#8F0000]" />
                <h3 className="text-sm font-semibold">{t.newNote}</h3>
              </div>

              <input
                value={freeTitle}
                onChange={(event) => setFreeTitle(event.target.value)}
                placeholder={t.noteTitle}
                className="apex-input mt-3 px-3.5 py-2.5 text-sm"
              />
              <textarea
                value={freeBody}
                onChange={(event) => setFreeBody(event.target.value)}
                placeholder={t.noteBody}
                rows={4}
                className="apex-input mt-2 min-h-24 resize-y px-3.5 py-2.5 text-sm leading-5"
              />

              <button
                type="button"
                onClick={saveFreeNote}
                disabled={!freeTitle.trim() && !freeBody.trim()}
                className="mt-2.5 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#8F0000] px-4 text-xs font-semibold text-white disabled:opacity-35"
              >
                <Plus size={16} />
                {t.save}
              </button>
            </section>

            <section>
              {!sortedFreeNotes.length ? (
                <div className="apex-card p-6 text-sm text-[var(--apex-muted)]">
                  {t.emptyBloc}
                </div>
              ) : (
                <div className="columns-1 gap-3 md:columns-2">
                  {sortedFreeNotes.map((note) => (
                    <article
                      key={note.id}
                      className="apex-card mb-3 break-inside-avoid p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {note.pinned && (
                              <Pin
                                size={13}
                                className="shrink-0 text-[#8F0000]"
                              />
                            )}
                            <h3 className="truncate text-sm font-semibold">
                              {note.title}
                            </h3>
                          </div>
                          <p className="mt-1 text-[10px] text-[var(--apex-muted)]">
                            {new Intl.DateTimeFormat(locale, {
                              dateStyle: "medium",
                              timeStyle: "short"
                            }).format(new Date(note.updatedAt))}
                          </p>
                        </div>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => togglePin(note.id)}
                            className={
                              "grid h-8 w-8 place-items-center rounded-full border border-[var(--apex-border)] " +
                              (note.pinned ? "text-[#8F0000]" : "text-[var(--apex-muted)]")
                            }
                            aria-label={t.pin}
                          >
                            <Pin size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteFreeNote(note.id)}
                            className="grid h-8 w-8 place-items-center rounded-full border border-[var(--apex-border)] text-[var(--apex-muted)]"
                            aria-label={t.delete}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {note.body && (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--apex-muted)]">
                          {note.body}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "tasks" && (
          <div className="grid gap-3 xl:grid-cols-[360px_1fr]">
            <CompactCalendar
              t={t}
              locale={locale}
              notes={notes}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
            />

            <section className="apex-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ListTodo size={17} className="text-[#8F0000]" />
                <div>
                  <h3 className="text-sm font-semibold">{t.remindersTitle}</h3>
                  <p className="mt-1 text-[11px] text-[var(--apex-muted)]">
                    {t.remindersSubtitle}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--apex-muted)]">
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "full"
                  }).format(new Date(`${selectedDate}T12:00:00`))}
                </p>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder={t.reminderPlaceholder}
                  rows={3}
                  className="apex-input mt-3 min-h-24 resize-none px-4 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={addNote}
                  disabled={!noteDraft.trim()}
                  className="mt-3 flex min-h-11 items-center gap-2 rounded-2xl bg-[#8F0000] px-4 text-sm font-semibold text-white disabled:opacity-35"
                >
                  <Plus size={15} />
                  {t.addReminder}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {selectedNotes.length ? (
                  selectedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-start gap-3 rounded-2xl border border-[var(--apex-border)] bg-[var(--apex-surface-strong)] p-3"
                    >
                      <button
                        type="button"
                        onClick={() => toggleNote(note.id)}
                        className={
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border " +
                          (note.done
                            ? "border-[#8F0000] bg-[#8F0000] text-white"
                            : "border-[var(--apex-border)]")
                        }
                      >
                        {note.done && <Check size={13} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNote(note.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--apex-border)] text-[var(--apex-muted)] transition-colors hover:border-red-500/30 hover:text-red-500"
                        aria-label={t.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                      <p
                        className={
                          "min-w-0 flex-1 text-sm leading-5 " +
                          (note.done
                            ? "text-[var(--apex-muted)] line-through"
                            : "")
                        }
                      >
                        {note.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-sm text-[var(--apex-muted)]">
                    {t.noReminders}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {tab === "calendar" && (
          <div className="max-w-[430px]">
            <CompactCalendar
              t={t}
              locale={locale}
              notes={notes}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
              standalone
            />
          </div>
        )}
    </div>
  );
}

function CompactCalendar({
  t,
  locale,
  notes,
  selectedDate,
  setSelectedDate,
  calendarMonth,
  setCalendarMonth,
  standalone = false
}: {
  t: (typeof copy)[LanguageCode];
  locale: string;
  notes: CalendarNote[];
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  calendarMonth: Date;
  setCalendarMonth: (date: Date) => void;
  standalone?: boolean;
}) {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstOffset =
    (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];

  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
      new Date(2024, 0, 1 + index)
    )
  );

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric"
  }).format(calendarMonth);

  return (
    <section
      className={
        "apex-card h-fit p-3.5 " +
        (standalone ? "w-full" : "xl:sticky xl:top-24")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setCalendarMonth(new Date(year-1,month,1))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--apex-border)] transition-colors hover:bg-[var(--apex-bg)]"
            aria-label={t.previousYear} title={t.previousYear}><ChevronsLeft size={15}/></button>
          <button type="button" onClick={() => setCalendarMonth(new Date(year,month-1,1))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--apex-border)] transition-colors hover:bg-[var(--apex-bg)]"
            aria-label={t.previousMonth} title={t.previousMonth}><ChevronLeft size={15}/></button>
        </div>
        <div className="min-w-0 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.07em] text-[var(--apex-muted)]">{t.compactCalendar}</p>
          <h3 className="mt-1 whitespace-nowrap text-[13px] font-semibold capitalize">{monthLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setCalendarMonth(new Date(year,month+1,1))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--apex-border)] transition-colors hover:bg-[var(--apex-bg)]"
            aria-label={t.nextMonth} title={t.nextMonth}><ChevronRight size={15}/></button>
          <button type="button" onClick={() => setCalendarMonth(new Date(year+1,month,1))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--apex-border)] transition-colors hover:bg-[var(--apex-bg)]"
            aria-label={t.nextYear} title={t.nextYear}><ChevronsRight size={15}/></button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {weekdays.map((weekday, index) => (
          <div
            key={`${weekday}-${index}`}
            className="py-1 text-[9px] font-bold uppercase text-[var(--apex-muted)]"
          >
            {weekday}
          </div>
        ))}

        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const key = localDateKey(new Date(year, month, day));
          const selected = key === selectedDate;
          const noteCount = notes.filter(
            (note) => note.date === key && !note.done
          ).length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              className={
                "relative aspect-square max-h-8 rounded-lg text-[10px] font-semibold transition " +
                (selected
                  ? "bg-[#8F0000] text-white"
                  : "hover:bg-[var(--apex-surface-strong)]")
              }
            >
              {day}
              {noteCount > 0 && (
                <span
                  className={
                    "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full " +
                    (selected ? "bg-white" : "bg-[#8F0000]")
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          const today = new Date();
          setCalendarMonth(
            new Date(today.getFullYear(), today.getMonth(), 1)
          );
          setSelectedDate(localDateKey(today));
        }}
        className="mt-2.5 rounded-full border border-[var(--apex-border)] px-3 py-1.5 text-[10px] font-semibold"
      >
        {t.today}
      </button>
    </section>
  );
}
