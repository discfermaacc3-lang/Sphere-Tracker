import { useState } from "react";
import { useStore } from "@/lib/store";

export function Notes() {
  const { notes, addNote, deleteNote } = useStore();
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      <h1 className="text-xl font-semibold text-white/80 tracking-wide pt-2">Заметки</h1>

      <div className="flex gap-2">
        <textarea
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/50 transition-colors resize-none"
          placeholder="Введите заметку..."
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={() => { if (text.trim()) { addNote(text.trim()); setText(""); } }}
          className="px-5 rounded-xl text-sm font-medium self-stretch"
          style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}
        >
          +
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {notes.length === 0 && <p className="text-white/20 text-sm">Нет заметок</p>}
        {notes.map((note) => (
          <div key={note.id}
            className="group rounded-2xl border border-white/5 p-5 flex items-start gap-3 hover:border-white/10 transition-colors"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="flex-1 text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{note.text}</p>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => deleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 text-xs"
              >✕</button>
              <span className="text-[10px] text-white/20">{note.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
