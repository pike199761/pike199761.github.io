import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readingMinutes, postUrl } from '../src/lib/posts.ts';

const root = new URL('../dist/', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const articleUrl = postUrl('现在的小霸王');
const articlePath = articleUrl.slice(1) + 'index.html';
const oldArticleUrl = postUrl('这个博客居然真做出来了');
const redirectPath = oldArticleUrl.slice(1) + 'index.html';
const redirectFile = fileURLToPath(new URL(redirectPath, root));

test('reading time supports Chinese, English, empty and mixed text', () => {
  assert.equal(readingMinutes(), 1);
  assert.equal(readingMinutes('你好'), 1);
  assert.equal(readingMinutes('字'.repeat(701)), 3);
  assert.equal(readingMinutes('word '.repeat(401)), 3);
  assert.equal(readingMinutes('字'.repeat(350) + ' word'.repeat(200)), 2);
  assert.equal(readingMinutes('```js\n' + 'code '.repeat(1000) + '\n```'), 1);
});

test('post links escape reserved characters without flattening nested slugs', () => {
  assert.equal(postUrl('notes/你好 #?'), '/blog/notes/%E4%BD%A0%E5%A5%BD%20%23%3F/');
});

async function htmlFiles(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) result.push(...await htmlFiles(path));
    else if (item.name.endsWith('.html')) result.push(path);
  }
  return result;
}

test('every content page has one main, one h1, metadata and an accessible skip target', async () => {
  const files = await htmlFiles(fileURLToPath(root));
  assert.ok(files.length >= 4);
  for (const file of files) {
    if (file === redirectFile) continue; // This exact legacy route has its own strict redirect test.
    const html = await readFile(file, 'utf8');
    assert.match(html, /<!doctype html>/i, file);
    assert.match(html, /<html[^>]+lang="zh-CN"/, file);
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, file);
    assert.equal((html.match(/<main(?:\s|>)/g) ?? []).length, 1, file);
    assert.match(html, /id="main-content" tabindex="-1"/, file);
    assert.match(html, /href="#main-content"/, file);
    assert.match(html, /<meta name="description" content="[^"]+"/, file);
    assert.match(html, /<link rel="canonical" href="https:\/\/pike199761.github.io\//, file);
    assert.doesNotMatch(html, /astro-dev-toolbar/, file);
  }
});

test('local links and image/script/style assets exist in the production build', async () => {
  const { stat } = await import('node:fs/promises');
  for (const file of await htmlFiles(fileURLToPath(root))) {
    const html = await readFile(file, 'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/(?!\/)[^"#?]*)(?:[?#][^"]*)?"/g)) {
      const path = decodeURIComponent(match[1]);
      let target = join(fileURLToPath(root), path);
      if (path.endsWith('/')) target = join(target, 'index.html');
      assert.ok((await stat(target)).isFile(), `${file}: ${path}`);
    }
  }
});

test('archive controls progressively enhance an already readable article list', async () => {
  const html = await read('blog/index.html');
  assert.match(html, /data-archive-tools[^>]*hidden/);
  assert.match(html, /data-post/);
  assert.match(html, /type="search"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-no-results[^>]*hidden/);
});

test('new essay renders its title, date, full prose and reading time without an empty TOC', async () => {
  const html = await read(articlePath);
  const source = await readFile(new URL('../src/content/blog/现在的小霸王.md', import.meta.url), 'utf8');
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
  const paragraphs = body.split(/\r?\n\s*\r?\n/);
  assert.ok(paragraphs.length >= 8);
  for (const paragraph of paragraphs) assert.ok(html.includes('<p>' + paragraph + '</p>'), paragraph);
  assert.ok(html.includes('约 ' + readingMinutes(body) + ' 分钟阅读'));
  assert.match(html, /<h1[^>]*>现在的小霸王<\/h1>/);
  assert.match(html, /<time datetime="2026-09-14T00:00:00.000Z"/);
  assert.match(html, /data-reading-progress/);
  assert.match(html, /reading-layout without-toc/);
  assert.doesNotMatch(html, /<aside[^>]*class="toc"|<nav[^>]*aria-label="文章目录"/);
});

test('the old article URL redirects immediately to the new essay and is not indexed', async () => {
  const html = await read(redirectPath);
  assert.ok(html.includes('<meta http-equiv="refresh" content="0;url=' + articleUrl + '">'));
  assert.ok(html.includes('<link rel="canonical" href="https://pike199761.github.io' + articleUrl + '">'));
  assert.ok(html.includes('<a href="' + articleUrl + '">'));
  assert.match(html, /<meta name="robots" content="noindex">/);
  const sitemap = await read('sitemap-0.xml');
  assert.ok(sitemap.includes(articleUrl));
  assert.ok(!sitemap.includes(oldArticleUrl));
});

test('home, archive and RSS expose only the replacement article', async () => {
  for (const path of ['index.html', 'blog/index.html', 'rss.xml']) {
    const content = await read(path);
    assert.match(content, /现在的小霸王/, path);
    assert.ok(content.includes(articleUrl), path);
    assert.doesNotMatch(content, /这个博客居然真做出来了|前一秒还在聊电影|希望下次打开它/, path);
    assert.ok(!content.includes(oldArticleUrl), path);
  }
  assert.equal(((await read('rss.xml')).match(/<item>/g) ?? []).length, 1);
});

test('drafts are excluded from article routes as well as the feed and lists', async () => {
  const source = await readFile(new URL('../src/pages/blog/[...slug].astro', import.meta.url), 'utf8');
  assert.match(source, /getCollection\('blog', \(\{ data \}\) => !data.draft\)/);
  const rss = await read('rss.xml');
  assert.match(rss, /现在的小霸王/);
  assert.match(await read('sitemap-index.xml'), /sitemap/);
});

test('home keeps one clear article section without a decorative cover or interest grid', async () => {
  const html = await read('index.html');
  assert.equal((html.match(/<section(?:\s|>)/g) ?? []).length, 1);
  assert.match(html, /id="latest-heading"/);
  assert.match(html, /阅读全文/);
  assert.match(html, /全部文章/);
  assert.doesNotMatch(html, /<img(?:\s|>)|HELLO, I'M PIKE|KEEP CARING|兴趣所在|THOUGHTS &amp;/);
  assert.doesNotMatch(html, /as="font"|fonts\.googleapis|fonts\.gstatic/);
});

test('layered theme separates brand orange from accessible text colors and matches browser chrome', async () => {
  const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  const color = token => {
    const match = css.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, 'i'));
    assert.ok(match, `missing color token: ${token}`);
    return match[1];
  };
  const luminance = hex => {
    const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return linear.reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
  };
  for (const background of ['paper', 'paper-2', 'card', 'orange-soft']) {
    for (const text of ['ink', 'muted', 'orange-dark']) {
      const values = [luminance(color(background)), luminance(color(text))].sort((a, b) => b - a);
      const contrast = (values[0] + 0.05) / (values[1] + 0.05);
      assert.ok(contrast >= 4.5, `${text} on ${background}: ${contrast.toFixed(2)}:1`);
    }
  }
  assert.equal(color('orange'), '#ff6900');
  assert.notEqual(color('paper'), color('orange'));
  assert.notEqual(color('paper'), color('card'));
  assert.ok((await read('index.html')).includes(`name="theme-color" content="${color('paper')}"`));
  assert.match(await read('favicon.svg'), /fill="#ff6900"/);
  assert.match(await read('index.html'), /class="intro-art" aria-hidden="true"/);
});
