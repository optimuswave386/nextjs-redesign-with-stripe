'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();
  
  // Extract the invalid ID from the pathname (e.g., /products/999 -> 999)
  const segments = pathname.split('/');
  const invalidSlug = segments[segments.length - 1];

  return (
    <div className="container">
      <header className="page-head">
      <h2 className="error">Not Found</h2>
      </header>
      <div style={{ marginBottom: "clamp(56px, 8vw, 112px)" }}>
      <p>Sorry, we couldn't find a project for <strong>{invalidSlug}</strong>.</p>
        <Link 
          href="/portfolio" 
          style={{ textDecoration: 'none' }}
        >
          View All Projects
        </Link>
      </div>
    </div>
  );
}
