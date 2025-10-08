'use server';

export interface GitHubRepoData {
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
}

export async function getGitHubRepoData(owner: string, repo: string): Promise<GitHubRepoData | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'shuip-website',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    return {
      stargazers_count: data.stargazers_count || 0,
      forks_count: data.forks_count || 0,
      watchers_count: data.watchers_count || 0,
    };
  } catch (error) {
    console.error('Error fetching GitHub repo data:', error);
    return null;
  }
}
