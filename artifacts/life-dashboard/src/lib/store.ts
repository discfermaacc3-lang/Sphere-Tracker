import { create } from "zustand";
import { SphereKey, sphereKeys } from "./sphereColors";

export type TaskCategory =
  | "Body" | "Mindset" | "Creativity" | "Hobby"
  | "Work" | "Finance" | "Mission" | "Other";

export type XpDifficulty = "easy" | "medium" | "hard" | "custom";
export type GoalLevel = "year" | "month" | "week";
export type IdeaCategory =
  | "gift" | "hobby" | "creativity" | "travel" | "learn" | "other";

export const GOAL_XP: Record<GoalLevel, number> = {
  year: 1000,
  month: 250,
  week: 100,
};

export const GOAL_TARGET_XP_DEFAULT: Record<GoalLevel, number> = {
  year: 2000,
  month: 500,
  week: 100,
};

export const IDEA_CATEGORIES: { key: IdeaCategory; label: string; emoji: string; color: string }[] = [
  { key: "gift",       label: "Подарок",     emoji: "🎁", color: "#f43f5e" },
  { key: "hobby",      label: "Хобби",       emoji: "🎯", color: "#f59e0b" },
  { key: "creativity", label: "Творчество",  emoji: "🎨", color: "#a855f7" },
  { key: "travel",     label: "Путешествия", emoji: "✈️", color: "#06b6d4" },
  { key: "learn",      label: "Изучить",     emoji: "📚", color: "#3b82f6" },
  { key: "other",      label: "Другое",      emoji: "💡", color: "#64748b" },
];

export type Goal = {
  id: string;
  title: string;
  description?: string;
  sphere: SphereKey;
  category: TaskCategory;
  level: GoalLevel;
  parentId?: string;
  done: boolean;
  xp: number;        // bonus XP awarded when goal auto-completes
  targetXP: number;  // XP needed to auto-complete
  month?: number;    // 0-11, for month-level goals
  year?: number;     // full year, e.g. 2026
};

export type Idea = {
  id: string;
  title: string;
  description?: string;
  category: IdeaCategory;
  createdAt: string;
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
  title: string;
  text: string;
  createdAt: string;
};

export type SphereLevels = Record<SphereKey, number>;

// Compute earned XP for a goal from tasks + completed children
export function computeGoalEarnedXP(
  goal: Goal,
  allGoals: Goal[],
  allTasks: Task[]
): number {
  const directXP = allTasks
    .filter((t) => t.goalId === goal.id && t.done)
    .reduce((s, t) => s + t.xp, 0);

  const childXP = allGoals
    .filter((g) => g.parentId === goal.id && g.done)
    .reduce((s, g) => s + g.xp, 0);

  return directXP + childXP;
}

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

  ideas: Idea[];
  addIdea: (idea: Omit<Idea, "id">) => void;
  editIdea: (id: string, updates: Partial<Omit<Idea, "id">>) => void;
  deleteIdea: (id: string) => void;

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
  addNote: (note: Omit<Note, "id">) => void;
  deleteNote: (id: string) => void;
};

const defaultLevels = Object.fromEntries(
  sphereKeys.map((k) => [k, 5])
) as SphereLevels;

const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();

const defaultGoals: Goal[] = [
  {
    id: "g-y1", title: "Выстроить здоровый образ жизни",
    description: "Бег, питание, сон",
    sphere: "health", category: "Body", level: "year",
    done: false, xp: 1000, targetXP: 2000,
    year: CURRENT_YEAR,
  },
  {
    id: "g-y2", title: "Продвинуться по карьере",
    description: "Новый проект или повышение",
    sphere: "work", category: "Work", level: "year",
    done: false, xp: 1000, targetXP: 2000,
    year: CURRENT_YEAR,
  },
  {
    id: "g-m1", title: "Начать бегать 5 км",
    description: "Выработать утреннюю привычку",
    sphere: "health", category: "Body", level: "month",
    parentId: "g-y1", done: false, xp: 250, targetXP: 500,
    month: CURRENT_MONTH, year: CURRENT_YEAR,
  },
  {
    id: "g-m2", title: "Запустить новый проект",
    description: "MVP до конца месяца",
    sphere: "work", category: "Work", level: "month",
    parentId: "g-y2", done: false, xp: 250, targetXP: 500,
    month: CURRENT_MONTH, year: CURRENT_YEAR,
  },
  {
    id: "g-w1", title: "Пробежать 3 раза на этой неделе",
    description: "",
    sphere: "health", category: "Body", level: "week",
    parentId: "g-m1", done: false, xp: 100, targetXP: 100,
    month: CURRENT_MONTH, year: CURRENT_YEAR,
  },
  {
    id: "g-w2", title: "Написать техническое задание",
    description: "",
    sphere: "work", category: "Work", level: "week",
    parentId: "g-m2", done: false, xp: 100, targetXP: 100,
    month: CURRENT_MONTH, year: CURRENT_YEAR,
  },
];

const defaultIdeas: Idea[] = [
  { id: "i1", title: "Поездка в Японию", description: "Сакура в апреле, Токио и Киото", category: "travel", createdAt: "2026-03-15" },
  { id: "i2", title: "Научиться рисовать акварелью", description: "Начать с простых пейзажей", category: "creativity", createdAt: "2026-03-14" },
  { id: "i3", title: "Подарить маме SPA", description: "На день рождения в мае", category: "gift", createdAt: "2026-03-13" },
  { id: "i4", title: "Курс по машинному обучению", description: "Fast.ai или Coursera", category: "learn", createdAt: "2026-03-12" },
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

const defaultNotes: Note[] = [
  { id: "n1", title: "Фокус на главном", text: "Сегодня важный день — сосредоточиться на главном.", createdAt: TODAY },
  { id: "n2", title: "Идея проекта", text: "Нужно записать идею про автоматизацию утра.", createdAt: "2026-03-15" },
];

// Auto-complete goals cascade: after tasks change, recheck goals
function autoCompleteGoals(
  tasks: Task[],
  goals: Goal[],
  bonusXP: number
): { goals: Goal[]; bonusXP: number } {
  let changed = true;
  let currentGoals = [...goals];
  let totalBonus = bonusXP;

  while (changed) {
    changed = false;
    const nextGoals = currentGoals.map((g) => {
      if (g.done) return g;
      const earned = computeGoalEarnedXP(g, currentGoals, tasks);
      if (earned >= g.targetXP) {
        changed = true;
        totalBonus += g.xp;
        return { ...g, done: true };
      }
      return g;
    });
    currentGoals = nextGoals;
  }

  return { goals: currentGoals, bonusXP: totalBonus };
}

// Reverse: when task is un-done, un-complete goals that no longer have enough XP
function autoUncompleteGoals(
  tasks: Task[],
  goals: Goal[],
  penaltyXP: number
): { goals: Goal[]; penaltyXP: number } {
  let changed = true;
  let currentGoals = [...goals];
  let totalPenalty = penaltyXP;

  while (changed) {
    changed = false;
    const nextGoals = currentGoals.map((g) => {
      if (!g.done) return g;
      const earned = computeGoalEarnedXP(g, currentGoals, tasks);
      if (earned < g.targetXP) {
        changed = true;
        totalPenalty += g.xp;
        return { ...g, done: false };
      }
      return g;
    });
    currentGoals = nextGoals;
  }

  return { goals: currentGoals, penaltyXP: totalPenalty };
}

export const useStore = create<Store>((set, get) => ({
  currentPage: "home",
  setCurrentPage: (page) => set({ currentPage: page }),

  currentMonth: new Date(CURRENT_YEAR, CURRENT_MONTH, 1),
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
      const newDone = !goal.done;
      const xpDelta = newDone ? goal.xp : -goal.xp;
      return {
        goals: s.goals.map((g) => (g.id === id ? { ...g, done: newDone } : g)),
        totalXP: Math.max(0, s.totalXP + xpDelta),
        dayXP: Math.max(0, s.dayXP + xpDelta),
      };
    }),

  ideas: defaultIdeas,
  addIdea: (idea) =>
    set((s) => ({ ideas: [{ ...idea, id: "i-" + Date.now() }, ...s.ideas] })),
  editIdea: (id, updates) =>
    set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...updates } : i)) })),
  deleteIdea: (id) =>
    set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),

  tasks: defaultTasks,
  toggleTask: (id) =>
    set((s) => {
      const task = s.tasks.find((t) => t.id === id);
      if (!task) return {};
      const wasDone = task.done;
      const newTasks = s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));

      let taskXPDelta = wasDone ? -task.xp : task.xp;
      let goalsDelta = 0;
      let newGoals = s.goals;

      if (!wasDone) {
        // Task just completed — auto-complete any goals that now have enough XP
        const result = autoCompleteGoals(newTasks, s.goals, 0);
        newGoals = result.goals;
        goalsDelta = result.bonusXP;
      } else {
        // Task un-completed — un-complete any goals that no longer have enough XP
        const result = autoUncompleteGoals(newTasks, s.goals, 0);
        newGoals = result.goals;
        goalsDelta = -result.penaltyXP;
      }

      const totalDelta = taskXPDelta + goalsDelta;
      return {
        tasks: newTasks,
        goals: newGoals,
        totalXP: Math.max(0, s.totalXP + totalDelta),
        dayXP: Math.max(0, s.dayXP + taskXPDelta),
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

  notes: defaultNotes,
  addNote: (note) =>
    set((s) => ({
      notes: [{ ...note, id: "note-" + Date.now() }, ...s.notes],
    })),
  deleteNote: (id) =>
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
}));
