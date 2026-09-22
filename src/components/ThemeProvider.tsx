"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { buildThemes, extractPalette, type Theme } from "@/lib/palette";

export type Apod = {
  title: string;
  date: string;
  explanation: string;
  copyright?: string;
  mediaType: string;
  image: string | null; // direct NASA URL
  src: string | null; // same-origin proxy of the image
  pageUrl: string;
};

type Status = "loading" | "ready" | "error";

type ThemeContextValue = {
  apod: Apod | null;
  status: Status;
  themes: Theme[];
  theme: Theme | null;
  setThemeId: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_KEY = "theme-id";
export const THEME_VARS_KEY = "theme-vars";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
  root.dataset.mode = theme.mode;
  try {
    localStorage.setItem(THEME_KEY, theme.id);
    localStorage.setItem(THEME_VARS_KEY, JSON.stringify({ mode: theme.mode, vars: theme.vars }));
  } catch {
    /* storage blocked */
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [apod, setApod] = useState<Apod | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeId, setId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let data: Apod | null = null;
      try {
        const res = await fetch("/api/apod", { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(String(res.status));
        data = (await res.json()) as Apod;
      } catch {
        data = null; // rate-limited, offline or too slow: the hero shows its placeholder
      }
      if (cancelled) return;

      // Hand the photo to the hero right away so it can start loading in parallel
      // with the colour sampling below.
      setApod(data);
      setStatus(data ? "ready" : "error");

      let built = buildThemes([]);
      if (data?.src) {
        try {
          built = buildThemes(await extractPalette(data.src));
        } catch {
          /* keep the fallback palette */
        }
      }
      if (cancelled) return;

      let saved: string | null = null;
      try {
        saved = localStorage.getItem(THEME_KEY);
      } catch {
        /* ignore */
      }
      // Same exact theme if today's photo still has it, otherwise the first theme in the same mode.
      const chosen =
        built.find((t) => t.id === saved) ??
        built.find((t) => saved && t.id.startsWith(saved.split("-")[0])) ??
        built[0];

      setThemes(built);
      setId(chosen.id);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const theme = useMemo(() => themes.find((t) => t.id === themeId) ?? null, [themes, themeId]);

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  const setThemeId = useCallback((id: string) => setId(id), []);

  const value = useMemo(
    () => ({ apod, status, themes, theme, setThemeId }),
    [apod, status, themes, theme, setThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
