import { StepFailure } from './step';

/** The requested items, or every published item when none is requested. */
export const selectItems = (published: string[], requested: string[] | undefined): string[] => {
  if (!requested) return published;
  const unknown = requested.filter((name) => !published.includes(name));
  if (unknown.length > 0) {
    throw new StepFailure('select items', `Not published: ${unknown.join(', ')}`);
  }
  return requested;
};
