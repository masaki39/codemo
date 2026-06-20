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

> **Transparency.** SVG corners are transparent. GIF supports only 1-bit (on/off) transparency, so the rounded corners are made transparent (slightly aliased edges) by default — set `transparent=0` plus a `bg` matching your page for perfectly smooth corners.

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
| `showLang` | Show the language label in the title bar (`0`/`1`) | `0` |
| `lineNumbers` | Show line numbers (`0`/`1`) | `0` |
| `padding` | Inner padding in px | `24` |
| `fontSize` | Font size in px | `14` |
| `radius` | Corner radius in px | `10` |
| `bg` | Background color override (any CSS color) | theme bg |
| `transparent` | GIF: keep the rounded corners transparent (`0`/`1`) | `1` |
| `tabSize` | Spaces per tab | `2` |
| `prompt` | Terminal prompt prefix that marks command lines | `$ ` |
| `cmdHighlight` | Terminal: syntax-highlight command lines (`0`/`1`) | `1` |
| `speed` | Typing speed (characters per second) | `14` |
| `fps` | Frames per second | `12` |
| `loop` | Loop the GIF forever (`0`/`1`) | `1` |
| `cursor` | Show the typing cursor (`0`/`1`) | `1` |
| `startDelay` | Hold the first frame, in ms | `400` |
| `endDelay` | Hold the last frame, in ms | `1500` |
| `execDelay` | Terminal: pause after a command before its output, in ms | `300` |
| `outputDelay` | Terminal: hold per output line, in ms | `250` |

## Modes

- **`code`** — syntax-highlighted source with Shiki.
- **`terminal`** — renders text as a shell session. Lines starting with the `prompt` (default `$ `) are drawn as commands (green prompt) and syntax-highlighted (bash by default — pick another grammar with `lang`); all other lines are output. Disable command highlighting with `cmdHighlight=0`.

## Animations (GIF)

- **`typing`** — characters are typed out left to right with a blinking-style block cursor.
- **`step`** — lines are revealed one by one. Great for building up an idea on a slide.
- **`terminal`** — command lines type out, then their output appears line by line, paced by `execDelay` (pause after the command) and `outputDelay` (per output line). Pairs with `mode=terminal`.

## Themes

`github-dark`, `github-light`, `dracula`, `nord`, `one-dark-pro`, `monokai`, `vitesse-dark`, `vitesse-light`, `catppuccin-mocha`, `tokyo-night`

## Languages

`javascript` (`js`), `typescript` (`ts`), `tsx`, `jsx`, `json`, `python` (`py`), `rust`, `go`, `bash` (`sh`/`shell`/`zsh`/`console`), `powershell` (`ps`/`ps1`), `docker` (`dockerfile`), `html`, `css`, `markdown`, `yaml` (`yml`), `toml`, `ini`, `xml`, `sql`, `graphql`, `c`, `cpp` (`c++`), `csharp` (`cs`/`c#`), `java`, `kotlin` (`kt`), `swift`, `scala`, `ruby` (`rb`), `php`, `lua`, `dart`, `r`, `elixir`, `vue`, `svelte`, `diff`, `text` (plain)

## Develop locally

```sh
git clone https://github.com/masaki39/codemo.git
cd codemo
pnpm install
pnpm dev        # http://localhost:3000 (playground + API)
```

## Self-hosting on Vercel

Deploy your own copy with the [Vercel CLI](https://vercel.com/docs/cli):

```sh
pnpm install -g vercel   # or: npx vercel
vercel deploy --prod
```

When self-hosting, replace `codemo-lake.vercel.app` in the examples with your own deployment URL. The playground builds embed URLs from `window.location.origin`, so it works on any domain automatically.

## License

MIT
