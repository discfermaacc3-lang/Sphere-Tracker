export const sphereColors = {
  health:       { color: "#22c55e", label: "Здоровье",    icon: "🫀" },
  hobby:        { color: "#a855f7", label: "Хобби",       icon: "🎨" },
  finance:      { color: "#eab308", label: "Финансы",     icon: "💰" },
  work:         { color: "#3b82f6", label: "Работа",      icon: "💼" },
  rest:         { color: "#06b6d4", label: "Отдых",       icon: "🌊" },
  relations:    { color: "#ec4899", label: "Отношения",   icon: "❤️" },
  friends:      { color: "#f97316", label: "Друзья",      icon: "👥" },
  spirituality: { color: "#8b5cf6", label: "Духовность",  icon: "✨" },
} as const;

export type SphereKey = keyof typeof sphereColors;
export const sphereKeys = Object.keys(sphereColors) as SphereKey[];
