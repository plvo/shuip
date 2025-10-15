'use client';

import { useForm, useStore } from '@tanstack/react-form';
import { Card } from '@/components/ui/card';
import { SubmitButton } from '@/components/ui/shuip/tanstack-form/submit-button';
import { TextareaField } from '@/components/ui/shuip/tanstack-form/textarea-field';

export default function TsfTextareaFieldMarkdownPreviewExample() {
  const form = useForm({
    defaultValues: {
      content: '',
    },
    onSubmit: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(JSON.stringify(value, null, 2));
    },
  });

  const content = useStore(form.store, (state) => state.values.content);
  const htmlContent = parseMarkdown(content);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className='space-y-4'
    >
      <div className='flex max-md:flex-col items-center gap-4 w-full'>
        <div className='mt-4'>
          <TextareaField
            form={form}
            name='content'
            label='Content'
            description='Supports basic Markdown formatting'
            tooltip={
              <div className='space-y-1 text-sm'>
                <p className='font-semibold'>Markdown syntax:</p>
                <p># Heading 1</p>
                <p>## Heading 2</p>
                <p>**bold** *italic*</p>
                <p>`code`</p>
                <p>- List item</p>
              </div>
            }
            props={{
              rows: 12,
              placeholder: '# My Article\n\nWrite your content here...',
              className: 'min-h-[300px]',
            }}
            formProps={{
              validators: {
                onChange: ({ value }) => {
                  if (!value) return 'Content is required';
                  if (value.length < 10) return 'Content must be at least 10 characters';
                  return undefined;
                },
              },
            }}
          />
        </div>

        <Card className='p-4 min-h-[300px]'>
          {content ? (
            // biome-ignore lint/security/noDangerouslySetInnerHtml: demo
            <div className='prose prose-sm max-w-none' dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : (
            <p className='text-muted-foreground'>Nothing to preview yet. Write some content to see the preview.</p>
          )}
        </Card>
      </div>

      <SubmitButton form={form}>Publish Article</SubmitButton>
    </form>
  );
}

function parseMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('### ')) return `<h3 class="text-lg font-semibold mb-2">${line.slice(4)}</h3>`;
      if (line.startsWith('## ')) return `<h2 class="text-xl font-semibold mb-2">${line.slice(3)}</h2>`;
      if (line.startsWith('# ')) return `<h1 class="text-2xl font-bold mb-2">${line.slice(2)}</h1>`;
      if (line.startsWith('- ')) return `<li class="ml-4">${line.slice(2)}</li>`;

      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      line = line.replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>');

      return line ? `<p class="mb-2">${line}</p>` : '<br>';
    })
    .join('\n');
}
