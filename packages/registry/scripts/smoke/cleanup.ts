import fs from 'node:fs/promises';

/** Removes the directory. A failure is reported, not thrown, so it cannot replace the failure that ended the run. */
export const removeWorkDir = async (
  dir: string,
  warn: (message: string) => void = (message) => console.warn(message),
): Promise<void> => {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    warn(`[smoke] could not remove ${dir}: ${error}`);
  }
};
