import { applyPalette, GIFEncoder, quantize } from 'gifenc';

export interface RasterFrame {
  data: Uint8Array; // RGBA
  delayMs: number;
}

/**
 * Encode RGBA frames into an animated GIF. A single global palette is derived
 * from the final (fullest) frame and shared by every frame, which avoids
 * per-frame color tables and keeps the file small with no inter-frame flicker.
 */
export function encodeGif(
  frames: RasterFrame[],
  width: number,
  height: number,
  loop: boolean,
): Uint8Array {
  const gif = GIFEncoder();
  const reference = frames[frames.length - 1].data;
  const palette = quantize(reference, 256, { format: 'rgba4444' });

  frames.forEach((frame, i) => {
    const index = applyPalette(frame.data, palette, 'rgba4444');
    gif.writeFrame(index, width, height, {
      palette: i === 0 ? palette : undefined,
      delay: frame.delayMs,
      repeat: loop ? 0 : -1, // 0 = infinite, -1 = play once (read on first frame)
    });
  });

  gif.finish();
  return gif.bytes();
}
