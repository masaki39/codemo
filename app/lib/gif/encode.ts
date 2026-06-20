import { applyPalette, GIFEncoder, quantize } from 'gifenc';

export interface RasterFrame {
  data: Uint8Array; // RGBA
  delayMs: number;
}

/**
 * Encode RGBA frames into an animated GIF. A single global palette is derived
 * from the final (fullest) frame and shared by every frame, which avoids
 * per-frame color tables and keeps the file small with no inter-frame flicker.
 *
 * GIF supports only 1-bit transparency, so we quantize with `oneBitAlpha`: any
 * fully-transparent pixel (e.g. the area outside the rounded card corners) maps
 * to a single transparent palette index instead of being flattened to black.
 * `dispose: 1` (leave previous frame in place) is safe because every frame is a
 * full-canvas redraw with an opaque interior and constant transparent corners.
 */
export function encodeGif(
  frames: RasterFrame[],
  width: number,
  height: number,
  loop: boolean,
): Uint8Array {
  const gif = GIFEncoder();
  const reference = frames[frames.length - 1].data;
  const palette = quantize(reference, 256, { format: 'rgba4444', oneBitAlpha: true });
  const transparentIndex = palette.findIndex((c) => c.length >= 4 && c[3] === 0);
  const hasTransparency = transparentIndex >= 0;

  frames.forEach((frame, i) => {
    const index = applyPalette(frame.data, palette, 'rgba4444');
    gif.writeFrame(index, width, height, {
      palette: i === 0 ? palette : undefined,
      delay: frame.delayMs,
      repeat: loop ? 0 : -1, // 0 = infinite, -1 = play once (read on first frame)
      transparent: hasTransparency,
      transparentIndex: hasTransparency ? transparentIndex : 0,
      dispose: hasTransparency ? 1 : -1,
    });
  });

  gif.finish();
  return gif.bytes();
}
