function trimEnd(str: string, chs: string[]): string {
	let end = str.length - 1;
	while (end >= 0 && chs.includes(str[end])) {
		end--;
	}
	return str.slice(0, end + 1);
}

export function compareOutput(output: string, expectedOutput: string): boolean {
	return (
		trimEnd(output.replaceAll('\r\n', '\n').replace(/ +\n/g, '\n'), ['\n', ' ']) ===
		trimEnd(expectedOutput.replaceAll('\r\n', '\n').replace(/ +\n/g, '\n'), ['\n', ' '])
	);
}
