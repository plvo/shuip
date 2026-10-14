import { describe, expect, test } from 'bun:test';
import os from 'node:os';
import { inStep, reportFailure, runStep, StepFailure, settleAll } from './step';

const failureOf = async (task: Promise<unknown>): Promise<unknown> => {
  try {
    await task;
  } catch (error) {
    return error;
  }
  throw new Error('expected the task to fail');
};

describe('runStep', () => {
  test('returns the output of a command that succeeds', async () => {
    expect(await runStep('greet', ['sh', '-c', 'echo hello'], os.tmpdir())).toBe('hello');
  });

  test('fails with the step name and the stdout and stderr of a failing command', async () => {
    const failure = await failureOf(
      runStep('type-check', ['sh', '-c', 'echo out-line; echo err-line >&2; exit 2'], os.tmpdir()),
    );
    expect(failure).toBeInstanceOf(StepFailure);
    expect((failure as StepFailure).message).toBe('type-check failed (exit code 2)');
    expect((failure as StepFailure).output).toBe('out-line\nerr-line');
  });

  test('says how a command that died without output ended', async () => {
    const failure = await failureOf(runStep('install items', ['sh', '-c', 'kill -9 $$'], os.tmpdir()));
    expect((failure as StepFailure).message).toBe('install items failed (killed by SIGKILL)');
  });

  test('fails with the step name when the command cannot be started', async () => {
    const failure = await failureOf(runStep('type-check', ['/nonexistent/tsc', '--noEmit'], os.tmpdir()));
    expect(failure).toBeInstanceOf(StepFailure);
    expect((failure as StepFailure).message).toBe('type-check failed (could not start)');
    expect((failure as StepFailure).output).toContain('/nonexistent/tsc');
  });
});

describe('inStep', () => {
  test('returns what the task returns', async () => {
    expect(await inStep('list items', async () => 42)).toBe(42);
  });

  test('names the step in the failure of a task that throws', async () => {
    const failure = await failureOf(
      inStep('list items', async () => {
        throw new Error('connection refused');
      }),
    );
    expect(failure).toBeInstanceOf(StepFailure);
    expect((failure as StepFailure).message).toBe('list items failed (threw)');
    expect((failure as StepFailure).output).toContain('connection refused');
  });

  test('keeps the failure of a task that already names its step', async () => {
    const own = new StepFailure('select items', 'Not published: x');
    expect(await failureOf(inStep('list items', () => Promise.reject(own)))).toBe(own);
  });
});

describe('settleAll', () => {
  const failing = (step: string, output: string): Promise<never> => Promise.reject(new StepFailure(step, output));

  test('waits for every task and rethrows a single failure unchanged', async () => {
    let finished = false;
    const slow = new Promise<void>((resolve) =>
      setTimeout(() => {
        finished = true;
        resolve();
      }, 20),
    );
    const failure = await failureOf(settleAll(failing('scaffold project', 'boom'), slow));
    expect((failure as StepFailure).message).toBe('scaffold project failed');
    expect(finished).toBe(true);
  });

  test('keeps the failure of every task that failed', async () => {
    const failure = await failureOf(settleAll(failing('build registry', 'a'), failing('scaffold project', 'b')));
    expect(failure).toBeInstanceOf(AggregateError);
    expect((failure as AggregateError).errors.map((error: StepFailure) => error.message)).toEqual([
      'build registry failed',
      'scaffold project failed',
    ]);
  });
});

describe('reportFailure', () => {
  test('names the style, the step and its output', () => {
    expect(reportFailure(new StepFailure('type-check', 'a.ts(1,1): error TS2322'), 'base-vega')).toBe(
      '[smoke] base-vega: type-check failed\n\na.ts(1,1): error TS2322',
    );
  });

  test('states that a step wrote nothing instead of printing an empty report', () => {
    expect(reportFailure(new StepFailure('install items', '', 'exit code 1'), 'base-vega')).toBe(
      '[smoke] base-vega: install items failed (exit code 1)\n\nThe step wrote no output.',
    );
  });

  test('reports every failure of a group of steps', () => {
    const report = reportFailure(
      new AggregateError([new StepFailure('build registry', 'a'), new StepFailure('scaffold project', 'b')]),
      'base-vega',
    );
    expect(report).toContain('[smoke] base-vega: build registry failed\n\na');
    expect(report).toContain('[smoke] base-vega: scaffold project failed\n\nb');
  });

  test('prints an error that belongs to no step with its stack', () => {
    const error = new Error('boom');
    expect(reportFailure(error, 'base-vega')).toBe(`[smoke] base-vega: unexpected error\n\n${error.stack}`);
  });

  test('prints a thrown value that is not an error', () => {
    expect(reportFailure('boom', 'base-vega')).toBe('[smoke] base-vega: unexpected error\n\nboom');
  });
});
