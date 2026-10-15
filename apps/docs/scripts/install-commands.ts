const INSTALL_COMMAND = /shadcn(?:@[\w.-]+)? add(?:\s+-\S+)*\s+(\S+)/g;

/** The item of every `shadcn add` command in `text`, whatever its tag and flags. */
export const installTargets = (text: string): string[] =>
  [...text.matchAll(INSTALL_COMMAND)].map(([, target]) => target);
