export function faDigits(value: number): string {
  return value.toLocaleString("fa-IR");
}

export function faSeconds(sec: number): string {
  return faDigits(sec);
}
