'use client';

import React from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ButtonCopy from '@/components/shared/button.copy';
import { Button } from '@/components/ui/button';
import ButtonTheme from '@/components/ui/shuip/button.theme';

export default function SectionComponent({ code, category }: { code: string; category: string }) {
  const openFullScreenPreview = () => {
    // window.open(`/preview?category=${category}&component=${component.name}`, '_blank');
  };
  return (
    <article className="w-full">
      <Tabs defaultValue="preview" className="relative mr-auto w-full pb-10">
        <div className="flex items-center justify-between pb-3">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="preview"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Code
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="relative rounded-md border">
          <div className="flex items-center justify-between p-4">
            <ButtonTheme />
            <Button onClick={openFullScreenPreview}>Live preview</Button>
            <div className="flex items-center gap-2">
              <ButtonCopy value={code} />
            </div>
          </div>
          <div className={'flex min-h-[350px] w-full justify-center p-10 overflow-hidden relative'}></div>
        </TabsContent>

        <TabsContent value="code" className="rounded-md border">
          <div className="flex items-center justify-between p-2">
            <ButtonCopy value={code} />
          </div>
          <div className="w-full rounded-md [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto">
            <Highlight theme={themes.dracula} code={code} language="tsx">
              {({ style, tokens, getLineProps, getTokenProps }) => (
                <pre style={style} className="p-4">
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      {/* <span className="pr-4 ">{i + 1}</span> */}
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
        </TabsContent>
      </Tabs>
    </article>
  );
}
