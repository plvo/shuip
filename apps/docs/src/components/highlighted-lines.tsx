'use client';

import * as React from 'react';

export interface HighlightedLinesProps {
  code: string;
  /** The inline styles the tokens are painted with. */
  styles: Record<string, string>[];
  /** For each line of the code, the pairs (index in `styles`, length of the token) of its tokens, in order. */
  runs: number[][];
}

/** The tokens of a line: each run paints the next characters of the line, the characters left over stay plain. */
const tokensOf = (text: string, lineRuns: number[], styles: Record<string, string>[]): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  let start = 0;
  for (let run = 0; run < lineRuns.length; run += 2) {
    const end = start + lineRuns[run + 1];
    tokens.push(
      <span key={run} style={styles[lineRuns[run]]}>
        {text.slice(start, end)}
      </span>,
    );
    start = end;
  }
  if (start < text.length) tokens.push(text.slice(start));
  return tokens;
};

/**
 * The lines of a highlighted source, built from the source and the runs of its tokens.
 * Its markup is the one Shiki produces: a `line` span per line, a styled span per token.
 */
export function HighlightedLines({ code, styles, runs }: HighlightedLinesProps): React.JSX.Element {
  return (
    <code>
      {code.split('\n').map((text, index) => (
        <React.Fragment key={index}>
          {index > 0 && '\n'}
          <span className='line'>{tokensOf(text, runs[index] ?? [], styles)}</span>
        </React.Fragment>
      ))}
    </code>
  );
}
