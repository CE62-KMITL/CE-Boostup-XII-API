export function assignDefault(target: any, source: any): any {
  for (const [key, val] of Object.entries(source)) {
    if (val !== undefined && target[key] === undefined) {
      target[key] = val;
    }
  }
  return target;
}
