export type PackageManager = 'npm' | 'pnpm' | 'bun' | 'yarn';

export const getCmd = (pkg: PackageManager, filename: string) => {
  const url = `https://shuip.xyz/r/${filename}.json`;

  switch (pkg) {
    case 'npm':
      return `npx shadcn@latest add ${url}`;
    case 'pnpm':
      return `pnpm dlx shadcn@latest add ${url}`;
    case 'bun':
      return `bunx --bun shadcn@latest add ${url}`;
    case 'yarn':
      return `npx shadcn@latest add ${url}`;
    default:
      return '';
  }
};
