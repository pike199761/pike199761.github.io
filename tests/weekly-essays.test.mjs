import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { postUrl, readingMinutes } from '../src/lib/posts.ts';

const slug = 'weekly-2026-09-21';
const sourceRoot = new URL('../src/content/blog/', import.meta.url);
const buildRoot = new URL('../dist/', import.meta.url);
const read = path => readFile(new URL(path, buildRoot), 'utf8');

test('the first weekly essay renders the actual publication date, coverage and every paragraph', async () => {
  const source = (await readFile(new URL(slug + '.md', sourceRoot), 'utf8')).replace(/\r\n/g, '\n');
  assert.match(source, /^pubDate: 2026-09-21$/m);
  assert.match(source, /^draft: false$/m);
  assert.match(source, /^tags: \["随笔",/m);
  const title = source.match(/^title: "(.+)"$/m)[1];
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  const html = await read('blog/' + slug + '/index.html');
  assert.ok(html.includes('<h1 class="post-title">' + title + '</h1>') || html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1] === title);
  assert.match(html, /datetime="2026-09-21T00:00:00.000Z"/);
  assert.match(html, /2026 年 9 月 14 日—9 月 21 日/);
  for (const paragraph of body.split(/\n\s*\n/)) assert.ok(html.includes('<p>' + paragraph + '</p>'), paragraph);
  assert.ok(html.includes('约 ' + readingMinutes(body) + ' 分钟阅读'));
  assert.match(html, /reading-layout without-toc/);
  assert.doesNotMatch(html, /<nav[^>]*aria-label="文章目录"/);
  assert.match(body, /还没恢复成功/);
  assert.match(body, /好像也都订满/);
  assert.match(body, /暂时也还在看方案/);
});

test('weekly slugs stay unique and agree with their publication dates, with no private notes published', async () => {
  const files = (await readdir(sourceRoot)).filter(file => /^weekly-/.test(file));
  assert.ok(files.includes(slug + '.md'));
  const dates = new Set();
  for (const file of files) {
    assert.match(file, /^weekly-\d{4}-\d{2}-\d{2}\.md$/);
    const content = await readFile(new URL(file, sourceRoot), 'utf8');
    const date = file.slice(7, -3);
    assert.ok(!dates.has(date), date + ': one weekly essay per date');
    dates.add(date);
    assert.equal(content.match(/^pubDate: (.+)$/m)?.[1].trim(), date);
    assert.doesNotMatch(content, /[A-Z]:[\\/]|pike-writing-style|pike-weekly-essays|executor_session_id|history\.jsonl|Bearer\s+[A-Za-z0-9._-]+|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}/i);
    if (/^draft:\s*true\s*$/m.test(content)) continue;
    const url = postUrl(file.slice(0, -3));
    for (const path of ['blog/index.html', 'rss.xml', 'sitemap-0.xml']) {
      assert.ok((await read(path)).includes(url), file + ': ' + path);
    }
  }
});
