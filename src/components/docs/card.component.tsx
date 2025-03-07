'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Docs } from 'contentlayer/generated';
import { filenameToTitle } from '@/lib/utils';

interface ComponentCardProps {
  componentName?: string;
  group?: string;
  doc?: Docs;
  examples?: any[];
}

export default function CardComponent({ componentName, group, doc, examples = [] }: ComponentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="relative overflow-hidden transition-all duration-300 hover:shadow-md border border-border/80 hover:border-primary/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/docs/${group || 'components'}/${componentName || ''}`} className="block h-full" passHref>
        <CardHeader className="pb-2">
          <CardTitle
            className={`text-xl font-semibold transition-colors duration-300 ${isHovered ? 'text-primary' : ''}`}
          >
            {doc?.title ? filenameToTitle(doc.title) : 'Component'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doc?.description ? (
            <p className="text-muted-foreground line-clamp-2">{doc.description}</p>
          ) : (
            <p className="text-muted-foreground italic">No description available</p>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {examples.length > 0
                ? `${examples.length} ${examples.length === 1 ? 'example' : 'examples'}`
                : 'No examples'}
            </span>
          </div>
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-300 ${isHovered ? 'translate-x-1 text-primary' : 'text-muted-foreground'}`}
          />
        </CardFooter>

        <div
          className={`absolute -top-10 -right-10 w-20 h-20 rotate-45 transition-opacity duration-300 bg-primary/10 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        />
      </Link>
    </Card>
  );
}
