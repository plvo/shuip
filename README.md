# shuip

[**shuip**](https://shuip.plvo.dev) _(ship + ui)_ is an open-source React component library designed to **accelerate the development** of your Next.js applications. Built on top of [shadcn/ui](https://ui.shadcn.com), shuip provides ready-to-use, business-focused components that help you **ship** faster.

For more details, see the full documentation: https://shuip.plvo.dev/docs

## Quick Start

Use the shadcn/ui CLI to add shuip components to your project:

```bash
npx shadcn@latest add "https://shuip.plvo.dev/r/submit-button"
```

More informations on the [documentation](https://shuip.plvo.dev/docs/installation)

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

Want to contribute? Check out the [Contribution guide](https://shuip.plvo.dev/docs/contribution).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
