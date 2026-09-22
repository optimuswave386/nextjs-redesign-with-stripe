"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container">
      <header className="page-head">
        <h1>Something went wrong</h1>
        <p>We couldn&rsquo;t load this page. Try again, and if it keeps happening let me know from the help center.</p>
      </header>
      <div className="empty">
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
