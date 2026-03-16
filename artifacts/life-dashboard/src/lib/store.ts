import { create } from "zustand";
import { SphereKey, sphereKeys } from "./sphereColors";

export type Task = {
  id: string;
  text: string;
  sphere: SphereKey;
  type: "routine" | "special";
  done: boolean;
};

export type Note = {
  id: string;
  text: string;
  createdAt: string;
};

export type SphereLevels = Record<SphereKey, number>;

type Store = {
  currentPage: string;
  setCurrentPage: (page: string) => void;

  currentMonth: Date;
  prevMonth: () => void;
  nextMonth: () => void;

  prioritySpheres: [SphereKey | null, SphereKey | null];
  setPrioritySphere: (idx: 0 | 1, key: SphereKey | null) => void;
  spherePanelOpen: boolean;
  toggleSpherePanel: () => void;

  sphereLevels: SphereLevels;
  setSphereLevel: (key: SphereKey, value: number) => void;

  tasks: Task[];
  toggleTask: (id: string) => void;
  addTask: (task: Omit<Task, "id">) => void;

  notes: Note[];
  addNote: (text: string) => void;
  deleteNote: (id: string) => void;
};

const defaultLevels = Object.fromEntries(
  sphereKeys.map((k) => [k, 5])
) as SphereLevels;

export const useStore = create<Store>((set) => ({
  currentPage: "home",
  setCurrentPage: (page) => set({ currentPage: page }),

  currentMonth: new Date(2026, 2, 1),
  prevMonth: () =>
    set((s) => {
      const d = new Date(s.currentMonth);
      d.setMonth(d.getMonth() - 1);
      return { currentMonth: d };
    }),
  nextMonth: () =>
    set((s) => {
      const d = new Date(s.currentMonth);
      d.setMonth(d.getMonth() + 1);
      return { currentMonth: d };
    }),

  prioritySpheres: [null, null],
  setPrioritySphere: (idx, key) =>
    set((s) => {
      const arr: [SphereKey | null, SphereKey | null] = [...s.prioritySpheres];
      arr[idx] = key;
      return { prioritySpheres: arr };
    }),
  spherePanelOpen: true,
  toggleSpherePanel: () =>
    set((s) => ({ spherePanelOpen: !s.spherePanelOpen })),

  sphereLevels: defaultLevels,
  setSphereLevel: (key, value) =>
    set((s) => ({
      sphereLevels: { ...s.sphereLevels, [key]: Math.min(10, Math.max(0, value)) },
    })),

  tasks: [
    { id: "1", text: "Утренняя зарядка", sphere: "health", type: "routine", done: false },
    { id: "2", text: "Медитация 10 мин", sphere: "spirituality", type: "routine", done: true },
    { id: "3", text: "Прочитать главу книги", sphere: "hobby", type: "routine", done: false },
    { id: "4", text: "Провести встречу с командой", sphere: "work", type: "special", done: false },
    { id: "5", text: "Позвонить другу", sphere: "friends", type: "special", done: false },
    { id: "6", text: "Занятие в тренажёрном зале", sphere: "health", type: "special", done: false },
  ],
  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })),
  addTask: (task) =>
    set((s) => ({
      tasks: [...s.tasks, { ...task, id: Date.now().toString() }],
    })),

  notes: [
    { id: "1", text: "Сегодня важный день — сосредоточиться на главном.", createdAt: "2026-03-16" },
  ],
  addNote: (text) =>
    set((s) => ({
      notes: [
        ...s.notes,
        { id: Date.now().toString(), text, createdAt: new Date().toISOString().slice(0, 10) },
      ],
    })),
  deleteNote: (id) =>
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
}));
