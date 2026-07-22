'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

// Fumadocs `nav.title` render function — wraps the brand lockup in a home link.
// Kept as a client component so it can be passed from server layouts without
// pulling `next/link` into shared server modules.
export function NavLogoTitle({ href = '/', className, ...rest }: ComponentProps<'a'>) {
  return (
    <Link href={href} className={className} {...rest}>
      <Logo className="h-10 w-auto shrink-0" />
    </Link>
  );
}
