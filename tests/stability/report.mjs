/*
  Turns tests/.results/*.json into a failure list grouped by likely cause.

    node tests/stability/report.mjs [output.md]

  A cause is the element at the root of a movement (the first changed box in
  document order, preferring one whose size changed), the step that moved it
  and whether it settled or only moved during the step. Everything below the
  root that shifted with it is counted, not listed.
*/
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dir = 'tests/.results';
const out = process.argv[2];

const stem = (label) => label.replace(/#\d+$/, '').replace(/\[field=[^\]]*\]/, '[field]').replace(/\[aria="[^"]*"\]/, '[aria]').replace(/\("[^"]*"\)/, '');

const rows = [];
let tests = 0;
let withFailures = 0;
const sw = [];
const errors = [];
const residual = [];

for (const f of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const r = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  tests++;
  if (r.failures.length) withFailures++;
  for (const x of r.failures) {
    if (x.phase === 'scroll-width') {
      sw.push(x);
      continue;
    }
    if (x.phase === 'error') {
      errors.push(x);
      continue;
    }
    if (x.phase === 'residual') {
      residual.push(x);
      continue;
    }
    const sized = x.diffs.find((d) => d.dw !== 0 || d.dh !== 0 || d.detached);
    const root = sized ?? x.diffs[0];
    if (!root) continue;
    rows.push({ x, root, count: x.diffs.length });
  }
}

const groups = new Map();
for (const row of rows) {
  const key = `${row.root.group} | ${stem(row.root.label)} | ${row.x.step} | ${row.x.phase}${row.root.detached ? ' | replaced' : ''}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}

const fmt = (d) => `dx ${d.dx}, dy ${d.dy}, dw ${d.dw}, dh ${d.dh}${d.detached ? ', replaced' : ''}`;
const lines = [];
lines.push('# E3 edit-mode stability results', '');
lines.push(`Result files: ${tests}. With at least one failing check: ${withFailures}.`);
lines.push(`Movement records: ${rows.length}. Distinct causes: ${groups.size}.`);
lines.push(`Scroll-width failures: ${sw.length}. Harness errors: ${errors.length}. Residual drafts after Discard: ${residual.length}.`, '');

const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
sorted.forEach(([key, list], n) => {
  const [group, element, step, phase, extra] = key.split(' | ');
  lines.push(`## Cause ${n + 1}: ${element} (${group}), ${step}, ${phase}${extra ? `, ${extra}` : ''}`, '');
  lines.push(`${list.length} records across ${new Set(list.map((r) => r.x.page)).size} pages, widths ${[...new Set(list.map((r) => r.x.width))].join('/')}, browsers ${[...new Set(list.map((r) => r.x.browser))].join('/')}.`, '');
  lines.push('| page | width | browser | field | element | delta | also shifted |', '| --- | --- | --- | --- | --- | --- | --- |');
  for (const r of list) {
    lines.push(`| ${r.x.page} | ${r.x.width} | ${r.x.browser} | ${r.x.field.replace(/\|/g, '/')} | ${r.root.label.replace(/\|/g, '/')} | ${fmt(r.root)} | ${r.count - 1} |`);
  }
  lines.push('');
});

if (sw.length) {
  lines.push('## Horizontal scroll (scrollWidth differs from the viewport)', '', '| page | width | browser | step | detail |', '| --- | --- | --- | --- | --- |');
  for (const x of sw) lines.push(`| ${x.page} | ${x.width} | ${x.browser} | ${x.step} ${x.field} | ${x.detail} |`);
  lines.push('');
}
if (residual.length) {
  lines.push('## Drafts left after Discard', '', '| page | width | browser | detail |', '| --- | --- | --- | --- |');
  for (const x of residual) lines.push(`| ${x.page} | ${x.width} | ${x.browser} | ${x.detail} |`);
  lines.push('');
}
if (errors.length) {
  lines.push('## Harness errors (a step could not run; not movement)', '', '| page | width | browser | field | detail |', '| --- | --- | --- | --- | --- |');
  for (const x of errors) lines.push(`| ${x.page} | ${x.width} | ${x.browser} | ${x.field.replace(/\|/g, '/')} | ${(x.detail ?? '').replace(/\|/g, '/')} |`);
  lines.push('');
}

const text = lines.join('\n');
if (out) writeFileSync(out, text);
else process.stdout.write(text);
