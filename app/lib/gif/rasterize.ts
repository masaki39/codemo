import { Resvg } from '@resvg/resvg-js';
import { FONT_FAMILY, fontFiles } from '../svg/font';

export interface Raster {
  data: Uint8Array; // RGBA
  width: number;
  height: number;
}

/**
 * Rasterize an SVG frame to RGBA pixels using resvg (with our bundled fonts).
 * resvg exposes the raw RGBA buffer directly via `.pixels`, so no PNG round-trip
 * is needed. resvg handles the fonts via `fontFiles`, so the SVG itself does not
 * need the base64 font inlined.
 */
export function rasterize(svg: string): Raster {
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: [fontFiles.regular, fontFiles.bold],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  });
  const rendered = resvg.render();
  return { data: rendered.pixels, width: rendered.width, height: rendered.height };
}
