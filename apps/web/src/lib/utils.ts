export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Guards a `?next=` redirect target against open-redirect abuse (e.g.
 * `?next=https://evil.example` or `?next=//evil.example`) by only allowing
 * same-origin, absolute-path values.
 */
export function sanitizeNextPath(next: string | undefined | null): string | undefined {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return undefined;
  }
  return next;
}
