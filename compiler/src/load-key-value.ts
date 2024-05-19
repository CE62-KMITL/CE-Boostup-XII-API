export function loadKeyValue(str: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let line of str.split('\n')) {
    line = line.trim();
    let [key, value] = line.split(':');
    key = key.trim();
    value = value.trim();
    obj[key] = value;
  }
  return obj;
}
