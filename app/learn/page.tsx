import fs from 'fs';
import path from 'path';
import LearnClient from './LearnClient';

export default function LearnPage() {
  const guideDir = path.join(process.cwd(), 'guide', 'extend');
  let rawModules: { id: number; title: string; rawContent: string }[] = [];

  try {
    const files = fs.readdirSync(guideDir).filter(f => f.endsWith('.md')).sort();
    rawModules = files.map((file, index) => {
      const content = fs.readFileSync(path.join(guideDir, file), 'utf8');
      const titleMatch = content.match(/^# (.+)/m);
      const title = titleMatch ? titleMatch[1].replace(/^(Part \d+:\s*|Feature \d+\s*-\s*)+/g, '').trim() : file;
      return { id: index + 1, title, rawContent: content };
    });
  } catch {
    rawModules = [{ id: 1, title: 'Error', rawContent: 'Guide files not found.' }];
  }

  return <LearnClient modules={rawModules} />;
}
