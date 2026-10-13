import type { Finding, GoodMark, Verdict } from './types';

interface HtmlSignals {
  html: string;
  lower: string;
  text: string;
}

const CLICHE_PHRASES: Array<[RegExp, string]> = [
  [/\bdelve\b/i, 'delve'],
  [/\bunlock\b/i, 'unlock'],
  [/\bunleash\b/i, 'unleash'],
  [/\belevate\b/i, 'elevate'],
  [/\bsupercharge\b/i, 'supercharge'],
  [/\bseamless(ly)?\b/i, 'seamless'],
  [/\bgame[- ]?changer/i, 'game-changer'],
  [/\brevolutioniz/i, 'revolutionize'],
  [/\bcutting[- ]?edge/i, 'cutting-edge'],
  [/\bnext[- ]?level/i, 'next-level'],
  [/\bempower\b/i, 'empower'],
  [/\bstreamline\b/i, 'streamline'],
  [/\brobust\b/i, 'robust'],
  [/\bleverage\b/i, 'leverage'],
  [/\ball[- ]?in[- ]?one/i, 'all-in-one'],
  [/\btransform your\b/i, 'transform your'],
  [/\btake your .* to the next level/i, 'next level'],
  [/\blike never before/i, 'like never before'],
  [/\bat your fingertips/i, 'at your fingertips'],
  [/\bpowerful yet (simple|easy)/i, 'powerful-yet-simple'],
];

const AI_TELL_EMOJIS = ['🚀','✨','🌟','💡','🎯','🔥','⚡','🤖','💪','🌈','👋','🎉'];

function countMatches(hay: string, re: RegExp): number {
  const m = hay.match(re);
  return m ? m.length : 0;
}

function snippetAround(hay: string, idx: number, radius = 42): string {
  const start = Math.max(0, idx - radius);
  const end = Math.min(hay.length, idx + radius);
  return hay.slice(start, end).replace(/\s+/g, ' ').trim();
}

export function analyzeHtml(rawHtml: string, pageText?: string): { findings: Finding[]; goodMarks: GoodMark[] } {
  const html = rawHtml.slice(0, 600_000);
  const lower = html.toLowerCase();
  const text = (pageText ?? stripTags(html)).slice(0, 60_000);
  const textLower = text.toLowerCase();
  const findings: Finding[] = [];
  const goodMarks: GoodMark[] = [];
  const sig: HtmlSignals = { html, lower, text };

  detectFramework(sig, findings);
  detectTypography(sig, findings, goodMarks);
  detectColor(sig, findings);
  detectCopy(sig, findings, goodMarks, textLower, text);
  detectLayout(sig, findings);
  detectImagery(sig, findings);
  detectSeoHygiene(sig, findings, goodMarks);

  return { findings, goodMarks };
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function push(findings: Finding[], f: Finding) {
  if (f.points > 0) findings.push(f);
}

function detectFramework(sig: HtmlSignals, findings: Finding[]) {
  const { lower, html } = sig;
  // Next.js / Vercel
  if (lower.includes('_next/static') || lower.includes('__next') || lower.includes('nextjs')) {
    push(findings, {
      id: 'framework-next',
      category: 'framework',
      title: 'Next.js starter energy',
      points: 6,
      roast: 'Next.js on Vercel. The robots favorite bunk bed.',
      note: 'The page ships Next.js runtime markers. Nothing wrong with the framework -- it is just the default generator output.',
      evidence: [{ label: '/_next/ static chunks detected' }],
    });
  }
  if (lower.includes('vercel') && (lower.includes('analytics') || lower.includes('speed-insights') || lower.includes('vercel.com'))) {
    push(findings, {
      id: 'framework-vercel',
      category: 'framework',
      title: 'Vercel-native deployment',
      points: 3,
      roast: 'Deployed where every AI demo lives. Rent-free in San Francisco.',
      note: 'Vercel analytics or hosting fingerprints suggest a one-click generator deploy.',
      evidence: [{ label: 'vercel analytics / hosting marker' }],
    });
  }
  // Tailwind
  if (lower.includes('tailwind') || /class="[^"]*(flex|grid|rounded-(xl|2xl)|backdrop-blur|bg-gradient-to-)[^"]*"/.test(html)) {
    const utilityCount = countMatches(html, /class="[^"]*"/g);
    push(findings, {
      id: 'framework-tailwind',
      category: 'framework',
      title: 'Utility-class wallpaper',
      points: utilityCount > 60 ? 7 : 4,
      roast: 'Tailwind classes stacked like Lego bricks nobody designed.',
      note: `Found ${utilityCount} class attributes with heavy utility usage (flex, grid, rounded-xl, gradients). Classic generator output.`,
      evidence: [{ label: `${utilityCount} class attributes`, detail: 'flex / grid / rounded / gradient utilities' }],
    });
  }
  // AI builders
  const builders: Array<[RegExp, string, string]> = [
    [/lovable/i, 'Lovable', 'lovable project badge or uploader path'],
    [/v0\.dev|v0-/i, 'v0', 'v0 generation marker'],
    [/framer\.(site|usercontent)/i, 'Framer', 'framer site assets'],
    [/webflow/i, 'Webflow', 'webflow marker'],
    [/wix\.com|\bwix\b/i, 'Wix', 'wix marker'],
    [/squarespace/i, 'Squarespace', 'squarespace marker'],
    [/bubble\.io/i, 'Bubble', 'bubble marker'],
    [/replit/i, 'Replit', 'replit marker'],
  ];
  for (const [re, name, ev] of builders) {
    if (re.test(html)) {
      push(findings, {
        id: `framework-${name.toLowerCase().replace(/[^a-z]+/g, '')}`,
        category: 'framework',
        title: `${name} fingerprints`,
        points: 9,
        roast: `${name} told on itself. The watermark is doing the roasting for us.`,
        note: `Builder fingerprint found in markup: ${ev}.`,
        evidence: [{ label: ev }],
      });
      break;
    }
  }
  // shadcn
  if (/radix|shadcn|cva|clsx/i.test(html) && /rounded-(lg|xl|2xl)/.test(html)) {
    push(findings, {
      id: 'framework-shadcn',
      category: 'framework',
      title: 'shadcn soup',
      points: 5,
      roast: 'shadcn components, zero decisions. Card, badge, button -- the holy trinity of slop.',
      note: 'Radix/shadcn-style component markers paired with stock rounded corners.',
      evidence: [{ label: 'radix / shadcn / cva markers' }],
    });
  }
}

function detectTypography(sig: HtmlSignals, findings: Finding[], good: GoodMark[]) {
  const { lower, html } = sig;
  const fontChecks: Array<[RegExp, string, string]> = [
    [/font-family:\s*inter/i, 'Inter', 'Inter is the sweatpants of type: comfy, everywhere, says nothing.'],
    [/geist/i, 'Geist', 'Geist on a Next app is like wearing the conference tee to the conference.'],
    [/poppins/i, 'Poppins', 'Poppins for body copy. Geometric, friendly, and thoroughly unchosen.'],
    [/space[- ]?grotesk/i, 'Space Grotesk', 'Space Grotesk headlines -- the AI thinks quirky means a slightly odd G.'],
    [/dm\s?sans/i, 'DM Sans', 'DM Sans everywhere. The generator’s safety blanket.'],
    [/sora/i, 'Sora', 'Sora for display type. Futuristic if futuristic meant 2021.'],
  ];
  let fontHits = 0;
  for (const [re, name, roast] of fontChecks) {
    if (re.test(html) || re.test(lower)) {
      fontHits++;
      push(findings, {
        id: `type-${name.toLowerCase().replace(/[^a-z]+/g, '')}`,
        category: 'type',
        title: `${name} on autopilot`,
        points: 5,
        roast,
        note: `${name} loaded without much pairing or custom treatment.`,
        evidence: [{ label: `${name} referenced in markup/css` }],
      });
    }
  }
  const boldHeads = countMatches(html, /<h[1-3][^>]*(font-bold|font-extrabold|font-black|weight.{0,8}(700|800|900))/gi);
  if (boldHeads >= 2) {
    push(findings, {
      id: 'type-shout',
      category: 'type',
      title: 'Every headline is shouting',
      points: 6,
      roast: 'Bold everything. Whisper challenge: failed.',
      note: `${boldHeads} headings set heavy/bold. Generators default to maximum weight; crafted sites vary it.`,
      evidence: [{ label: `${boldHeads} heavy headings` }],
    });
  }
  if (fontHits === 0 && /font-(serif|mono)/i.test(html)) {
    good.push({ title: 'Type has a point of view', note: 'Serif or mono choices spotted -- someone picked a lane.' });
  }
}

function detectColor(sig: HtmlSignals, findings: Finding[]) {
  const { lower, html } = sig;
  const gradientHits = countMatches(lower, /gradient/g);
  if (gradientHits >= 3) {
    push(findings, {
      id: 'color-gradient',
      category: 'color',
      title: 'Purple-blue gradient fog',
      points: 8,
      roast: 'Indigo to violet to forgettable. The official flag of machine-made.',
      note: `${gradientHits} gradient references. The indigo/violet wash is the generator’s favorite personality.`,
      evidence: [{ label: `${gradientHits} gradient mentions` }],
    });
  } else if (gradientHits >= 1 && /(indigo|violet|purple|fuchsia).*(blue|cyan|pink)|from-.*to-/i.test(html)) {
    push(findings, {
      id: 'color-gradient-lite',
      category: 'color',
      title: 'A little gradient haze',
      points: 5,
      roast: 'One gradient. The gateway blob.',
      note: 'A colored gradient wash behind the hero. Subtle slop is still slop.',
      evidence: [{ label: 'hero gradient wash' }],
    });
  }
  const purples = countMatches(lower, /(violet|purple|indigo|fuchsia)-\d{2,3}/g);
  if (purples >= 4) {
    push(findings, {
      id: 'color-stock',
      category: 'color',
      title: 'Straight off the swatch',
      points: 5,
      roast: 'Stock palette, straight from the tube. No mixing, no tasting.',
      note: `${purples} stock purple-scale utilities. Custom palettes rarely live on the default scale.`,
      evidence: [{ label: `${purples} stock purple utilities` }],
    });
  }
  if (/backdrop-blur|glass|bg-white\/\d+|bg-opacity/i.test(html)) {
    push(findings, {
      id: 'color-glass',
      category: 'color',
      title: 'Glassmorphism garnish',
      points: 4,
      roast: 'Frosted glass on everything. Can’t see the idea through it.',
      note: 'Backdrop-blur / glass panels detected. A little frost is fine; a blizzard is slop.',
      evidence: [{ label: 'backdrop-blur / glass panel' }],
    });
  }
}

function detectCopy(sig: HtmlSignals, findings: Finding[], good: GoodMark[], textLower: string, text: string) {
  void sig;
  const hits: string[] = [];
  const examples: string[] = [];
  for (const [re, name] of CLICHE_PHRASES) {
    const m = text.match(re);
    if (m && m.index !== undefined) {
      hits.push(name);
      if (examples.length < 3) examples.push(snippetAround(text, m.index));
    }
  }
  if (hits.length >= 4) {
    push(findings, {
      id: 'copy-cliche',
      category: 'copy',
      title: 'Robot vocabulary parade',
      points: 9,
      roast: 'Delve, unlock, supercharge, seamless. Bingo card full, meaning empty.',
      note: `Found ${hits.length} AI-favorite phrases: ${hits.slice(0, 6).join(', ')}.`,
      evidence: examples.map((e) => ({ label: `\u201c${e.slice(0, 90)}...\u201d` })),
    });
  } else if (hits.length >= 2) {
    push(findings, {
      id: 'copy-cliche-lite',
      category: 'copy',
      title: 'Copy smells of autocomplete',
      points: 6,
      roast: 'The copy was clearly finished by a very confident intern named GPT.',
      note: `Cliche count: ${hits.join(', ')}.`,
      evidence: examples.map((e) => ({ label: `\u201c${e.slice(0, 90)}...\u201d` })),
    });
  } else if (hits.length === 1) {
    push(findings, {
      id: 'copy-cliche-one',
      category: 'copy',
      title: 'One suspicious phrase',
      points: 3,
      roast: `\u201c${hits[0]}\u201d -- the LLM’s fingerprint on the murder weapon.`,
      note: `Single cliche spotted: ${hits[0]}.`,
      evidence: examples.map((e) => ({ label: `\u201c${e.slice(0, 90)}...\u201d` })),
    });
  }
  const emojiHits = AI_TELL_EMOJIS.filter((e) => text.includes(e));
  if (emojiHits.length >= 2) {
    push(findings, {
      id: 'copy-emoji',
      category: 'copy',
      title: 'Emoji seasoning overload',
      points: 5,
      roast: 'Rockets and sparkles do not make it innovative. They make it a group chat.',
      note: `Marketing emojis in body copy: ${emojiHits.join(' ')}.`,
      evidence: [{ label: `emojis: ${emojiHits.join(' ')}` }],
    });
  }
  const lorem = /lorem ipsum|todo|coming soon|replace (this|me|here)|insert .* here|\[.*\]/i.test(text.slice(0, 4000));
  if (lorem) {
    push(findings, {
      id: 'copy-placeholder',
      category: 'copy',
      title: 'Placeholder left on stage',
      points: 6,
      roast: 'Lorem ipsum walked in and nobody escorted it out.',
      note: 'Placeholder or TODO-style copy found near the top of the page.',
      evidence: [{ label: 'placeholder / lorem-style copy' }],
    });
  }
  const words = textLower.split(/\s+/).filter(Boolean).length;
  if (words > 40 && hits.length === 0) {
    good.push({ title: 'Copy dodges the cliches', note: 'No classic AI buzzwords in the sampled copy.' });
  }
}

function detectLayout(sig: HtmlSignals, findings: Finding[]) {
  const { html, lower } = sig;
  const rounds = countMatches(lower, /rounded-(xl|2xl|3xl|full)/g);
  if (rounds >= 8) {
    push(findings, {
      id: 'layout-round',
      category: 'layout',
      title: 'Rounded-rectangle rally',
      points: 7,
      roast: 'Everything is a pill. This site would prescribe itself.',
      note: `${rounds} extra-round utilities. One radius picked on purpose beats five picked by default.`,
      evidence: [{ label: `${rounds} rounded-xl/2xl/full utilities` }],
    });
  }
  if (/get started|try (it |for )?free|sign up/i.test(sig.text) && /<button|href=.*(signup|register|pricing)/i.test(html)) {
    const ctaCount = countMatches(sig.text, /get started|try .*free|sign up|join now|learn more/gi);
    if (ctaCount >= 3) {
      push(findings, {
        id: 'layout-cta',
        category: 'layout',
        title: 'SaaS Mad Libs hero',
        points: 6,
        roast: 'Badge, headline, two buttons, three cards. I have seen this dream before.',
        note: `${ctaCount} generic CTAs (get started / try free / learn more). The hero follows the standard generator script.`,
        evidence: [{ label: `${ctaCount} generic CTAs` }],
      });
    }
  }
  const lucide = countMatches(lower, /lucide|data-lucide|<svg[^>]*class="[^"]*lucide/g);
  const svgCount = countMatches(lower, /<svg/g);
  if (lucide >= 2 || (svgCount >= 6 && /stroke="currentcolor"|stroke-width="2"/i.test(html))) {
    push(findings, {
      id: 'layout-icons',
      category: 'layout',
      title: 'Identical line icons',
      points: 5,
      roast: 'Six stroke icons in a row. The United Nations of nothing.',
      note: `${Math.max(lucide, svgCount)} inline SVG icons with uniform strokes -- the default icon strip.`,
      evidence: [{ label: 'uniform stroke-icon set' }],
    });
  }
  const centered = /text-center[^>]*>\s*<(h1|h2)/i.test(html) || /<h1[^>]*text-center/i.test(html);
  const badge = /rounded-full[^>]*>\s*[^<]{2,40}(new|introducing|v\d|beta|✨)/i.test(html);
  if (centered && badge) {
    push(findings, {
      id: 'layout-hero',
      category: 'layout',
      title: 'Badge + centered hero combo',
      points: 6,
      roast: 'Tiny pill badge floating over a centered headline. Groundbreaking, said 40,000 sites.',
      note: 'Centered hero with a \u201cnew / introducing\u201d pill badge -- the generator’s opening move.',
      evidence: [{ label: 'pill badge + centered H1' }],
    });
  }
  if (/(trusted by|backed by|loved by|powering)/i.test(sig.text) && countMatches(lower, /<img/g) >= 4) {
    push(findings, {
      id: 'layout-logos',
      category: 'layout',
      title: 'Logo soup social proof',
      points: 4,
      roast: 'Trusted by a grayscale parade of logos you cannot quite read.',
      note: 'A \u201ctrusted by\u201d logo wall with dimmed wordmarks.',
      evidence: [{ label: 'trusted-by logo strip' }],
    });
  }
}

function detectImagery(sig: HtmlSignals, findings: Finding[]) {
  const { html, lower } = sig;
  if (/unsplash|picsum|placehold|loremflickr|generated|ai-.*image/i.test(lower)) {
    push(findings, {
      id: 'img-stock',
      category: 'imagery',
      title: 'Stock-photo haze',
      points: 5,
      roast: 'Stock smiles and foggy mountains. Nobody here has met a photographer.',
      note: 'Third-party placeholder/stock image hosts referenced.',
      evidence: [{ label: 'unsplash / placeholder host' }],
    });
  }
  const blob = /blur-(2xl|3xl)|opacity-[34]0|absolute.*-z-10|radial-gradient/i.test(html);
  if (blob) {
    push(findings, {
      id: 'img-blob',
      category: 'imagery',
      title: 'Mystery background blob',
      points: 6,
      roast: 'A blurred blob behind everything. Evidence that a decision was avoided.',
      note: 'Large blurred decorative blob / radial wash behind content.',
      evidence: [{ label: 'blurred decorative wash' }],
    });
  }
  const avatars = /avatar|pravatar|randomuser|ui-avatars/i.test(lower);
  const testimonial = /testimonial|what our|what customers/i.test(lower);
  if (avatars && testimonial) {
    push(findings, {
      id: 'img-faces',
      category: 'imagery',
      title: 'Suspiciously smooth testimonials',
      points: 6,
      roast: 'Three five-star reviews from people with perfect jawlines and no surnames.',
      note: 'Avatar images paired with testimonial copy -- usually generated faces and quotes.',
      evidence: [{ label: 'avatar + testimonial pairing' }],
    });
  }
}

function detectSeoHygiene(sig: HtmlSignals, findings: Finding[], good: GoodMark[]) {
  const { html, lower } = sig;
  if (!/<meta[^>]*name="description"/i.test(html)) {
    push(findings, {
      id: 'seo-desc',
      category: 'layout',
      title: 'Meta description MIA',
      points: 3,
      roast: 'No meta description. The robots wrote the site but skipped the paperwork.',
      note: 'Missing meta description tag.',
      evidence: [{ label: 'no meta[name=description]' }],
    });
  }
  const h1Count = countMatches(lower, /<h1/g);
  if (h1Count === 0) {
    push(findings, {
      id: 'seo-h1',
      category: 'layout',
      title: 'No H1, no spine',
      points: 3,
      roast: 'Zero H1s. The page has no headline and no backbone.',
      note: 'No H1 element found.',
      evidence: [{ label: '0 <h1> elements' }],
    });
  } else if (h1Count === 1) {
    good.push({ title: 'Clean heading spine', note: 'Exactly one H1 -- the page knows what it is about.' });
  }
  const imgs = countMatches(lower, /<img/g);
  const altImgs = countMatches(lower, /<img[^>]*alt="[^"]+"/g);
  if (imgs >= 3 && altImgs < imgs / 2) {
    push(findings, {
      id: 'seo-alt',
      category: 'imagery',
      title: 'Alt text ghost town',
      points: 3,
      roast: 'Images with no alt text. Accessible to nobody, mysterious to all.',
      note: `${altImgs} of ${imgs} images carry meaningful alt text.`,
      evidence: [{ label: `${altImgs}/${imgs} images with alt` }],
    });
  }
  if (/<title>[^<]{10,80}<\/title>/i.test(html) && !/(untitled|my (v0|next|react|vite) app|new (project|app))/i.test(html)) {
    good.push({ title: 'Real title tag', note: 'A deliberate <title> that is not a starter default.' });
  }
}

export function scoreFindings(findings: Finding[]): number {
  const raw = findings.reduce((sum, f) => sum + f.points, 0);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function verdictFor(score: number): Verdict {
  if (score >= 75) return { score, label: 'Certified slop', summary: 'Peak machine-made. A museum piece of generator defaults.' };
  if (score >= 55) return { score, label: 'Sloppy with confidence', summary: 'Strong robot accent. A human was present but outvoted.' };
  if (score >= 35) return { score, label: 'Mildly slopped', summary: 'Some generator habits showing. Salvageable with taste.' };
  if (score >= 15) return { score, label: 'Mostly human', summary: 'A few suspicious tics, but a pulse is detectable.' };
  return { score, label: 'Suspiciously hand-made', summary: 'Barely any generator fingerprints. Did a human do this? Show-off.' };
}

export function fixSuggestion(findings: Finding[]): string {
  if (!findings.length) return 'Keep doing whatever delightfully unhinged thing you are doing.';
  const top = [...findings].sort((a, b) => b.points - a.points)[0];
  const map: Record<string, string> = {
    'framework-next': 'delete the starter README energy -- ship one opinionated section.',
    'framework-tailwind': 'lock one radius, one shadow, one palette -- then delete the rest.',
    'color-gradient': 'kill the purple fog and pick a color that means something.',
    'copy-cliche': 'rewrite the hero without delve, unlock, or seamless. Banned words jar.',
    'layout-hero': 'break the badge-headline-buttons script. Left-align something.',
    'layout-round': 'pick one corner radius and commit like an adult.',
    'type-shout': 'unbold two headings and let size do the talking.',
  };
  return map[top.id] ?? `fix the worst offender first: ${top.title.toLowerCase()}.`;
}
