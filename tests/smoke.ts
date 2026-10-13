import { analyzeText } from '../lib/text/ensemble';
import { detectBuilders } from '../lib/site/fingerprints';
import { analyzeHtml, scoreFindings } from '../lib/analyze';
import { quickScore } from '../lib/text/ensemble';

const AI_SAMPLE = `Delve into the future of seamless productivity. Our cutting-edge, all-in-one platform empowers teams to unlock next-level results. Furthermore, it is important to note that leveraging robust innovation has never been easier. In conclusion, this game-changer will supercharge your workflow like never before. Additionally, the seamless interface elevates every interaction. Moreover, our revolutionary approach streamlines success. Lastly, unlock your potential today.`;

const HUMAN_SAMPLE = `I missed the bus on Tuesday because the rain had other plans. The driver waved as he passed, or maybe he was just adjusting the mirror — hard to tell through a fogged window. I walked instead, past the bakery that always smells better than it tastes, and arrived late with wet socks and a decent excuse. Nobody believed me, which felt fair.`;

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ok - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name} ${extra}`); }
}

const AI_DENSE = `In today's fast-paced digital landscape, leveraging cutting-edge innovation is crucial. Our all-in-one solution empowers visionaries to unlock seamless success. Delve into a realm where robust synergy meets next-level transformation. Furthermore, our game-changer supercharges outcomes. Moreover, streamline your journey with unparalleled excellence. Additionally, unleash the power of tomorrow, today. In conclusion, this revolutionary testament to progress will elevate your trajectory like never before. It is important to note that our pivotal platform delivers a tapestry of robust capabilities.`;

console.log('text ensemble');
const ai = analyzeText(AI_SAMPLE);
check('AI sample scores 40+', ai.score >= 40, `got ${ai.score}`);
const aiDense = analyzeText(AI_DENSE);
check('dense AI sample scores 40+', aiDense.score >= 40, `got ${aiDense.score}`);
check('8 engines ran', ai.enginesTotal === 8, `got ${ai.enginesTotal}`);
check('stock engine flags', ai.engines.find((e) => e.code === 'SP')!.score > 0.5);
check('heatmap built', ai.paragraphs.length >= 1);
const human = analyzeText(HUMAN_SAMPLE);
check('human sample scores clean-ish', human.score < 55, `got ${human.score}`);
check(
  'AI/human separation holds',
  aiDense.score - human.score >= 15,
  `ai=${aiDense.score} human=${human.score}`,
);

const q = quickScore(AI_SAMPLE);
check('quick score labels ai/mixed', q.label === 'ai' || q.label === 'mixed', `got ${q.label}`);

console.log('site fingerprints');
const lovable = detectBuilders('<script src="https://cdn.gpteng.co/gptengineer.js"></script><img src="/lovable-uploads/x.png">', {});
check('lovable confirmed', lovable.some((h) => h.builder === 'Lovable' && h.confidence === 'confirmed'));
const v0 = detectBuilders('<meta name="generator" content="v0.app">', {});
check('v0 confirmed', v0.some((h) => h.builder === 'v0'));
const bolt = detectBuilders('<html></html>', { 'x-powered-by': 'Bolt.new' });
check('bolt via header', bolt.some((h) => h.builder === 'Bolt'));
const clean = detectBuilders('<html><body><h1>hand made</h1></body></html>', {});
check('clean page, no hits', clean.length === 0);

console.log('design heuristics');
const { findings } = analyzeHtml('<html><head><title>My Cool App</title></head><body class="flex bg-gradient-to-r from-violet-500 to-blue-500 rounded-2xl"><h1 class="font-bold">Unlock seamless synergy</h1></body></html>');
check('design findings found', findings.length > 0);
check('design score in range', scoreFindings(findings) >= 0 && scoreFindings(findings) <= 100);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
