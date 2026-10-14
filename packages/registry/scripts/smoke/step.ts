export class StepFailure extends Error {
  constructor(
    readonly step: string,
    readonly output: string,
    readonly reason = '',
  ) {
    super(`${step} failed${reason ? ` (${reason})` : ''}`);
  }
}

const errorText = (error: unknown): string => (error instanceof Error ? (error.stack ?? error.message) : String(error));

const spawnStep = (step: string, cmd: string[], cwd: string) => {
  try {
    return Bun.spawn({
      cmd,
      cwd,
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
      env: { ...process.env, CI: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
    });
  } catch (error) {
    throw new StepFailure(step, errorText(error), 'could not start');
  }
};

export const runStep = async (step: string, cmd: string[], cwd: string): Promise<string> => {
  const child = spawnStep(step, cmd, cwd);
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  const output = [stdout, stderr]
    .map((stream) => stream.trim())
    .filter(Boolean)
    .join('\n');
  if (exitCode !== 0) {
    throw new StepFailure(step, output, child.signalCode ? `killed by ${child.signalCode}` : `exit code ${exitCode}`);
  }
  return output;
};

/** Runs an in-process step so that any error it throws names the step. */
export const inStep = async <T>(step: string, task: () => Promise<T>): Promise<T> => {
  try {
    return await task();
  } catch (error) {
    throw error instanceof StepFailure ? error : new StepFailure(step, errorText(error), 'threw');
  }
};

/** Waits for every task, then throws the failure of the one that failed, or all of them when several did. */
export const settleAll = async (...tasks: Promise<unknown>[]): Promise<void> => {
  const failures = (await Promise.allSettled(tasks)).flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (failures.length === 1) {
    throw failures[0];
  }
  if (failures.length > 1) {
    throw new AggregateError(failures, 'several steps failed');
  }
};

/** The text a failed run prints: for each failure, the step that failed and everything it wrote. */
export const reportFailure = (error: unknown, style?: string): string => {
  if (error instanceof AggregateError) {
    return error.errors.map((failure) => reportFailure(failure, style)).join('\n\n');
  }
  const prefix = style ? `[smoke] ${style}:` : '[smoke]';
  if (error instanceof StepFailure) {
    return `${prefix} ${error.message}\n\n${error.output || 'The step wrote no output.'}`;
  }
  return `${prefix} unexpected error\n\n${errorText(error)}`;
};
