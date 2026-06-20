# codemo

A Vercel API that renders syntax-highlighted **code blocks** as **SVG** (static) and **GIF** (animated typing / step / terminal). Primary use case: embedding good-looking code into Markdown (GitHub READMEs, blogs) and HTML slides (Marp, reveal.js).

Powered by [Shiki](https://shiki.style) (VS Code grammars & themes), rendered to SVG, and rasterized to GIF with [resvg](https://github.com/yisibl/resvg-js) + [gifenc](https://github.com/mattdesl/gifenc).

## Demo

Static code block (SVG):

![demo](https://codemo-lake.vercel.app/api/code?code=const%20greet%20%3D%20(name)%20%3D%3E%20%60Hello%2C%20%24%7Bname%7D!%60%3B&lang=javascript&theme=dracula&title=greet.js)

Typing animation (GIF):

![typing](https://codemo-lake.vercel.app/api/code/gif?code=const%20greet%20%3D%20(name)%20%3D%3E%20%60Hello%2C%20%24%7Bname%7D!%60%3B&lang=javascript&theme=dracula&anim=typing&title=greet.js)

Terminal session (GIF):

![terminal](https://codemo-lake.vercel.app/api/code/gif?code=%24%20npm%20install%20codemo%0Aadded%201%20package%20in%200.4s&mode=terminal&anim=terminal&theme=tokyo-night&title=zsh)

> Try it interactively in the **[playground](https://codemo-lake.vercel.app)**.

## Usage

Embed in Markdown:

```markdown
![code](https://codemo-lake.vercel.app/api/code?code=const%20x%20%3D%201&lang=ts&theme=dracula)
![code](https://codemo-lake.vercel.app/api/code/gif?code=const%20x%20%3D%201&lang=ts&anim=typing)
```

Endpoints:

| Path | Output | Notes |
|------|--------|-------|
| `/api/code` (alias `/svg`) | `image/svg+xml` | Static. Crisp, tiny, scalable. |
| `/api/code/gif` (alias `/gif`) | `image/gif` | Animated. Use this when you need motion. |

> **Why GIF for animation?** GitHub renders embedded SVG via `<img>`, which does **not** play SVG/CSS animations. Use the GIF endpoint for anything that moves; use the SVG endpoint for static blocks.

### Passing long code

URLs have length limits and code contains characters that need escaping. For anything non-trivial, compress the code with [lz-string](https://github.com/pieroxy/lz-string) and pass it as `lz`:

```js
import LZString from 'lz-string';
const lz = LZString.compressToEncodedURIComponent(sourceCode);
const url = `https://codemo-lake.vercel.app/api/code?lz=${lz}&lang=typescript&theme=nord`;
```

The playground does this for you and gives you a ready-to-paste Markdown snippet.

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `code` | Raw, URL-encoded source code | — |
| `lz` | lz-string compressed code (preferred for long code; overrides `code`) | — |
| `lang` | Language id (see below) | `text` |
| `theme` | Theme id (see below) | `github-dark` |
| `mode` | `code` or `terminal` | `code` |
| `anim` | `none`, `typing`, `step`, `terminal` (GIF only) | `typing` (gif) |
| `title` | Window title / filename label | — |
| `window` | Show the macOS-style window chrome (`0`/`1`) | `1` |
| `lineNumbers` | Show line numbers (`0`/`1`) | `0` |
| `padding` | Inner padding in px | `24` |
| `fontSize` | Font size in px | `14` |
| `radius` | Corner radius in px | `10` |
| `bg` | Background color override (any CSS color) | theme bg |
| `tabSize` | Spaces per tab | `2` |
| `prompt` | Terminal prompt prefix that marks command lines | `$ ` |
| `speed` | Typing speed (characters per second) | `14` |
| `fps` | Frames per second | `12` |
| `loop` | Loop the GIF forever (`0`/`1`) | `1` |
| `cursor` | Show the typing cursor (`0`/`1`) | `1` |
| `startDelay` | Hold the first frame, in ms | `400` |
| `endDelay` | Hold the last frame, in ms | `1500` |

## Modes

- **`code`** — syntax-highlighted source with Shiki.
- **`terminal`** — renders text as a shell session. Lines starting with the `prompt` (default `$ `) are drawn as commands (green prompt); all other lines are output.

## Animations (GIF)

- **`typing`** — characters are typed out left to right with a blinking-style block cursor.
- **`step`** — lines are revealed one by one. Great for building up an idea on a slide.
- **`terminal`** — command lines type out, then their output appears instantly (pairs with `mode=terminal`).

## Themes

`github-dark`, `github-light`, `dracula`, `nord`, `one-dark-pro`, `monokai`, `vitesse-dark`, `vitesse-light`, `catppuccin-mocha`, `tokyo-night`

## Languages

`javascript` (`js`), `typescript` (`ts`), `tsx`, `jsx`, `json`, `python` (`py`), `rust`, `go`, `bash` (`sh`/`shell`/`zsh`), `html`, `css`, `markdown`, `yaml` (`yml`), `sql`, `c`, `cpp` (`c++`), `java`, `ruby` (`rb`), `php`, `diff`, `text` (plain)

## Self-hosting on Vercel

```sh
git clone https://github.com/masaki39/codemo.git
cd codemo
pnpm install
vercel deploy
```

## License

MIT
