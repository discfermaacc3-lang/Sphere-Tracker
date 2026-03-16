import { useState } from "react";
import { useStore } from "@/lib/store";

const MONTHS = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function inputCls(extra = "") {
  return `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors ${extra}`;
}

export function Notes() {
  const { notes, addNote, deleteNote } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const TODAY = new Date().toISOString().slice(0, 10);

  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const todayNotes = sorted.filter((n) => n.createdAt === TODAY);
  const olderNotes = sorted.filter((n) => n.createdAt !== TODAY);

  function handleSave() {
    if (!title.trim() && !text.trim()) return;
    addNote({
      title: title.trim() || "Без названия",
      text: text.trim(),
      createdAt: TODAY,
    });
    setTitle("");
    setText("");
    setShowForm(false);
  }

  function handleCancel() {
    setTitle("");
    setText("");
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-semibold text-white/80 tracking-wide">Заметки</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
        >
          + Новая заметка
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-2xl border border-indigo-500/20 p-5 flex flex-col gap-4 transition-all"
          style={{ background: "rgba(99,102,241,0.05)" }}
        >
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Название</p>
            <input
              className={inputCls("text-base font-medium")}
              placeholder="Название заметки..."
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSave()}
            />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Содержание</p>
            <textarea
              className={inputCls("resize-none leading-relaxed")}
              placeholder="Что у тебя на уме?..."
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 rounded-xl text-sm text-white/40 hover:text-white/60 border border-white/8 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() && !text.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 && !showForm && (
        <div
          className="rounded-2xl border border-white/5 p-10 text-center"
          style={{ background: "rgba(255,255,255,0.015)" }}
        >
          <p className="text-3xl mb-3">📝</p>
          <p className="text-white/30 text-sm">Нет заметок</p>
          <p className="text-white/15 text-xs mt-1">Нажми «+ Новая заметка»</p>
        </div>
      )}

      {/* Today's notes */}
      {todayNotes.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Сегодня</p>
          {todayNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              expanded={expandedId === note.id}
              onToggle={() => setExpandedId(expandedId === note.id ? null : note.id)}
              onDelete={() => deleteNote(note.id)}
              isToday
            />
          ))}
        </section>
      )}

      {/* Older notes */}
      {olderNotes.length > 0 && (
        <section className="flex flex-col gap-3">
          {todayNotes.length > 0 && (
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Ранее</p>
          )}
          {olderNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              expanded={expandedId === note.id}
              onToggle={() => setExpandedId(expandedId === note.id ? null : note.id)}
              onDelete={() => deleteNote(note.id)}
              isToday={false}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function NoteCard({
  note,
  expanded,
  onToggle,
  onDelete,
  isToday,
}: {
  note: ReturnType<typeof useStore>["notes"][0];
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isToday: boolean;
}) {
  return (
    <div
      className="group rounded-2xl border transition-all duration-200 overflow-hidden"
      style={{
        borderColor: isToday ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
        background: isToday ? "rgba(99,102,241,0.04)" : "rgba(255,255,255,0.02)",
      }}
    >
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        onClick={onToggle}
      >
        {/* Dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: isToday ? "#6366f1" : "rgba(255,255,255,0.15)",
            boxShadow: isToday ? "0 0 8px #6366f160" : "none",
          }}
        />

        {/* Title + date */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{note.title}</p>
          {!expanded && note.text && (
            <p className="text-xs text-white/35 truncate mt-0.5">{note.text}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {isToday && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#6366f118", color: "#818cf8" }}>
              Сегодня
            </span>
          )}
          <span className="text-[10px] text-white/25">{formatDate(note.createdAt)}</span>
          <span className="text-white/25 text-xs transition-transform duration-200"
            style={{ display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▾
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && note.text && (
        <div className="px-5 pb-4 border-t border-white/5">
          <p className="text-sm text-white/55 leading-relaxed whitespace-pre-wrap pt-3">{note.text}</p>
        </div>
      )}

      {/* Delete on hover */}
      <div className="flex justify-end px-5 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-[10px] text-white/20 hover:text-red-400 transition-colors"
        >
          удалить
        </button>
      </div>
    </div>
  );
}
