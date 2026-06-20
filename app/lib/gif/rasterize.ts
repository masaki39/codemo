import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { FONT_FAMILY, fontFiles } from '../svg/font';

export interface Raster {
  data: Uint8Array; // RGBA
  width: number;
  height: number;
}

/**
 * Rasterize an SVG frame to RGBA pixels using resvg (with our bundled fonts) and
 * a PNG round-trip to decode the pixel buffer. resvg handles the embedded fonts
 * via `fontFiles`, so the SVG itself does not need the base64 font inlined.
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
  const png = PNG.sync.read(Buffer.from(rendered.asPng()));
  return { data: png.data, width: png.width, height: png.height };
}
