export const sphereColors = {
  health:       { color: "#86efac", label: "Здоровье",    icon: "🌿" },
  hobby:        { color: "#fde047", label: "Хобби",       icon: "🎨" },
  finance:      { color: "#38bdf8", label: "Финансы",     icon: "💫" },
  work:         { color: "#fca5a5", label: "Работа",      icon: "🌸" },
  rest:         { color: "#f472b6", label: "Отдых",       icon: "🌙" },
  relations:    { color: "#fdba74", label: "Отношения",   icon: "🦊" },
  friends:      { color: "#22d3ee", label: "Друзья",      icon: "⭐" },
  spirituality: { color: "#a78bfa", label: "Духовность",  icon: "✨" },
} as const;

export type SphereKey = keyof typeof sphereColors;
export const sphereKeys = Object.keys(sphereColors) as SphereKey[];
