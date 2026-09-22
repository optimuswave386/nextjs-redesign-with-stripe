"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { site } from "@/lib/site";

// The introduction fills in word by word as you scroll through it.
export function Intro() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-word]",
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.12,
            scrollTrigger: { trigger: root.current, start: "top 78%", end: "bottom 62%", scrub: true },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section container" aria-label="Introduction">
      <p className="intro-text">
        {site.intro.split(" ").map((w, i) => (
          <span key={i}>
            <span data-word>{w}</span>{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
