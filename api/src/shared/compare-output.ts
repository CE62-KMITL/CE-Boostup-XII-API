export function compareOutput(output: string, expectedOutput: string): boolean {
  return (
    output.replaceAll('\r\n', '\n').trim() ===
    expectedOutput.replaceAll('\r\n', '\n').trim()
  );
}
