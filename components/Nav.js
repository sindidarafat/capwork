'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Today' },
  { href: '/tasks', label: 'Task Log' },
  { href: '/coming-up', label: 'Coming Up' },
  { href: '/scorecard', label: 'Scorecard' },
  { href: '/clients', label: 'Clients & Pitches' },
  { href: '/team', label: 'Team' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map((l) => {
        const active = l.href === '/' ? path === '/' : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? 'nav-link active' : 'nav-link'} aria-current={active ? 'page' : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
