import indexComponentsRegistry from '@/../public/c/index.json';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-8">
      <h1 className="text-4xl">
        <b>sh(ui)p</b> components
      </h1>
      <ul>
        {indexComponentsRegistry.map((component) => (
          <li key={component.name} className="hover:underline underline-offset-4">
            <a href={`/c/${component.name}.json`}>/c/{component.name}.json</a>
          </li>
        ))}
      </ul>

      <p className="font-mono text-yellow-700 p-2 border-2 rounded-xl bg-foreground/20 ">
        bunx shadcn@latest add https://shuip.xyz/c/{indexComponentsRegistry[0].name}.json
      </p>

      <a href="https://github.com/plvo/shuip" className="hover:underline underline-offset-4">
        https://github.com/plvo/shuip
      </a>
    </main>
  );
}
