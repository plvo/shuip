'use client';

import * as React from 'react';

export interface HighlightedLinesProps {
  code: string;
  /** The inline styles the tokens are painted with. */
  styles: Record<string, string>[];
  /** For each line of the code, the pairs (index in `styles`, length of the token) of its tokens, in order. */
  lines: number[][];
}

/** The tokens of a line: each run paints the next characters of the line, the characters left over stay plain. */
const tokensOf = (text: string, runs: number[], styles: Record<string, string>[]): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  let start = 0;
  for (let run = 0; run < runs.length; run += 2) {
    const end = start + runs[run + 1];
    tokens.push(
      <span key={run} style={styles[runs[run]]}>
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
 * The server sends these compact runs instead of one element per token, and the markup is the one Shiki produces.
 */
export function HighlightedLines({ code, styles, lines }: HighlightedLinesProps): React.JSX.Element {
  return (
    <code>
      {code.split('\n').map((text, index) => (
        <React.Fragment key={index}>
          {index > 0 && '\n'}
          <span className='line'>{tokensOf(text, lines[index] ?? [], styles)}</span>
        </React.Fragment>
      ))}
    </code>
  );
}
