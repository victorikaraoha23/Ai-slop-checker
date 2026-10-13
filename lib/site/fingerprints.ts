export interface BuilderHit {
  builder: string;
  confidence: 'confirmed' | 'possible';
  evidence: string[];
}

// Markers verified against live deployments (method mirrors the public
// SITE_FINGERPRINTS research: only markers confirmed on deployed output).
const BUILDERS: Array<{
  name: string;
  strong: RegExp[];
  weak: RegExp[];
  evidence: string[];
}> = [
  {
    name: 'Lovable',
    strong: [/cdn\.gpteng\.co\/gptengineer\.js/i, /\/lovable-uploads\//i, /lovable-badge/i],
    weak: [/\/~flock\.js/i, /lovable\.dev\/opengraph-image/i],
    evidence: ['cdn.gpteng.co/gptengineer.js', '/lovable-uploads/ asset path', 'lovable-badge element', '/~flock.js (weak)', 'lovable.dev OG image (weak)'],
  },
  {
    name: 'v0',
    strong: [/<meta[^>]+name="generator"[^>]+content="v0\.(app|dev)"/i, /generator:\s*["']v0\.(app|dev)["']/i],
    weak: [],
    evidence: ['meta generator v0.app/v0.dev'],
  },
  {
    name: 'Bolt',
    strong: [/bolt\.new\/badge\.js/i, /bolt\.new\/deployed-preview-script\.js/i],
    weak: [],
    evidence: ['bolt.new badge / preview script'],
  },
  {
    name: 'Base44',
    strong: [/data-platform-url="https:\/\/app\.base44\.com"/i, /base44_access_token/i, /base44\.com\/images\/public\//i],
    weak: [],
    evidence: ['base44 platform URL / token / image host'],
  },
  {
    name: 'Replit',
    strong: [/replit\.com\/public\/js\/replit-dev-banner\.js/i, /replit-badge/i],
    weak: [],
    evidence: ['replit dev banner / badge'],
  },
  {
    name: 'Same',
    strong: [/same-assets\.com/i],
    weak: [],
    evidence: ['same-assets.com host'],
  },
  {
    name: 'Create',
    strong: [/\.created\.app/i],
    weak: [/create\.xyz/i],
    evidence: ['.created.app host', 'create.xyz ref (weak)'],
  },
];

export function detectBuilders(html: string, headers: Record<string, string>): BuilderHit[] {
  const hits: BuilderHit[] = [];
  const poweredBy = headers['x-powered-by'] ?? headers['X-Powered-By'] ?? '';
  if (/bolt\.new/i.test(poweredBy)) {
    hits.push({ builder: 'Bolt', confidence: 'confirmed', evidence: ['X-Powered-By: Bolt.new response header'] });
  }
  for (const b of BUILDERS) {
    const strongHits = b.strong.filter((re) => re.test(html));
    const weakHits = b.weak.filter((re) => re.test(html));
    if (strongHits.length >= 1 || weakHits.length >= 2) {
      hits.push({
        builder: b.name,
        confidence: 'confirmed',
        evidence: strongHits.map((_, i) => b.evidence[i]).filter(Boolean),
      });
    } else if (weakHits.length === 1 && !hits.some((h) => h.builder === b.name)) {
      hits.push({ builder: b.name, confidence: 'possible', evidence: ['single weak marker'] });
    }
  }
  return hits;
}

export function siteVerdict(hits: BuilderHit[]): string {
  if (!hits.length) return 'No builder fingerprints — hand-built or markers removed.';
  const c = hits.filter((h) => h.confidence === 'confirmed');
  if (c.length) return `Built with ${c.map((h) => h.builder).join(' + ')} (confirmed).`;
  return `Possibly built with ${hits.map((h) => h.builder).join(', ')}.`;
}
