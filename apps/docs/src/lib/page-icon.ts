import { icons } from 'lucide-react';
import React from 'react';

/** The lucide icon a page names in its frontmatter or meta, for the page trees. */
export const icon = (name?: string) => {
  if (!name) {
    return null;
  }
  if (name in icons) return React.createElement(icons[name as keyof typeof icons]);
};
