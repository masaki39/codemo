import { NextRequest, NextResponse } from 'next/server';
import { parseConfig } from '../../lib/config';
import { highlight } from '../../lib/highlight';
import { errorSvg, renderSvg } from '../../lib/svg/render';
import { terminalize } from '../../lib/terminal';

export const runtime = 'nodejs';

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
    const svg = renderSvg(hl, cfg);

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
