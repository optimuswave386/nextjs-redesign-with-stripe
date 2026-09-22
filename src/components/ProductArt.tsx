'use client'

import Image from 'next/image'
import type { CSSProperties } from "react";
import type { Product } from "@/lib/products";
import { use, useMemo, useState, useEffect } from 'react';

function DynamicImage({ dbFilename, alt }: { dbFilename: string, alt: string }) {
  
  const [imageAsset, setImageAsset] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Resolve the promise safely inside a standard client side lifecycle
    import(`@/assets/images/${dbFilename}`)
      .then((mod) => setImageAsset(mod.default))
      .catch(() => setFailed(true));
  }, [dbFilename]);

  if (failed || (!imageAsset && !failed)) {
    return <div className="art fallback-placeholder">Image not found</div>;
  }

  return (
    <Image 
      src={imageAsset} 
      alt={alt} 
      fill 
      className="object-fit-sm-contain object-fit-md-cover" 
      sizes="(max-width: 768px) 100vw, 33vw" 
    />
  );
}

// Placeholder artwork built from the active theme, so products always match the site colours.
export function ProductArt({ index, kind, imgUrl }: { index: number; kind: Product["kind"], imgUrl: Product["imgUrl"] }) {
  const style = { "--a": `${(index * 67) % 360}deg` } as CSSProperties;
  return ( 
    <>
      <div className="art" data-kind={kind} style={style} aria-hidden="true">
        <DynamicImage dbFilename={imgUrl} alt={kind} />
      </div>
    </>
    );
}
