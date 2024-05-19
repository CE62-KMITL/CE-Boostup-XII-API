export function loadKeyValue(str?: string | null): Record<string, string> {
  const obj: Record<string, string> = {};
  if (!str) return obj;
  for (let line of str.split('\n')) {
    line = line.trim();
    if (!line) continue;
    let [key, value] = line.split(':');
    key = key.trim();
    value = value.trim();
    obj[key] = value;
  }
  return obj;
}
