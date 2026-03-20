import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SphereKey, sphereKeys } from "./sphereColors";

export type TaskCategory =
  | "Body" | "Mindset" | "Creativity" | "Hobby"
  | "Work" | "Finance" | "Mission" | "Other";

export type XpDifficulty = "easy" | "medium" | "hard" | "custom";
export type GoalLevel = "year" | "month" | "week";
export type BuiltInIdeaCategory =
  | "gift" | "hobby" | "creativity" | "travel" | "learn" | "other";
export type IdeaCategory = BuiltInIdeaCategory | string;

export type CustomIdeaCategory = {
  key: string;
  label: string;
  emoji: string;
  color: string;
};

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
  xp: number;
  targetXP: number;
  month?: number;
  year?: number;
};

export type Idea = {
  id: string;
  title: string;
  description?: string;
  category: IdeaCategory;
  createdAt: string;
  giftFor?: string[];
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
  completedAt?: string;
  recurringDays?: number[];
  recurringTemplateId?: string;
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

export type EventCategory = "birthday" | "holiday" | "deadline" | "meeting";

export const EVENT_META: Record<EventCategory, { label: string; emoji: string; color: string }> = {
  birthday: { label: "День рождения", emoji: "🎂", color: "#f43f5e" },
  holiday:  { label: "Праздник",      emoji: "✨", color: "#f59e0b" },
  deadline: { label: "Дедлайн",       emoji: "⏰", color: "#ef4444" },
  meeting:  { label: "Встреча",       emoji: "📅", color: "#6366f1" },
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  category: EventCategory;
  repeatYearly: boolean;
};

export type FocusSession = {
  id: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  xp: number;
  type?: "pomodoro" | "short" | "long" | "breath";
  label?: string;
};

export type RecurringTaskTemplate = {
  id: string;
  text: string;
  description?: string;
  category: TaskCategory;
  sphere: SphereKey;
  xp: number;
  xpDifficulty: XpDifficulty;
  days: number[];
};

export type SphereLevels = Record<SphereKey, number>;

// Per-month data bucket (priorities + satisfaction levels)
export type MonthData = {
  prioritySpheres: [SphereKey | null, SphereKey | null];
  sphereLevels: SphereLevels;
};

// Compute month key "YYYY-MM"
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

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

  // Month navigation
  currentMonth: Date;
  prevMonth: () => void;
  nextMonth: () => void;
  goToMonth: (year: number, month: number) => void;
  isArchiveMode: boolean;
  isFutureMonth: boolean;

  // Focus guard — true while timer or breath is running
  focusIsRunning: boolean;
  setFocusIsRunning: (v: boolean) => void;

  // Per-month data (lives + all historical months)
  monthData: Record<string, MonthData>;

  // Live data for currently-viewed month (loaded from monthData on navigation)
  prioritySpheres: [SphereKey | null, SphereKey | null];
  setPrioritySphere: (idx: 0 | 1, key: SphereKey | null) => void;
  spherePanelOpen: boolean;
  toggleSpherePanel: () => void;

  sphereLevels: SphereLevels;
  setSphereLevel: (key: SphereKey, value: number) => void;

  // XP — global
  totalXP: number;
  dayXP: number;
  monthXP: number;
  addXP: (amount: number) => void;
  subtractXP: (amount: number) => void;

  goals: Goal[];
  addGoal: (g: Omit<Goal, "id">) => void;
  editGoal: (id: string, updates: Partial<Omit<Goal, "id">>) => void;
  deleteGoal: (id: string) => void;
  toggleGoal: (id: string) => void;

  customIdeaCategories: CustomIdeaCategory[];
  addIdeaCategory: (cat: Omit<CustomIdeaCategory, "key">) => void;

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

  calendarEvents: CalendarEvent[];
  addCalendarEvent: (e: Omit<CalendarEvent, "id">) => void;
  deleteCalendarEvent: (id: string) => void;

  calendarDrafts: { id: string; text: string }[];
  addCalendarDraft: (text: string) => void;
  removeCalendarDraft: (id: string) => void;

  recurringTaskTemplates: RecurringTaskTemplate[];
  addRecurringTaskTemplate: (t: Omit<RecurringTaskTemplate, "id">) => void;
  deleteRecurringTaskTemplate: (id: string) => void;

  focusHistory: FocusSession[];
  addFocusSession: (s: Omit<FocusSession, "id">) => void;
};

const defaultLevels = Object.fromEntries(
  sphereKeys.map((k) => [k, 5])
) as SphereLevels;

const defaultMonthData = (): MonthData => ({
  prioritySpheres: [null, null],
  sphereLevels: { ...defaultLevels },
});

const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();
const REAL_MONTH_KEY = monthKey(new Date(CURRENT_YEAR, CURRENT_MONTH, 1));

function computeViewingState(date: Date): { isArchiveMode: boolean; isFutureMonth: boolean } {
  const vk = monthKey(date);
  return {
    isArchiveMode: vk < REAL_MONTH_KEY,
    isFutureMonth: vk > REAL_MONTH_KEY,
  };
}

// Save current month's live data to monthData and load new month's data
function switchMonth(s: Store, newDate: Date): Partial<Store> {
  const currentKey = monthKey(s.currentMonth);
  const newKey = monthKey(newDate);

  // Save current month
  const updatedMonthData: Record<string, MonthData> = {
    ...s.monthData,
    [currentKey]: {
      prioritySpheres: [...s.prioritySpheres] as [SphereKey | null, SphereKey | null],
      sphereLevels: { ...s.sphereLevels },
    },
  };

  // Load new month (or defaults if first visit)
  const loaded = updatedMonthData[newKey] ?? defaultMonthData();

  return {
    currentMonth: newDate,
    ...computeViewingState(newDate),
    monthData: updatedMonthData,
    prioritySpheres: [...loaded.prioritySpheres] as [SphereKey | null, SphereKey | null],
    sphereLevels: { ...loaded.sphereLevels },
  };
}

const defaultGoals: Goal[] = [
  {
    id: "g-y1", title: "Выстроить здоровый образ жизни",
    description: "Бег, питание, сон",
    sphere: "health", category: "Body", level: "year",
    done: false, xp: 1000, targetXP: 2000, year: CURRENT_YEAR,
  },
  {
    id: "g-y2", title: "Продвинуться по карьере",
    description: "Новый проект или повышение",
    sphere: "work", category: "Work", level: "year",
    done: false, xp: 1000, targetXP: 2000, year: CURRENT_YEAR,
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
    description: "", sphere: "health", category: "Body", level: "week",
    parentId: "g-m1", done: false, xp: 100, targetXP: 100,
    month: CURRENT_MONTH, year: CURRENT_YEAR,
  },
  {
    id: "g-w2", title: "Написать техническое задание",
    description: "", sphere: "work", category: "Work", level: "week",
    parentId: "g-m2", done: false, xp: 100, targetXP: 100,
    month: CURRENT_MONTH, year: CURRENT_YEAR,
  },
];

const defaultIdeas: Idea[] = [
  { id: "i1", title: "Поездка в Японию", description: "Сакура в апреле, Токио и Киото", category: "travel", createdAt: "2026-03-15" },
  { id: "i2", title: "Научиться рисовать акварелью", description: "Начать с простых пейзажей", category: "creativity", createdAt: "2026-03-14" },
  { id: "i3", title: "Подарить маме SPA", description: "На день рождения в мае", category: "gift", createdAt: "2026-03-13", giftFor: ["Мама"] },
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
    noDeadline: false, dueDate: TODAY, done: true, completedAt: TODAY,
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

function autoCompleteGoals(tasks: Task[], goals: Goal[], bonusXP: number): { goals: Goal[]; bonusXP: number } {
  let changed = true;
  let currentGoals = [...goals];
  let totalBonus = bonusXP;
  while (changed) {
    changed = false;
    const nextGoals = currentGoals.map((g) => {
      if (g.done) return g;
      const earned = computeGoalEarnedXP(g, currentGoals, tasks);
      if (earned >= g.targetXP) { changed = true; totalBonus += g.xp; return { ...g, done: true }; }
      return g;
    });
    currentGoals = nextGoals;
  }
  return { goals: currentGoals, bonusXP: totalBonus };
}

function autoUncompleteGoals(tasks: Task[], goals: Goal[], penaltyXP: number): { goals: Goal[]; penaltyXP: number } {
  let changed = true;
  let currentGoals = [...goals];
  let totalPenalty = penaltyXP;
  while (changed) {
    changed = false;
    const nextGoals = currentGoals.map((g) => {
      if (!g.done) return g;
      const earned = computeGoalEarnedXP(g, currentGoals, tasks);
      if (earned < g.targetXP) { changed = true; totalPenalty += g.xp; return { ...g, done: false }; }
      return g;
    });
    currentGoals = nextGoals;
  }
  return { goals: currentGoals, penaltyXP: totalPenalty };
}

// Custom localStorage storage that revives Date objects
const dateAwareStorage = {
  getItem: (name: string): string | null => {
    try {
      const str = localStorage.getItem(name);
      return str; // Return raw string — Zustand will parse it
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try { localStorage.setItem(name, value); } catch { /* quota */ }
  },
  removeItem: (name: string): void => {
    try { localStorage.removeItem(name); } catch { /* ignore */ }
  },
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      currentPage: "home",
      setCurrentPage: (page) => set({ currentPage: page }),

      currentMonth: new Date(CURRENT_YEAR, CURRENT_MONTH, 1),
      isArchiveMode: false,
      isFutureMonth: false,

      prevMonth: () =>
        set((s) => {
          const d = new Date(s.currentMonth);
          d.setMonth(d.getMonth() - 1);
          return switchMonth(s, d);
        }),

      nextMonth: () =>
        set((s) => {
          const d = new Date(s.currentMonth);
          d.setMonth(d.getMonth() + 1);
          return switchMonth(s, d);
        }),

      goToMonth: (year, month) =>
        set((s) => switchMonth(s, new Date(year, month, 1))),

      focusIsRunning: false,
      setFocusIsRunning: (v) => set({ focusIsRunning: v }),

      monthData: {},

      prioritySpheres: [null, null],
      setPrioritySphere: (idx, key) =>
        set((s) => {
          const arr: [SphereKey | null, SphereKey | null] = [...s.prioritySpheres];
          arr[idx] = key;
          const mk = monthKey(s.currentMonth);
          return {
            prioritySpheres: arr,
            monthData: {
              ...s.monthData,
              [mk]: { prioritySpheres: arr, sphereLevels: s.sphereLevels },
            },
          };
        }),
      spherePanelOpen: true,
      toggleSpherePanel: () => set((s) => ({ spherePanelOpen: !s.spherePanelOpen })),

      sphereLevels: defaultLevels,
      setSphereLevel: (key, value) =>
        set((s) => {
          const newLevels = { ...s.sphereLevels, [key]: Math.min(10, Math.max(0, value)) };
          const mk = monthKey(s.currentMonth);
          return {
            sphereLevels: newLevels,
            monthData: {
              ...s.monthData,
              [mk]: { prioritySpheres: s.prioritySpheres, sphereLevels: newLevels },
            },
          };
        }),

      totalXP: 10,
      dayXP: 10,
      monthXP: 10,
      addXP: (amount) =>
        set((s) => ({ totalXP: s.totalXP + amount, dayXP: s.dayXP + amount, monthXP: s.monthXP + amount })),
      subtractXP: (amount) =>
        set((s) => ({
          totalXP: Math.max(0, s.totalXP - amount),
          dayXP: Math.max(0, s.dayXP - amount),
          monthXP: Math.max(0, s.monthXP - amount),
        })),

      goals: defaultGoals,
      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: "g-" + Date.now() }] })),
      editGoal: (id, updates) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),
      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id && g.parentId !== id) })),
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
            monthXP: Math.max(0, s.monthXP + xpDelta),
          };
        }),

      customIdeaCategories: [],
      addIdeaCategory: (cat) =>
        set((s) => ({
          customIdeaCategories: [...s.customIdeaCategories, { ...cat, key: "custom-" + Date.now() }],
        })),

      ideas: defaultIdeas,
      addIdea: (idea) => set((s) => ({ ideas: [{ ...idea, id: "i-" + Date.now() }, ...s.ideas] })),
      editIdea: (id, updates) =>
        set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...updates } : i)) })),
      deleteIdea: (id) => set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),

      tasks: defaultTasks,
      toggleTask: (id) =>
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return {};
          const wasDone = task.done;
          const today = new Date().toISOString().slice(0, 10);
          const newTasks = s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? today : undefined } : t
          );
          let taskXPDelta = wasDone ? -task.xp : task.xp;
          let goalsDelta = 0;
          let newGoals = s.goals;
          if (!wasDone) {
            const result = autoCompleteGoals(newTasks, s.goals, 0);
            newGoals = result.goals; goalsDelta = result.bonusXP;
          } else {
            const result = autoUncompleteGoals(newTasks, s.goals, 0);
            newGoals = result.goals; goalsDelta = -result.penaltyXP;
          }
          const totalDelta = taskXPDelta + goalsDelta;
          return {
            tasks: newTasks, goals: newGoals,
            totalXP: Math.max(0, s.totalXP + totalDelta),
            dayXP: Math.max(0, s.dayXP + taskXPDelta),
            monthXP: Math.max(0, s.monthXP + taskXPDelta),
          };
        }),
      addTask: (task) =>
        set((s) => ({ tasks: [...s.tasks, { ...task, id: Date.now().toString() }] })),
      editTask: (id, updates) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      rescheduleTask: (id, newDate) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, dueDate: newDate } : t)) })),

      routineTemplates: defaultTemplates,
      addRoutineTemplate: (t) =>
        set((s) => ({ routineTemplates: [...s.routineTemplates, { ...t, id: Date.now().toString() }] })),
      editRoutineTemplate: (id, updates) =>
        set((s) => ({ routineTemplates: s.routineTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteRoutineTemplate: (id) =>
        set((s) => ({ routineTemplates: s.routineTemplates.filter((t) => t.id !== id) })),
      refreshDay: () =>
        set((s) => {
          const today = new Date().toISOString().slice(0, 10);
          const todayJsDay = new Date().getDay(); // 0=Sun
          const todayMonDay = todayJsDay === 0 ? 6 : todayJsDay - 1; // Mon=0..Sun=6
          const existingTexts = s.tasks.filter((t) => t.dueDate === today).map((t) => t.text);
          const routineTasks: Task[] = s.routineTemplates
            .filter((tmpl) => !existingTexts.includes(tmpl.text))
            .map((tmpl) => ({
              id: Date.now().toString() + Math.random(),
              text: tmpl.text, description: tmpl.description,
              category: tmpl.category, sphere: tmpl.sphere,
              type: "routine" as const, priority: false,
              xp: tmpl.xp, xpDifficulty: tmpl.xpDifficulty,
              noDeadline: false, dueDate: today, done: false,
            }));
          const recurringTasks: Task[] = s.recurringTaskTemplates
            .filter((rt) => rt.days.includes(todayMonDay) && !existingTexts.includes(rt.text))
            .map((rt) => ({
              id: Date.now().toString() + Math.random(),
              text: rt.text, description: rt.description,
              category: rt.category, sphere: rt.sphere,
              type: "routine" as const, priority: false,
              xp: rt.xp, xpDifficulty: rt.xpDifficulty,
              noDeadline: false, dueDate: today, done: false,
              recurringTemplateId: rt.id,
            }));
          const today2 = new Date().toISOString().slice(0, 10);
          return {
            tasks: [...s.tasks, ...routineTasks, ...recurringTasks],
            focusHistory: s.focusHistory.filter((fs) => fs.date === today2),
          };
        }),

      notes: defaultNotes,
      addNote: (note) =>
        set((s) => ({ notes: [{ ...note, id: "note-" + Date.now() }, ...s.notes] })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      calendarEvents: [],
      addCalendarEvent: (e) =>
        set((s) => ({ calendarEvents: [...s.calendarEvents, { ...e, id: "ev-" + Date.now() }] })),
      deleteCalendarEvent: (id) =>
        set((s) => ({ calendarEvents: s.calendarEvents.filter((e) => e.id !== id) })),

      calendarDrafts: [],
      addCalendarDraft: (text) =>
        set((s) => ({ calendarDrafts: [...s.calendarDrafts, { id: "draft-" + Date.now(), text }] })),
      removeCalendarDraft: (id) =>
        set((s) => ({ calendarDrafts: s.calendarDrafts.filter((d) => d.id !== id) })),

      recurringTaskTemplates: [],
      addRecurringTaskTemplate: (t) =>
        set((s) => ({ recurringTaskTemplates: [...s.recurringTaskTemplates, { ...t, id: "rt-" + Date.now() }] })),
      deleteRecurringTaskTemplate: (id) =>
        set((s) => ({ recurringTaskTemplates: s.recurringTaskTemplates.filter((t) => t.id !== id) })),

      focusHistory: [],
      addFocusSession: (session) =>
        set((s) => ({
          focusHistory: [
            ...s.focusHistory,
            { ...session, id: "fs-" + Date.now() + "-" + Math.random().toString(36).slice(2) },
          ],
        })),
    }),
    {
      name: "life-dashboard-v2",
      storage: dateAwareStorage,
      // Only persist data fields, skip computed/function fields
      partialize: (s) => ({
        currentPage: s.currentPage,
        currentMonth: s.currentMonth.toISOString(),
        monthData: s.monthData,
        prioritySpheres: s.prioritySpheres,
        sphereLevels: s.sphereLevels,
        totalXP: s.totalXP,
        dayXP: s.dayXP,
        monthXP: s.monthXP,
        goals: s.goals,
        customIdeaCategories: s.customIdeaCategories,
        ideas: s.ideas,
        tasks: s.tasks,
        routineTemplates: s.routineTemplates,
        notes: s.notes,
        calendarEvents: s.calendarEvents,
        calendarDrafts: s.calendarDrafts,
        recurringTaskTemplates: s.recurringTaskTemplates,
        focusHistory: s.focusHistory,
      }),
      // Revive Date objects and recompute derived state after loading
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Revive currentMonth from ISO string
        if (typeof (state.currentMonth as unknown) === "string") {
          state.currentMonth = new Date(state.currentMonth as unknown as string);
        }
        // Recompute isArchiveMode / isFutureMonth
        const { isArchiveMode, isFutureMonth } = (() => {
          const vk = monthKey(state.currentMonth);
          return { isArchiveMode: vk < REAL_MONTH_KEY, isFutureMonth: vk > REAL_MONTH_KEY };
        })();
        state.isArchiveMode = isArchiveMode;
        state.isFutureMonth = isFutureMonth;
      },
    }
  )
);
