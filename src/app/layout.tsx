import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/wdth.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.intro,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint: marks JS as available (so GSAP start states apply)
// and re-applies the last theme so the colours don't flash on reload.
const bootScript = `(function(){try{var d=document.documentElement;d.classList.add('js');var t=JSON.parse(localStorage.getItem('theme-vars')||'null');if(t&&t.vars){for(var k in t.vars){d.style.setProperty(k,t.vars[k])}d.dataset.mode=t.mode}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <ThemeProvider>
          <CartProvider>
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
