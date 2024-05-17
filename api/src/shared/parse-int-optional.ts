export function parseIntOptional(value: undefined): undefined;
export function parseIntOptional(value: string | number | null): number;
export function parseIntOptional(
  value?: string | number | null,
): number | undefined {
  if (value === undefined) return undefined;
  if (value === null) return 0;
  return +value;
}
