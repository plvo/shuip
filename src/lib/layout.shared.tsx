import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className='flex items-center gap-0.5'>
          <Image src='/shuip-light.png' alt='sh(ui)p' width={64} height={64} className='size-7 dark:hidden' />
          <Image src='/shuip-dark.png' alt='sh(ui)p' width={64} height={64} className='size-7 hidden dark:block' />
          <span className='font-bold font-bluunext whitespace-nowrap'>sh(ui)p</span>
        </div>
      ),
    },
    githubUrl: 'https://github.com/plvo/shuip',
    searchToggle: {
      enabled: true,
    },
    themeSwitch: {
      enabled: true,
      mode: 'light-dark',
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        on: 'nav',
        active: 'none',
      },
      {
        type: 'icon',
        text: 'X',
        label: 'X',
        url: 'https://x.com/pelavo7',
        icon: (
          <svg xmlns='http://www.w3.org/2000/svg' role='img' viewBox='0 0 24 24'>
            <title aria-label='X'>X</title>
            <path
              d='M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z'
              fill='currentColor'
            />
          </svg>
        ),
      },
    ],
  };
}
