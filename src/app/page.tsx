import fs from 'fs';

export default function Home() {
  const registryFiles = fs.readdirSync('public/r');
  return (
    <main className="flex flex-col items-center justify-center h-screen gap-8">
      <h1 className="text-4xl">
        <b>
          sh<span className="text-yellow-500">ui</span>p
        </b>{' '}
        components
      </h1>
      <ul>
        {registryFiles.map((filename, i) => (
          <li key={i} className="hover:underline underline-offset-4">
            <a href={`/r/${filename}`}>r/{filename}</a>
          </li>
        ))}
      </ul>

      <pre className="font-mono text-yellow-600 px-2 py-1 bg-foreground/10 ">
        {registryFiles.map((filename, i) => (
          <span key={i}>
            bunx shadcn@latest add https://shuip.xyz/r/{filename}
            <br />
          </span>
        ))}
      </pre>

      <a href="https://github.com/plvo/shuip" className="hover:underline underline-offset-4">
        github.com/plvo/shuip
      </a>
    </main>
  );
}
