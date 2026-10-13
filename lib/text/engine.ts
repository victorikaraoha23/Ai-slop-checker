export interface TextEngineResult {
  engine: string;
  code: string;
  kind: 'statistical' | 'linguistic' | 'structural';
  score: number; // 0..1, higher = more AI-like
  label: string; // clean | suspicious | slop
  details: string;
}

export interface TextAnalysis {
  score: number; // 0..100
  verdict: string;
  confidence: 'low' | 'medium' | 'high';
  enginesFlagged: number;
  enginesTotal: number;
  engines: TextEngineResult[];
  wordCount: number;
  language: string;
  paragraphs: Array<{ index: number; score: number; label: string; preview: string }>;
}

export function engineLabel(score: number): string {
  if (score < 0.4) return 'clean';
  if (score < 0.65) return 'suspicious';
  return 'slop';
}

export interface Engine {
  name: string;
  code: string;
  kind: TextEngineResult['kind'];
  describe: string;
  run(text: string): Omit<TextEngineResult, 'engine' | 'code' | 'kind' | 'label'>;
}

export function wrap(e: Engine, text: string): TextEngineResult {
  try {
    const r = e.run(text);
    const score = Math.max(0, Math.min(1, r.score));
    return { engine: e.name, code: e.code, kind: e.kind, score, label: engineLabel(score), details: r.details };
  } catch {
    return { engine: e.name, code: e.code, kind: e.kind, score: 0, label: 'clean', details: 'Engine skipped (input too short).' };
  }
}
