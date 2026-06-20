import { NextRequest, NextResponse } from 'next/server';
import { parseConfig } from '../../../lib/config';
import { buildFrames, type Frame } from '../../../lib/gif/frames';
import { encodeGif } from '../../../lib/gif/encode';
import { rasterize } from '../../../lib/gif/rasterize';
import { highlight } from '../../../lib/highlight';
import { terminalize } from '../../../lib/terminal';
import { computeGeometry } from '../../../lib/svg/geometry';
import { errorSvg, renderFrame } from '../../../lib/svg/render';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PLACEHOLDER =
  '// codemo\n' +
  '// Pass ?code=... or ?lz=... to render an animated code block.\n' +
  '// e.g. /api/code/gif?code=const%20x%20%3D%201&lang=ts&anim=typing';

// Bound the total number of pixels rasterized across all frames so a large
// canvas can't multiply by the frame count into a timeout / OOM on Vercel.
const MAX_TOTAL_PIXELS = 80_000_000;

/** Evenly downsample frames to fit the pixel budget, always keeping the last. */
function budgetFrames(frames: Frame[], perFramePixels: number): Frame[] {
  const maxFrames = Math.max(1, Math.floor(MAX_TOTAL_PIXELS / Math.max(perFramePixels, 1)));
  if (frames.length <= maxFrames) return frames;
  const out: Frame[] = [];
  const stride = frames.length / maxFrames;
  for (let i = 0; i < maxFrames; i++) out.push(frames[Math.floor(i * stride)]);
  out[out.length - 1] = frames[frames.length - 1];
  return out;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cfg = parseConfig(request.nextUrl.searchParams, 'gif');
    const code = cfg.code || PLACEHOLDER;
    const lang = cfg.code ? cfg.lang : 'text';

    const hl =
      cfg.mode === 'terminal'
        ? await terminalize(code, cfg.theme, cfg.prompt, cfg.lang, cfg.cmdHighlight)
        : await highlight(code, lang, cfg.theme);
    const geo = computeGeometry(hl.lines, cfg);
    const frames = budgetFrames(buildFrames(hl, cfg), geo.width * geo.height);

    const raster = frames.map((frame) => {
      const svg = renderFrame(frame.lines, hl, cfg, geo, { embedFont: false, cursor: frame.cursor });
      return { data: rasterize(svg).data, delayMs: frame.delayMs };
    });

    const gif = encodeGif(raster, geo.width, geo.height, cfg.loop);

    return new NextResponse(Buffer.from(gif), {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    console.error('codemo /api/code/gif error:', err);
    return new NextResponse(errorSvg('render error'), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
