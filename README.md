# shuip

[**shuip**](https://shuip.xyz) _(ship + ui)_ is an open-source React component library designed to **accelerate the development** of your Next.js applications. Built on top of [shadcn/ui](https://ui.shadcn.com), shuip provides ready-to-use, business-focused components that help you **ship** faster.

For more details, see the full documentation: https://shuip.xyz/docs

## Quick Start

Use the shadcn/ui CLI to add shuip components to your project:

```bash
npx shadcn@latest add "https://shuip.xyz/r/submit-button"
```

More informations on the [documentation](https://shuip.xyz/docs/installation)

## Usage Example

Here's how shuip simplifies form development:

### Before
```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input placeholder="your@email.com" {...field} />
      </FormControl>
      <FormDescription>Your email address</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### After with shuip
```tsx
<InputField register={form.register('email')} label="Email" description="Your email address" placeholder="your@email.com" />
```

## 🤝 Contributing

Want to contribute? Check out the [Contribution guide](https://shuip.xyz/docs/contribution).

### For Contributors - Component Development Guide

#### Adding a New Component Category

1. **Create documentation page** in `content/docs/`
   - Example: `button.mdx`

#### Adding a New Component

1. **Develop the component** in `registry/ui/shuip/`
   - Follow naming convention (kebab-case)
   - Export component as default export
   - Include proper TypeScript interfaces

2. **Add to registry** in `registry.json`
   - Register component with proper metadata

3. **Create examples** in `registry/examples/`
   - **Required**: Main example `<component-name>.tsx` 
   - **Optional**: Additional variants `<component-name>.<variant>.tsx`

4. **Add documentation** _(Optional but recommended)_ in `content/components/`
   - File: `<component-name>.mdx`
   - Follow existing documentation patterns

#### Component Structure Example

For a component `ui/shuip/submit-button.tsx`:

```tsx
import { ReloadIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SubmitButtonProps {
  loading?: boolean;
  children: React.ReactNode;
}

export default function SubmitButton({
  loading,
  children,
  className,
  ...props
}: SubmitButtonProps & React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className={cn('w-full', className)}
      {...props}
    >
      {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
```

**Required example** `examples/submit-button.tsx`:
```tsx
import { SubmitButton } from '@/components/ui/shuip/submit-button';

export default function SubmitButtonExample() {
  return <SubmitButton>Submit</SubmitButton>;
}
```

**Optional variant** `examples/submit-button.loading.tsx`:
```tsx
import { SubmitButton } from '@/components/ui/shuip/submit-button';

export default function SubmitButtonLoadingExample() {
  return <SubmitButton loading={true}>Submit</SubmitButton>;
}
```

#### Registry Management

- Use `scripts/generate-registry.ts` to generate `registry/__index__.ts`
- Components are auto-categorized by naming convention
- Examples are automatically linked to their components

#### Component Display System

The documentation system automatically:
1. Shows component-specific documentation (if exists)
2. Displays the main example preview
3. Provides installation instructions
4. Shows source code
5. Lists additional examples/variants

For more details, see the [full contribution documentation](https://shuip.xyz/docs/contribution).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
