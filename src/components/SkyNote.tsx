"use client";
import { useTheme } from "./ThemeProvider";

export function SkyNote() {
  const { apod, status } = useTheme();

  if (status === "loading") return <p className="muted">Loading today&rsquo;s photograph&hellip;</p>;
  if (!apod) {
    return (
      <p className="muted">
        Today&rsquo;s photograph isn&rsquo;t available right now, so the site is using its default colours.
        They&rsquo;ll switch over automatically when NASA responds.
      </p>
    );
  }

  const date = apod.date
    ? new Date(`${apod.date}T12:00:00`).toLocaleDateString("en-US", { dateStyle: "long" })
    : "";

  return (
    <article className="sky">
      <div>
        <h3>{apod.title}</h3>
        {date && <p className="muted small">{date}</p>}
        {apod.copyright && <p className="muted small">Image credit: {apod.copyright}</p>}
        <a href={apod.pageUrl} target="_blank" rel="noreferrer">
          Open on the NASA site
        </a>
      </div>
      <p>{apod.explanation}</p>
    </article>
  );
}
