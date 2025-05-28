import { Highlight, themes } from 'prism-react-renderer';

export interface CodeHighlightProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
}

export function CodeMdx({ code, language = 'tsx', ...props }: CodeHighlightProps) {
  return (
    <div {...props} className='rounded-lg border my-6'>
      <Highlight theme={themes.vsDark} code={code} language={language}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={style} className='p-4'>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
