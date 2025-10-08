import { GitHubLogoIcon, StarIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import React from 'react';
import { type GitHubRepoData, getGitHubRepoData } from '@/actions/github';
import { Button } from './ui/button';

const formatStarCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

interface GitHubStarButtonProps {
  owner: string;
  repo: string;
}

export function GitHubStarButton({ owner, repo }: GitHubStarButtonProps) {
  const data = getGitHubRepoData(owner, repo);

  if (!data) {
    return null;
  }

  return (
    <Link href={`https://github.com/${owner}/${repo}`} passHref>
      <Button>
        <React.Suspense>
          <StarCount data={data} />
        </React.Suspense>
        <StarIcon className='size-5' />
        <GitHubLogoIcon className='size-4' />
      </Button>
    </Link>
  );
}

function StarCount({ data }: { data: Promise<GitHubRepoData | null> }) {
  const datas = React.use(data);
  if (!datas) return null;
  return <span className='text-lg'>{formatStarCount(datas.stargazers_count)}</span>;
}
