import { NextRequest, NextResponse } from 'next/server';
import { LIMITS, parseConfig } from '../../lib/config';
import { highlight } from '../../lib/highlight';
import { computeGeometry } from '../../lib/svg/geometry';
import { errorSvg, renderFrame } from '../../lib/svg/render';
import { terminalize } from '../../lib/terminal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLACEHOLDER =
  '// codemo\n' +
  '// Pass ?code=... or ?lz=... to render a code block.\n' +
  '// e.g. /api/code?code=const%20x%20%3D%201&lang=ts&theme=dracula';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const cfg = parseConfig(request.nextUrl.searchParams, 'svg');
    const code = cfg.code || PLACEHOLDER;
    const lang = cfg.code ? cfg.lang : 'text';

    const hl =
      cfg.mode === 'terminal'
        ? await terminalize(code, cfg.theme, cfg.prompt, cfg.lang, cfg.cmdHighlight)
        : await highlight(code, lang, cfg.theme);
    const geo = computeGeometry(hl.lines, cfg);
    if (geo.width * geo.height > LIMITS.maxCanvasPixels) {
      return new NextResponse(errorSvg('image too large'), {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    const svg = renderFrame(hl.lines, hl, cfg, geo, { embedFont: true });

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    console.error('codemo /api/code error:', err);
    return new NextResponse(errorSvg('render error'), {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
