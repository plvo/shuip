import { StepFailure } from './step';

/** Fails when an item was not requested from the local registry server, i.e. installed from elsewhere or not at all. */
export const assertEveryItemServedLocally = (
  servedPaths: ReadonlySet<string>,
  style: string,
  names: string[],
): void => {
  const missing = names.filter((name) => !servedPaths.has(`/r/${style}/${name}.json`));
  if (missing.length > 0) {
    throw new StepFailure(
      'verify install source',
      `Not requested from the local registry server, so installed from elsewhere or not at all:\n${missing.join('\n')}`,
    );
  }
};
