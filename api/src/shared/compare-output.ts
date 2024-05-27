function trimEnd(str: string, ch: string): string {
  let end = str.length - 1;
  while (end >= 0 && str[end] === ch) {
    end--;
  }
  return str.slice(0, end + 1);
}

export function compareOutput(output: string, expectedOutput: string): boolean {
  return (
    trimEnd(output.replaceAll('\r\n', '\n'), '\n') ===
    trimEnd(expectedOutput.replaceAll('\r\n', '\n'), '\n')
  );
}
