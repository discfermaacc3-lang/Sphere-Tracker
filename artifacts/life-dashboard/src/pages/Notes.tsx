import { useState } from "react";
import { useStore, NoteCategory } from "@/lib/store";

const LAV     = "167,139,250";
const LAV_HEX = "#a78bfa";

const MONTHS = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const EMOJI_PALETTE = [
  "📝","💡","🌟","🔥","💜","🎯","✨","🌙","🎨","📚","🎵","🌸","🍀","⚡","🦋",
  "🌺","💫","🎪","🧠","❤️","🌊","🌈","🏆","🎭","🔮","🌻","🐝","🦊","🌴","🍃",
];

export function Notes() {
  const { notes, addNote, editNote, deleteNote, noteCategories, addNoteCategory, deleteNoteCategory } = useStore();

  const [showForm, setShowForm]             = useState(false);
  const [title, setTitle]                   = useState("");
  const [text, setText]                     = useState("");
  const [noteCategory, setNoteCategory]     = useState("");
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [filterCatId, setFilterCatId]       = useState<string | null>(null);

  const [showCatForm, setShowCatForm]       = useState(false);
  const [catName, setCatName]               = useState("");
  const [catEmoji, setCatEmoji]             = useState("📝");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const TODAY = new Date().toISOString().slice(0, 10);

  const allSorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = filterCatId
    ? allSorted.filter(n => n.categoryId === filterCatId)
    : allSorted;

  const todayNotes = filtered.filter(n => n.createdAt === TODAY);
  const olderNotes = filtered.filter(n => n.createdAt !== TODAY);

  function handleSave() {
    if (!title.trim() && !text.trim()) return;
    addNote({
      title: title.trim() || "Без названия",
      text: text.trim(),
      createdAt: TODAY,
      categoryId: noteCategory || undefined,
    });
    setTitle(""); setText(""); setNoteCategory(""); setShowForm(false);
  }

  function handleSaveCategory() {
    if (!catName.trim()) return;
    addNoteCategory({ name: catName.trim(), emoji: catEmoji });
    setCatName(""); setCatEmoji("📝"); setShowCatForm(false); setShowEmojiPicker(false);
  }

  const glassCard = {
    background: "rgba(255,255,255,0.025)",
    border: `1px solid rgba(${LAV},0.12)`,
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10 w-full">

      {/* ══ Header ══ */}
      <div className="flex items-center justify-between pt-2">
        <h1
          className="text-xl font-light tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.65)", textShadow: `0 0 30px rgba(${LAV},0.35)` }}
        >
          Заметки
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCatForm(v => !v); setShowForm(false); }}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: `rgba(${LAV},0.08)`,
              color: `rgba(${LAV},0.70)`,
              border: `1px solid rgba(${LAV},0.18)`,
            }}
          >
            + Категория
          </button>
          <button
            onClick={() => { setShowForm(true); setShowCatForm(false); }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: `linear-gradient(135deg, rgba(${LAV},0.35), rgba(139,92,246,0.40))`,
              color: "white",
              border: `1px solid rgba(${LAV},0.30)`,
              boxShadow: `0 0 16px rgba(${LAV},0.18)`,
            }}
          >
            + Новая заметка
          </button>
        </div>
      </div>

      {/* ══ Category filter bar ══ */}
      {noteCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterCatId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: filterCatId === null ? `rgba(${LAV},0.20)` : "rgba(255,255,255,0.04)",
              color: filterCatId === null ? LAV_HEX : "rgba(255,255,255,0.40)",
              border: filterCatId === null ? `1px solid rgba(${LAV},0.35)` : "1px solid rgba(255,255,255,0.07)",
              textShadow: filterCatId === null ? `0 0 8px rgba(${LAV},0.50)` : "none",
            }}
          >
            ✦ Все
          </button>
          {noteCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCatId(filterCatId === cat.id ? null : cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all group"
              style={{
                background: filterCatId === cat.id ? `rgba(${LAV},0.20)` : "rgba(255,255,255,0.04)",
                color: filterCatId === cat.id ? LAV_HEX : "rgba(255,255,255,0.40)",
                border: filterCatId === cat.id ? `1px solid rgba(${LAV},0.35)` : "1px solid rgba(255,255,255,0.07)",
                textShadow: filterCatId === cat.id ? `0 0 8px rgba(${LAV},0.50)` : "none",
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
              <span
                onClick={e => { e.stopPropagation(); deleteNoteCategory(cat.id); if (filterCatId === cat.id) setFilterCatId(null); }}
                className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all text-[10px] ml-0.5"
              >✕</span>
            </button>
          ))}
        </div>
      )}

      {/* ══ Create category form ══ */}
      {showCatForm && (
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={glassCard}
        >
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: `rgba(${LAV},0.55)` }}>
            Новая категория
          </p>
          <div className="flex gap-3 items-start">
            {/* Emoji picker */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(v => !v)}
                className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                style={{
                  background: `rgba(${LAV},0.10)`,
                  border: `1px solid rgba(${LAV},0.22)`,
                }}
              >
                {catEmoji}
              </button>
              {showEmojiPicker && (
                <div
                  className="absolute top-12 left-0 z-20 rounded-2xl p-3 grid grid-cols-6 gap-1.5"
                  style={{
                    background: "rgba(10,8,25,0.98)",
                    border: `1px solid rgba(${LAV},0.18)`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.60)`,
                    minWidth: "180px",
                  }}
                >
                  {EMOJI_PALETTE.map(e => (
                    <button
                      key={e}
                      onClick={() => { setCatEmoji(e); setShowEmojiPicker(false); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all hover:bg-white/8"
                    >{e}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Name input */}
            <div className="flex-1 flex gap-2">
              <input
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 placeholder-white/20 outline-none focus:border-purple-400/40 transition-colors"
                placeholder="Название категории…"
                value={catName}
                autoFocus
                onChange={e => setCatName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveCategory(); if (e.key === "Escape") { setShowCatForm(false); setShowEmojiPicker(false); } }}
              />
              <button
                onClick={handleSaveCategory}
                disabled={!catName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                style={{
                  background: `rgba(${LAV},0.20)`,
                  color: LAV_HEX,
                  border: `1px solid rgba(${LAV},0.30)`,
                }}
              >Создать</button>
              <button
                onClick={() => { setShowCatForm(false); setShowEmojiPicker(false); }}
                className="px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 border border-white/8 transition-colors"
              >Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Create note form ══ */}
      {showForm && (
        <div
          className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{ background: `rgba(${LAV},0.035)`, borderColor: `rgba(${LAV},0.18)` }}
        >
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Название</p>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-white/80 placeholder-white/20 outline-none focus:border-purple-400/40 transition-colors"
              placeholder="Название заметки…"
              value={title}
              autoFocus
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSave()}
            />
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Содержание</p>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-purple-400/40 transition-colors resize-none leading-relaxed"
              placeholder="Что у тебя на уме?…"
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>

          {/* Category selector */}
          {noteCategories.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-medium">Категория</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setNoteCategory("")}
                  className="px-3 py-1.5 rounded-xl text-xs transition-all"
                  style={{
                    background: noteCategory === "" ? `rgba(${LAV},0.18)` : "rgba(255,255,255,0.04)",
                    color: noteCategory === "" ? LAV_HEX : "rgba(255,255,255,0.35)",
                    border: noteCategory === "" ? `1px solid rgba(${LAV},0.32)` : "1px solid rgba(255,255,255,0.07)",
                  }}
                >Без категории</button>
                {noteCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setNoteCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                    style={{
                      background: noteCategory === cat.id ? `rgba(${LAV},0.18)` : "rgba(255,255,255,0.04)",
                      color: noteCategory === cat.id ? LAV_HEX : "rgba(255,255,255,0.35)",
                      border: noteCategory === cat.id ? `1px solid rgba(${LAV},0.32)` : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setTitle(""); setText(""); setNoteCategory(""); setShowForm(false); }}
              className="flex-1 py-2 rounded-xl text-sm text-white/40 hover:text-white/60 border border-white/8 transition-colors"
            >Отмена</button>
            <button
              onClick={handleSave}
              disabled={!title.trim() && !text.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{
                background: `linear-gradient(135deg, rgba(${LAV},0.35), rgba(139,92,246,0.40))`,
                color: "white",
                border: `1px solid rgba(${LAV},0.28)`,
              }}
            >Сохранить</button>
          </div>
        </div>
      )}

      {/* ══ Empty state ══ */}
      {notes.length === 0 && !showForm && (
        <div
          className="rounded-2xl border border-white/5 p-10 text-center"
          style={{ background: "rgba(255,255,255,0.012)" }}
        >
          <p className="text-4xl mb-3">📝</p>
          <p className="text-white/30 text-sm">Нет заметок</p>
          <p className="text-white/15 text-xs mt-1">Нажми «+ Новая заметка»</p>
        </div>
      )}

      {/* ══ Empty filtered state ══ */}
      {notes.length > 0 && filtered.length === 0 && (
        <div
          className="rounded-2xl border border-white/5 p-8 text-center"
          style={{ background: "rgba(255,255,255,0.012)" }}
        >
          <p className="text-2xl mb-2">🔍</p>
          <p className="text-white/30 text-sm">Нет заметок в этой категории</p>
        </div>
      )}

      {/* ══ Today's notes ══ */}
      {todayNotes.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Сегодня</p>
          {todayNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              category={noteCategories.find(c => c.id === note.categoryId)}
              categories={noteCategories}
              expanded={expandedId === note.id}
              onToggle={() => setExpandedId(expandedId === note.id ? null : note.id)}
              onDelete={() => deleteNote(note.id)}
              onChangeCategory={catId => editNote(note.id, { categoryId: catId || undefined })}
              isToday
            />
          ))}
        </section>
      )}

      {/* ══ Older notes ══ */}
      {olderNotes.length > 0 && (
        <section className="flex flex-col gap-3">
          {todayNotes.length > 0 && (
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Ранее</p>
          )}
          {olderNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              category={noteCategories.find(c => c.id === note.categoryId)}
              categories={noteCategories}
              expanded={expandedId === note.id}
              onToggle={() => setExpandedId(expandedId === note.id ? null : note.id)}
              onDelete={() => deleteNote(note.id)}
              onChangeCategory={catId => editNote(note.id, { categoryId: catId || undefined })}
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
  category,
  categories,
  expanded,
  onToggle,
  onDelete,
  onChangeCategory,
  isToday,
}: {
  note: ReturnType<typeof useStore>["notes"][0];
  category: NoteCategory | undefined;
  categories: NoteCategory[];
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onChangeCategory: (id: string) => void;
  isToday: boolean;
}) {
  const [showCatMenu, setShowCatMenu] = useState(false);
  const LAV = "167,139,250";
  const LAV_HEX = "#a78bfa";

  return (
    <div
      className="group rounded-2xl border transition-all duration-200 overflow-hidden"
      style={{
        borderColor: category
          ? `rgba(${LAV},0.20)`
          : isToday
          ? "rgba(99,102,241,0.18)"
          : "rgba(255,255,255,0.05)",
        background: category
          ? `rgba(${LAV},0.03)`
          : isToday
          ? "rgba(99,102,241,0.04)"
          : "rgba(255,255,255,0.018)",
      }}
    >
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        onClick={onToggle}
      >
        {/* Dot / category emoji */}
        {category ? (
          <span className="text-base flex-shrink-0">{category.emoji}</span>
        ) : (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: isToday ? "#6366f1" : "rgba(255,255,255,0.15)",
              boxShadow: isToday ? "0 0 8px #6366f160" : "none",
            }}
          />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{note.title}</p>
          {!expanded && note.text && (
            <p className="text-xs text-white/35 truncate mt-0.5">{note.text}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {category && (
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `rgba(${LAV},0.12)`, color: LAV_HEX }}
            >
              {category.name}
            </span>
          )}
          {isToday && !category && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#6366f118", color: "#818cf8" }}>
              Сегодня
            </span>
          )}
          <span className="text-[10px] text-white/25">{formatDate(note.createdAt)}</span>
          <span className="text-white/25 text-xs transition-transform duration-200"
            style={{ display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
        </div>
      </button>

      {expanded && note.text && (
        <div className="px-5 pb-4 border-t border-white/5">
          <p className="text-sm text-white/55 leading-relaxed whitespace-pre-wrap pt-3">{note.text}</p>
        </div>
      )}

      <div className="flex items-center justify-between px-5 pb-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Category change */}
        {categories.length > 0 && (
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowCatMenu(v => !v); }}
              className="text-[10px] text-white/20 hover:text-white/50 transition-colors"
            >
              {category ? `${category.emoji} ${category.name}` : "📂 категория"}
            </button>
            {showCatMenu && (
              <div
                className="absolute bottom-6 left-0 z-20 rounded-xl p-2 flex flex-col gap-1 min-w-[140px]"
                style={{
                  background: "rgba(10,8,25,0.97)",
                  border: `1px solid rgba(${LAV},0.15)`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.60)",
                }}
              >
                <button
                  onClick={e => { e.stopPropagation(); onChangeCategory(""); setShowCatMenu(false); }}
                  className="text-left px-2 py-1 rounded-lg text-[11px] text-white/35 hover:text-white/60 hover:bg-white/5 transition-all"
                >Без категории</button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={e => { e.stopPropagation(); onChangeCategory(c.id); setShowCatMenu(false); }}
                    className="flex items-center gap-1.5 text-left px-2 py-1 rounded-lg text-[11px] text-white/55 hover:text-white/80 hover:bg-white/5 transition-all"
                  >
                    <span>{c.emoji}</span><span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-[10px] text-white/20 hover:text-red-400 transition-colors ml-auto"
        >удалить</button>
      </div>
    </div>
  );
}
