function trimEnd(str: string, chars: string[]): string {
  let end = str.length - 1;
  while (end >= 0 && chars.includes(str[end])) {
    end--;
  }
  return str.slice(0, end + 1);
}

function normalizeEndOfLine(str: string): string {
  return str.replaceAll(/\r\n|\r|\n/g, '\n').replaceAll(/ +\n/g, '\n');
}

function normalizeOutput(output: string): string {
  return trimEnd(normalizeEndOfLine(output), ['\n', ' ']);
}

export function compareOutput(output: string, expectedOutput: string): boolean {
  return normalizeOutput(output) === normalizeOutput(expectedOutput);
}
