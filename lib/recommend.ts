import type { Finding } from './types';

/* ------------------------------------------------------------------ *
 * "How do I fix this?" — every detector maps to a concrete, ranked
 * improvement. Shown as an Improvement Plan next to each verdict so
 * users leave knowing exactly what to change, not just what stings.
 * ------------------------------------------------------------------ */

export interface Recommendation {
  findingId: string;
  title: string;
  /** Concrete, do-this action. */
  fix: string;
  /** Rough effort, shown as a chip. */
  effort: 'quick' | 'moderate' | 'project';
  points: number;
}

const FIXES: Record<string, [string, Recommendation['effort']]> = {
  // framework / builder
  'framework-next': ['Swap the starter shell for a custom layout — one opinionated hero, real navigation, a footer with something to say.', 'project'],
  'framework-vercel': ['Fine to host here; stop leaning on the default Vercel demo look. Give the brand a distinct surface.', 'quick'],
  'framework-tailwind': ['Lock ONE radius, ONE shadow scale, ONE palette token set, then delete the loose utilities.', 'moderate'],
  'framework-shadcn': ['Customize the shadcn components you keep — restyle buttons/cards or the output reads as default.', 'moderate'],
  'framework-lovable': ['Remove the Lovable badge + uploader paths, then re-skin the generated sections in your own style.', 'moderate'],
  'framework-v0': ['Strip v0 generation markers and rebuild the hero/sections with your own components.', 'moderate'],
  'framework-framer': ['Replace Framer template blocks with custom-built sections so it stops reading as a template.', 'project'],
  'framework-webflow': ['Move off the stock Webflow sections into a layout that only your product needs.', 'project'],
  'framework-wix': ['Drop the Wix chrome and widgets; build a leaner, faster page that looks nothing like the catalog.', 'project'],
  'framework-squarespace': ['Leave the Squarespace template shell — define your own grid, type and color.', 'project'],
  'framework-bubble': ['Rebuild the UI in a framework you control so the Bubble markers disappear.', 'project'],
  'framework-replit': ['Remove the Replit dev banner and give the app a real product surface.', 'quick'],

  // type
  'type-inter': ['Pair Inter with a deliberate display face, or set tighter tracking so it stops reading as default.', 'moderate'],
  'type-geist': ['Geist is fine — commit to it with real hierarchy instead of letting it autopilot.', 'quick'],
  'type-poppins': ['Keep Poppins for accents only; use a text serif or grotesque for body copy.', 'moderate'],
  'type-spacegrotesk': ['Tone down the display size/weight so the quirk is a garnish, not the whole personality.', 'quick'],
  'type-dmsans': ['Swap DM Sans for at least one section, or add real typographic contrast.', 'moderate'],
  'type-sora': ['Pick a more current display face, or use Sora sparingly with a neutral body font.', 'quick'],
  'type-shout': ['Unbold two of every three headings and let size — not weight — create the hierarchy.', 'quick'],

  // color
  'color-gradient': ['Kill the purple fog. Pick one brand color that means something and use flat surfaces.', 'moderate'],
  'color-gradient-lite': ['Dial gradients to a single subtle accent instead of a wash across everything.', 'quick'],
  'color-stock': ['Choose an off-catalog palette — a real ink, a real paper, one signal color.', 'moderate'],
  'color-glass': ['Replace frosted panels with solid, legible surfaces; keep blur for one focal element at most.', 'moderate'],

  // copy
  'copy-cliche': ['Rewrite the hero in plain language. Delete delve/unlock/seamless/elevate — say the concrete thing.', 'moderate'],
  'copy-cliche-lite': ['Rewrite the two or three softest phrases into specific, verifiable claims.', 'moderate'],
  'copy-cliche-one': ['Replace that one buzzword with what actually happens for the user.', 'quick'],
  'copy-emoji': ['Remove decorative emoji from headings/buttons; let the words carry it.', 'quick'],
  'copy-placeholder': ['Replace lorem/placeholder text with real copy before you ship.', 'quick'],

  // layout
  'layout-round': ['Pick one corner radius (say 8px) and apply it everywhere; reserve larger radii for media.', 'quick'],
  'layout-cta': ['Break the badge→headline→two-buttons script. Lead with one specific sentence.', 'moderate'],
  'layout-icons': ['Use one consistent icon set at one weight/size, or drop icons where they add nothing.', 'quick'],
  'layout-hero': ['Left-align the hero or give it an asymmetric layout so it stops matching the template.', 'moderate'],
  'layout-logos': ['Replace the grey logo wall with one real testimonial or a concrete number.', 'moderate'],

  // imagery
  'img-stock': ['Swap stock hero imagery for a real product shot, a diagram, or typography.', 'moderate'],
  'img-blob': ['Remove the decorative blob; use purposeful negative space or a real visual.', 'quick'],
  'img-faces': ['Use real customer photos/quotes or cut the testimonial section entirely.', 'moderate'],

  // seo
  'seo-desc': ['Add a unique <meta name="description"> under ~155 chars.', 'quick'],
  'seo-h1': ['Add exactly one <h1> that states what the page is.', 'quick'],
  'seo-alt': ['Write meaningful alt text for content images; mark decorative ones alt="".', 'moderate'],
};

/** Ranked, de-duplicated improvement plan for a set of findings. */
export function recommendations(findings: Finding[], limit = 6): Recommendation[] {
  const seen = new Set<string>();
  const out: Recommendation[] = [];
  const sorted = [...findings].sort((a, b) => b.points - a.points);
  for (const f of sorted) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    const mapped = FIXES[f.id];
    if (mapped) {
      out.push({ findingId: f.id, title: f.title, fix: mapped[0], effort: mapped[1], points: f.points });
    } else {
      out.push({ findingId: f.id, title: f.title, fix: `Address "${f.title}" — ${f.note}`, effort: 'moderate', points: f.points });
    }
    if (out.length >= limit) break;
  }
  return out;
}

/** Per-engine writing tips for the text/document labs. */
const ENGINE_TIPS: Record<string, string> = {
  SP: 'Cut stock phrases (delve, seamless, unlock). Replace each with the plain, specific word.',
  BU: 'Vary sentence length — drop a 4-word sentence between long ones to break the metronome.',
  VO: 'Stop reusing the same nouns; name concrete things instead of "solution / platform / approach".',
  EC: 'Rewrite repeated openers (starting three sentences with "The…"). Merge duplicated n-grams.',
  RU: 'Let one paragraph read plainly and another get technical — flattening registers is the tell.',
  PX: 'Swap filler ("various", "numerous", "it is important to note") for specifics.',
  SA: 'Break up the listicles, em-dash chains and "furthermore / in conclusion" scaffolding.',
  SE: 'Add a real opinion or caveat somewhere — uniformly positive prose reads machine-made.',
};

export function engineTip(code: string): string {
  return ENGINE_TIPS[code] ?? 'Rewrite this passage in your own voice and reread it aloud.';
}
