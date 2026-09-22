"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { site } from "@/lib/site";
import { useTheme } from "./ThemeProvider";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const { apod, status } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [useDirect, setUseDirect] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // If the same-origin proxy fails, try the image straight from NASA before giving up.
  const src = useDirect ? apod?.image : apod?.src;

  // "Failed" covers every way the photo can be missing: NASA rate-limits or times out,
  // today's entry has no still image, or the image itself won't load.
  const failed = status === "error" || (status === "ready" && !src) || imgFailed;
  const skeleton = !loaded;

  // The text sequence starts immediately on mount. It never waits for the photo,
  // so there's nothing to wait for before reading or browsing.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo("[data-hero-word]", { yPercent: 110, y: 0 }, { yPercent: 0, duration: 1.1, stagger: 0.07 }, 0.15)
          .fromTo("[data-hero-fade]", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.14 }, 0.9);

        // The photo drifts slower than the page as you scroll away from it.
        gsap.to("[data-hero-inner]", {
          yPercent: 7,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const credit = failed
    ? "Today\u2019s photo isn\u2019t available right now. It will appear when NASA responds."
    : apod && loaded
      ? `Photo: ${apod.title}${apod.copyright ? ` by ${apod.copyright}` : ""}, via NASA APOD`
      : null;

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title" aria-busy={skeleton && !failed}>
      <div className="hero-media" data-hero-media>
        <div className="hero-media-inner" data-hero-inner>
          {/* Placeholder: shimmers while the photo loads, sits still if it can't. */}
          <div
            className={`hero-skeleton${failed ? " is-still" : ""}${loaded ? " is-hidden" : ""}`}
            aria-hidden="true"
          />
          {src && !imgFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={apod ? `NASA astronomy picture: ${apod.title}` : ""}
              loading="lazy"
              decoding="async"
              className={loaded ? "is-loaded" : undefined}
              onLoad={() => setLoaded(true)}
              onError={() => (useDirect ? setImgFailed(true) : setUseDirect(true))}
            />
          )}
        </div>
      </div>
      <div className="hero-scrim" />

      <div className="hero-inner">
        <h1 id="hero-title" className="hero-title">
          {site.headline.split(" ").map((word, i) => (
            <span key={i}>
              <span className="hero-w">
                <span className="hero-word" data-hero-word>
                  {word}
                </span>
              </span>{" "}
            </span>
          ))}
        </h1>
        <p className="hero-sub hero-fade" data-hero-fade>
          My projects in cybersecurity, cloud and AI, plus a small shop for things I make.
        </p>
        <div className="hero-actions hero-fade" data-hero-fade>
          <Link href="/portfolio" className="btn">
            See my work
          </Link>
          <Link href="/products" className="btn btn-ghost">
            Visit the shop
          </Link>
        </div>
        <p className="hero-credit" role="status">
          {credit}
        </p>
      </div>
    </section>
  );
}
