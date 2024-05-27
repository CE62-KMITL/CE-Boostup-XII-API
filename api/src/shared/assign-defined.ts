export function assignDefined(target: any, ...sources: any): any {
  for (const source of sources) {
    for (const [key, val] of Object.entries(source)) {
      if (val !== undefined) {
        target[key] = val;
      }
    }
  }
  return target;
}
