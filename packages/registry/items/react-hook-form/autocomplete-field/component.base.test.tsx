import { describe, expect, test } from 'bun:test';
import { useLens } from '@hookform/lenses';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { AutocompleteField } from './component.base';

function Subject() {
  const form = useForm({ defaultValues: { source: '' } });
  const lens = useLens({ control: form.control });
  return <AutocompleteField lens={lens.focus('source')} label='Source' suggestions={['LinkedIn', 'Referral']} />;
}

describe('AutocompleteField closed state', () => {
  const markup = renderToStaticMarkup(<Subject />);

  test('exposes the input as a combobox with a collapsed list', () => {
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('aria-autocomplete="list"');
    expect(markup).toContain('aria-expanded="false"');
  });

  test('points to no list and no option while closed', () => {
    expect(markup).not.toContain('aria-controls');
    expect(markup).not.toContain('aria-activedescendant');
  });

  test('keeps the label bound to the input', () => {
    expect(markup).toContain('for="source"');
    expect(markup).toContain('id="source"');
  });
});
