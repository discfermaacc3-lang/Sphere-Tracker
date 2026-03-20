function pluralYears(n: number): string {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return `${n} лет`;
  if (m10 === 1) return `${n} год`;
  if (m10 >= 2 && m10 <= 4)    return `${n} года`;
  return `${n} лет`;
}

export function formatDuration(days: number): string {
  if (days <= 0)   return "";
  if (days <= 14)  return `${days} дн.`;
  if (days <= 60)  return `~${Math.round(days / 7)} нед.`;
  if (days < 335)  return `~${Math.round(days / 30)} мес.`;
  const exact = days / 365;
  const whole = Math.round(exact);
  if (Math.abs(exact - whole) < 0.12) return pluralYears(whole);
  return `~${(Math.round(exact * 10) / 10).toFixed(1)} года`;
}
