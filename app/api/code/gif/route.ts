import { NextRequest, NextResponse } from 'next/server';
import { parseConfig } from '../../../lib/config';
import { buildFrames } from '../../../lib/gif/frames';
import { encodeGif } from '../../../lib/gif/encode';
import { rasterize } from '../../../lib/gif/rasterize';
import { highlight } from '../../../lib/highlight';
import { terminalize } from '../../../lib/terminal';
import { computeGeometry } from '../../../lib/svg/geometry';
import { renderFrame } from '../../../lib/svg/render';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PLACEHOLDER =
  '// codemo\n' +
  '// Pass ?code=... or ?lz=... to render an animated code block.\n' +
  '// e.g. /api/code/gif?code=const%20x%20%3D%201&lang=ts&anim=typing';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cfg = parseConfig(request.nextUrl.searchParams, 'gif');
  const code = cfg.code || PLACEHOLDER;
  const lang = cfg.code ? cfg.lang : 'text';

  const hl =
    cfg.mode === 'terminal'
      ? await terminalize(code, cfg.theme, cfg.prompt, cfg.lang, cfg.cmdHighlight)
      : await highlight(code, lang, cfg.theme);
  const geo = computeGeometry(hl.lines, cfg);
  const frames = buildFrames(hl, cfg);

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
}
