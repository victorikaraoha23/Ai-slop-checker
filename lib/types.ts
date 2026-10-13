export interface Evidence {
  label: string;
  detail?: string;
}

export interface Finding {
  id: string;
  category: 'framework' | 'type' | 'color' | 'copy' | 'layout' | 'imagery';
  title: string;
  points: number;
  roast: string;
  note: string;
  evidence: Evidence[];
}

export interface GoodMark {
  title: string;
  note: string;
}

export interface Verdict {
  score: number;
  label: string;
  summary: string;
}

export interface CheckResult {
  host: string;
  findings: Finding[];
  goodMarks: GoodMark[];
  score: number;
  verdict: Verdict;
  screenshotUrl: string | null;
  pageTitle: string | null;
  checkedAt: string;
}
