import { create } from "zustand";
import { SphereKey, sphereKeys } from "./sphereColors";

export type TaskCategory =
  | "Body" | "Mindset" | "Creativity" | "Hobby"
  | "Work" | "Finance" | "Mission" | "Other";

export type XpDifficulty = "easy" | "medium" | "hard" | "custom";
export type GoalLevel = "year" | "month" | "week";

export const GOAL_XP: Record<GoalLevel, number> = {
  year: 1000,
  month: 250,
  week: 100,
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  sphere: SphereKey;
  category: TaskCategory;
  level: GoalLevel;
  parentId?: string;
  done: boolean;
  xp: number;
};

export type Task = {
  id: string;
  text: string;
  description?: string;
  category: TaskCategory;
  sphere: SphereKey;
  type: "routine" | "special";
  priority: boolean;
  xp: number;
  xpDifficulty: XpDifficulty;
  dueDate?: string;
  timeFrom?: string;
  timeTo?: string;
  goalId?: string;
  done: boolean;
  noDeadline: boolean;
};

export type RoutineTemplate = {
  id: string;
  text: string;
  description?: string;
  category: TaskCategory;
  sphere: SphereKey;
  xp: number;
  xpDifficulty: XpDifficulty;
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

  totalXP: number;
  dayXP: number;
  addXP: (amount: number) => void;
  subtractXP: (amount: number) => void;

  goals: Goal[];
  addGoal: (g: Omit<Goal, "id">) => void;
  editGoal: (id: string, updates: Partial<Omit<Goal, "id">>) => void;
  deleteGoal: (id: string) => void;
  toggleGoal: (id: string) => void;

  tasks: Task[];
  toggleTask: (id: string) => void;
  addTask: (task: Omit<Task, "id">) => void;
  editTask: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  deleteTask: (id: string) => void;
  rescheduleTask: (id: string, newDate: string) => void;

  routineTemplates: RoutineTemplate[];
  addRoutineTemplate: (t: Omit<RoutineTemplate, "id">) => void;
  editRoutineTemplate: (id: string, updates: Partial<Omit<RoutineTemplate, "id">>) => void;
  deleteRoutineTemplate: (id: string) => void;
  refreshDay: () => void;

  notes: Note[];
  addNote: (text: string) => void;
  deleteNote: (id: string) => void;
};

const defaultLevels = Object.fromEntries(
  sphereKeys.map((k) => [k, 5])
) as SphereLevels;

const TODAY = new Date().toISOString().slice(0, 10);

const defaultGoals: Goal[] = [
  {
    id: "g-y1", title: "Выстроить здоровый образ жизни", description: "Бег, питание, сон",
    sphere: "health", category: "Body", level: "year", done: false, xp: 1000,
  },
  {
    id: "g-y2", title: "Продвинуться по карьере", description: "Новый проект или повышение",
    sphere: "work", category: "Work", level: "year", done: false, xp: 1000,
  },
  {
    id: "g-m1", title: "Начать бегать 5 км", description: "Выработать утреннюю привычку",
    sphere: "health", category: "Body", level: "month", parentId: "g-y1", done: false, xp: 250,
  },
  {
    id: "g-m2", title: "Запустить новый проект", description: "MVP до конца месяца",
    sphere: "work", category: "Work", level: "month", parentId: "g-y2", done: false, xp: 250,
  },
  {
    id: "g-w1", title: "Пробежать 3 раза на этой неделе", description: "",
    sphere: "health", category: "Body", level: "week", parentId: "g-m1", done: false, xp: 100,
  },
  {
    id: "g-w2", title: "Написать техническое задание", description: "",
    sphere: "work", category: "Work", level: "week", parentId: "g-m2", done: false, xp: 100,
  },
];

const defaultTasks: Task[] = [
  {
    id: "1", text: "Утренняя зарядка", description: "",
    category: "Body", sphere: "health", type: "routine",
    priority: false, xp: 10, xpDifficulty: "easy",
    noDeadline: false, dueDate: TODAY, done: false, goalId: "g-w1",
  },
  {
    id: "2", text: "Медитация 10 мин", description: "",
    category: "Mindset", sphere: "spirituality", type: "routine",
    priority: false, xp: 10, xpDifficulty: "easy",
    noDeadline: false, dueDate: TODAY, done: true,
  },
  {
    id: "3", text: "Прочитать главу книги", description: "",
    category: "Mindset", sphere: "hobby", type: "routine",
    priority: false, xp: 10, xpDifficulty: "easy",
    noDeadline: false, dueDate: TODAY, done: false,
  },
  {
    id: "4", text: "Провести встречу с командой", description: "",
    category: "Work", sphere: "work", type: "special",
    priority: true, xp: 25, xpDifficulty: "medium",
    noDeadline: false, dueDate: TODAY, done: false, goalId: "g-w2",
  },
  {
    id: "5", text: "Позвонить другу", description: "",
    category: "Other", sphere: "friends", type: "special",
    priority: false, xp: 10, xpDifficulty: "easy",
    noDeadline: false, dueDate: TODAY, done: false,
  },
  {
    id: "6", text: "Занятие в тренажёрном зале", description: "",
    category: "Body", sphere: "health", type: "special",
    priority: true, xp: 25, xpDifficulty: "medium",
    noDeadline: false, dueDate: TODAY, done: false, goalId: "g-w1",
  },
];

const defaultTemplates: RoutineTemplate[] = [
  { id: "t1", text: "Утренняя зарядка", category: "Body", sphere: "health", xp: 10, xpDifficulty: "easy" },
  { id: "t2", text: "Медитация 10 мин", category: "Mindset", sphere: "spirituality", xp: 10, xpDifficulty: "easy" },
  { id: "t3", text: "Прочитать главу книги", category: "Mindset", sphere: "hobby", xp: 10, xpDifficulty: "easy" },
];

export const useStore = create<Store>((set, get) => ({
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
  toggleSpherePanel: () => set((s) => ({ spherePanelOpen: !s.spherePanelOpen })),

  sphereLevels: defaultLevels,
  setSphereLevel: (key, value) =>
    set((s) => ({
      sphereLevels: { ...s.sphereLevels, [key]: Math.min(10, Math.max(0, value)) },
    })),

  totalXP: 10,
  dayXP: 10,
  addXP: (amount) =>
    set((s) => ({ totalXP: s.totalXP + amount, dayXP: s.dayXP + amount })),
  subtractXP: (amount) =>
    set((s) => ({
      totalXP: Math.max(0, s.totalXP - amount),
      dayXP: Math.max(0, s.dayXP - amount),
    })),

  goals: defaultGoals,
  addGoal: (g) =>
    set((s) => ({ goals: [...s.goals, { ...g, id: "g-" + Date.now() }] })),
  editGoal: (id, updates) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  deleteGoal: (id) =>
    set((s) => ({
      goals: s.goals.filter((g) => g.id !== id && g.parentId !== id),
    })),
  toggleGoal: (id) =>
    set((s) => {
      const goal = s.goals.find((g) => g.id === id);
      if (!goal) return {};
      if (goal.done) {
        get().subtractXP(goal.xp);
      } else {
        get().addXP(goal.xp);
      }
      return { goals: s.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) };
    }),

  tasks: defaultTasks,
  toggleTask: (id) =>
    set((s) => {
      const task = s.tasks.find((t) => t.id === id);
      if (!task) return {};
      if (task.done) {
        get().subtractXP(task.xp);
      } else {
        get().addXP(task.xp);
      }
      return {
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      };
    }),
  addTask: (task) =>
    set((s) => ({
      tasks: [...s.tasks, { ...task, id: Date.now().toString() }],
    })),
  editTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  rescheduleTask: (id, newDate) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, dueDate: newDate } : t)),
    })),

  routineTemplates: defaultTemplates,
  addRoutineTemplate: (t) =>
    set((s) => ({
      routineTemplates: [...s.routineTemplates, { ...t, id: Date.now().toString() }],
    })),
  editRoutineTemplate: (id, updates) =>
    set((s) => ({
      routineTemplates: s.routineTemplates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  deleteRoutineTemplate: (id) =>
    set((s) => ({
      routineTemplates: s.routineTemplates.filter((t) => t.id !== id),
    })),
  refreshDay: () =>
    set((s) => {
      const today = new Date().toISOString().slice(0, 10);
      const existingRoutineTexts = s.tasks
        .filter((t) => t.type === "routine" && t.dueDate === today)
        .map((t) => t.text);
      const newTasks: Task[] = s.routineTemplates
        .filter((tmpl) => !existingRoutineTexts.includes(tmpl.text))
        .map((tmpl) => ({
          id: Date.now().toString() + Math.random(),
          text: tmpl.text,
          description: tmpl.description,
          category: tmpl.category,
          sphere: tmpl.sphere,
          type: "routine" as const,
          priority: false,
          xp: tmpl.xp,
          xpDifficulty: tmpl.xpDifficulty,
          noDeadline: false,
          dueDate: today,
          done: false,
        }));
      return { tasks: [...s.tasks, ...newTasks] };
    }),

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
