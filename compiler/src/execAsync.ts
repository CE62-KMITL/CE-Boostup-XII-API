import { exec } from 'child_process';
import { promisify } from 'util';

export const execAsync = promisify(exec);

// const execPromise = promisify(exec);

// export const execAsync = async (
//   command: string,
//   options: any,
// ): Promise<{ stdout: string; stderr: string }> => {
//   console.log(`Executing command: ${command}`);
//   const result = await execPromise(command, options);
//   console.log(`Command executed: ${command}`);
//   return { stdout: result.stdout.toString(), stderr: result.stderr.toString() };
// };
