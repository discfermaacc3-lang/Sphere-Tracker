import { useState, useMemo } from "react";
import { useStore, IdeaCategory, IDEA_CATEGORIES, CustomIdeaCategory, Idea } from "@/lib/store";
import { TaskModal } from "@/components/TaskModal";

const MONTHS = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
const CAT_COLORS = ["#ec4899","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#6366f1","#14b8a6"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function inputCls(extra = "") {
  return `w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors ${extra}`;
}

export function Ideas() {
  const { ideas, addIdea, deleteIdea, addTask, customIdeaCategories, addIdeaCategory } = useStore();

  const allCategories = useMemo(
    () => [...IDEA_CATEGORIES, ...customIdeaCategories],
    [customIdeaCategories]
  );

  function getCatMeta(key: IdeaCategory) {
    return allCategories.find((c) => c.key === key) ?? { key, label: key, emoji: "💡", color: "#64748b" };
  }

  const [showForm, setShowForm]         = useState(false);
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [category, setCategory]         = useState<IdeaCategory>("other");
  const [giftFor, setGiftFor]           = useState<string[]>([]);
  const [giftInput, setGiftInput]       = useState("");
  const [filterCat, setFilterCat]       = useState<IdeaCategory | "all">("all");
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [ideaToTask, setIdeaToTask]     = useState<Idea | null>(null);

  const [showCatForm, setShowCatForm]   = useState(false);
  const [newCatLabel, setNewCatLabel]   = useState("");
  const [newCatEmoji, setNewCatEmoji]   = useState("💫");

  const TODAY = new Date().toISOString().slice(0, 10);

  function handleSave() {
    if (!title.trim()) return;
    addIdea({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      createdAt: TODAY,
      giftFor: category === "gift" && giftFor.length > 0 ? giftFor : undefined,
    });
    setTitle(""); setDescription(""); setCategory("other");
    setGiftFor([]); setGiftInput("");
    setShowForm(false);
  }

  function handleAddGiftTag() {
    const tag = giftInput.trim();
    if (tag && !giftFor.includes(tag)) setGiftFor((p) => [...p, tag]);
    setGiftInput("");
  }

  function handleSaveCategory() {
    if (!newCatLabel.trim()) return;
    const nextColor = CAT_COLORS[customIdeaCategories.length % CAT_COLORS.length];
    addIdeaCategory({ label: newCatLabel.trim(), emoji: newCatEmoji || "💫", color: nextColor });
    setNewCatLabel(""); setNewCatEmoji("💫"); setShowCatForm(false);
  }

  const allPersons = useMemo(
    () => [...new Set(ideas.filter((i) => i.category === "gift").flatMap((i) => i.giftFor ?? []))],
    [ideas]
  );

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      const catOk = filterCat === "all" || idea.category === filterCat;
      const personOk = !personFilter || (idea.giftFor ?? []).includes(personFilter);
      return catOk && personOk;
    });
  }, [ideas, filterCat, personFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10 w-full">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1
          className="text-xl font-light tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.65)", textShadow: "0 0 30px rgba(167,139,250,0.35)" }}
        >
          Идеи
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCatForm((v) => !v)}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: showCatForm ? "rgba(167,139,250,0.14)" : "rgba(255,255,255,0.05)",
              color: showCatForm ? "#a78bfa" : "rgba(255,255,255,0.40)",
              border: `1px solid ${showCatForm ? "rgba(167,139,250,0.30)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            + Своя категория
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
          >
            + Идея
          </button>
        </div>
      </div>

      {/* Custom category mini-form */}
      {showCatForm && (
        <div
          className="rounded-2xl border border-white/8 p-4 flex flex-col gap-3"
          style={{ background: "rgba(167,139,250,0.04)" }}
        >
          <p className="text-[9px] text-white/30 uppercase tracking-widest font-medium">Новая категория</p>
          <div className="flex gap-2">
            <input
              className="w-14 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/40 transition-colors text-center"
              placeholder="🌙"
              value={newCatEmoji}
              maxLength={2}
              onChange={(e) => setNewCatEmoji(e.target.value)}
            />
            <input
              className={inputCls("flex-1")}
              placeholder="Название..."
              value={newCatLabel}
              autoFocus
              onChange={(e) => setNewCatLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
            />
            <button
              onClick={handleSaveCategory}
              disabled={!newCatLabel.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 transition-all whitespace-nowrap"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
            >
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-2xl border border-white/10 p-5 flex flex-col gap-4"
          style={{ background: "rgba(255,255,255,0.025)" }}
        >
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Название</p>
            <input
              className={inputCls()}
              placeholder="О чём идея?"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSave()}
            />
          </div>

          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1.5 font-medium">Описание (опционально)</p>
            <textarea
              className={inputCls("resize-none")}
              placeholder="Подробнее..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-medium">Категория</p>
            <div className="grid grid-cols-3 gap-2">
              {allCategories.map((cat) => {
                const active = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: active ? cat.color + "20" : "rgba(255,255,255,0.04)",
                      color: active ? cat.color : "rgba(255,255,255,0.35)",
                      border: `1px solid ${active ? cat.color + "50" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gift "Кому" tags — only for gift category */}
          {category === "gift" && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-medium">Кому</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {giftFor.map((person) => (
                  <span
                    key={person}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "#f43f5e18", color: "#f43f5e", border: "1px solid #f43f5e30" }}
                  >
                    {person}
                    <button
                      onClick={() => setGiftFor((p) => p.filter((x) => x !== person))}
                      className="ml-0.5 opacity-60 hover:opacity-100"
                    >×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={inputCls("flex-1")}
                  placeholder="Имя (Мама, Муж, Подруга...)"
                  value={giftInput}
                  onChange={(e) => setGiftInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddGiftTag(); } }}
                />
                <button
                  onClick={handleAddGiftTag}
                  disabled={!giftInput.trim()}
                  className="px-3 py-2 rounded-xl text-sm disabled:opacity-30 transition-all whitespace-nowrap"
                  style={{ background: "rgba(244,63,94,0.14)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.25)" }}
                >
                  + Добавить
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setShowForm(false); setTitle(""); setDescription(""); setGiftFor([]); setGiftInput(""); }}
              className="flex-1 py-2 rounded-xl text-sm text-white/40 hover:text-white/60 border border-white/8 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 transition-all"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => { setFilterCat("all"); setPersonFilter(null); }}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: filterCat === "all" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
            color: filterCat === "all" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
            border: `1px solid ${filterCat === "all" ? "rgba(255,255,255,0.2)" : "transparent"}`,
          }}
        >
          Все · {ideas.length}
        </button>
        {allCategories.map((cat) => {
          const count = ideas.filter((i) => i.category === cat.key).length;
          if (count === 0) return null;
          const active = filterCat === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => { setFilterCat(active ? "all" : cat.key); setPersonFilter(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: active ? cat.color + "22" : "rgba(255,255,255,0.04)",
                color: active ? cat.color : "rgba(255,255,255,0.35)",
                border: `1px solid ${active ? cat.color + "45" : "transparent"}`,
              }}
            >
              {cat.emoji} {cat.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Person filter — shows when gift category active and there are persons */}
      {filterCat === "gift" && allPersons.length > 0 && (
        <div
          className="rounded-2xl border border-white/6 px-4 py-3 flex flex-col gap-2"
          style={{ background: "rgba(244,63,94,0.04)" }}
        >
          <p className="text-[9px] text-white/25 uppercase tracking-widest font-medium">Фильтр по получателю</p>
          <div className="flex gap-1.5 flex-wrap">
            {allPersons.map((person) => {
              const active = personFilter === person;
              return (
                <button
                  key={person}
                  onClick={() => setPersonFilter(active ? null : person)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: active ? "#f43f5e22" : "rgba(255,255,255,0.04)",
                    color: active ? "#f43f5e" : "rgba(255,255,255,0.35)",
                    border: `1px solid ${active ? "#f43f5e45" : "transparent"}`,
                  }}
                >
                  {person}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          className="rounded-2xl border border-white/5 p-10 text-center"
          style={{ background: "rgba(255,255,255,0.015)" }}
        >
          <p className="text-3xl mb-3">💡</p>
          <p className="text-white/30 text-sm">Нет идей в этой категории</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((idea) => {
          const cat = getCatMeta(idea.category);
          return (
            <IdeaCard
              key={idea.id}
              idea={idea}
              cat={cat}
              onDelete={() => deleteIdea(idea.id)}
              onConvert={() => setIdeaToTask(idea)}
            />
          );
        })}
      </div>

      {/* Convert idea to task modal */}
      {ideaToTask && (
        <TaskModal
          mode="task"
          initial={{
            text: ideaToTask.title,
            description: ideaToTask.description,
            type: "special",
            noDeadline: true,
            sphere: "work",
            category: "Other",
            xp: 25,
            xpDifficulty: "medium",
          }}
          onSave={(fields) => {
            addTask({ ...fields, done: false });
            setIdeaToTask(null);
          }}
          onClose={() => setIdeaToTask(null)}
        />
      )}
    </div>
  );
}

function IdeaCard({
  idea,
  cat,
  onDelete,
  onConvert,
}: {
  idea: Idea;
  cat: { key: string; label: string; emoji: string; color: string };
  onDelete: () => void;
  onConvert: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="group rounded-2xl border transition-all duration-200"
      style={{
        borderColor: cat.color + "28",
        background: `${cat.color}07`,
      }}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        {/* Category emoji */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg mt-0.5"
          style={{ background: cat.color + "18" }}
        >
          {cat.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm font-medium text-white/80 flex-1 min-w-0">{idea.title}</p>
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ color: cat.color, background: cat.color + "18" }}
            >
              {cat.label}
            </span>
          </div>

          {idea.description && (
            <button onClick={() => setExpanded(!expanded)} className="text-left w-full">
              {expanded ? (
                <p className="text-xs text-white/45 mt-1.5 leading-relaxed">{idea.description}</p>
              ) : (
                <p className="text-xs text-white/35 mt-1 truncate">{idea.description}</p>
              )}
            </button>
          )}

          {/* Gift "Кому" tags */}
          {idea.giftFor && idea.giftFor.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {idea.giftFor.map((person) => (
                <span
                  key={person}
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{ color: cat.color, background: cat.color + "18", border: `1px solid ${cat.color}30` }}
                >
                  ♥ {person}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-white/25">{formatDate(idea.createdAt)}</span>
          </div>
        </div>

        {/* Actions — show on hover */}
        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={onConvert}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap"
            style={{ background: cat.color + "18", color: cat.color }}
            title="Превратить в задачу"
          >
            ✓ В задачу
          </button>
          <button
            onClick={onDelete}
            className="px-2.5 py-1.5 rounded-lg text-[10px] text-white/20 hover:text-red-400 hover:bg-red-500/8 transition-all text-center"
          >
            удалить
          </button>
        </div>
      </div>
    </div>
  );
}
