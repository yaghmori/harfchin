/** Auth surface for app chrome (top bar + bottom nav). */
export type ShellAuthMode = "registered" | "guest" | "anonymous";

export function resolveShellAuthMode(user: {
  email: string | null;
  isGuest: boolean;
  passwordHash: string | null;
} | null): ShellAuthMode {
  if (!user) return "anonymous";
  if (user.isGuest) return "guest";
  if (user.passwordHash) return "registered";
  return "guest";
}
