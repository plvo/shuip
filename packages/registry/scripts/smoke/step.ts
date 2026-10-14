export class StepFailure extends Error {
  constructor(
    step: string,
    readonly output: string,
  ) {
    super(`${step} failed`);
  }
}

export const runStep = async (step: string, cmd: string[], cwd: string): Promise<string> => {
  const child = Bun.spawn({
    cmd,
    cwd,
    stdin: 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, CI: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  const output = [stdout, stderr].filter(Boolean).join('\n').trim();
  if (exitCode !== 0) {
    throw new StepFailure(step, output);
  }
  return output;
};
