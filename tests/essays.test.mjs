import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { comparePosts, postUrl, readingMinutes } from '../src/lib/posts.ts';

const expected = [
  {
    "slug": "lost-keys",
    "title": "钥匙丢了以后",
    "order": 101
  },
  {
    "slug": "after-fried-chicken",
    "title": "吃完炸鸡的第二天",
    "order": 103
  },
  {
    "slug": "half-hour-workouts",
    "title": "一周三次，每次半小时",
    "order": 104
  },
  {
    "slug": "tennis-feel",
    "title": "那筒网球从二月打到了八月",
    "order": 105
  },
  {
    "slug": "one-less-coffee",
    "title": "少喝一杯咖啡之后",
    "order": 106
  },
  {
    "slug": "paris-without-horror",
    "title": "一首歌是怎么变“恐怖”的",
    "order": 107
  },
  {
    "slug": "guts-without-a-halo",
    "title": "格斯这么凶，我还是想继续看",
    "order": 108
  },
  {
    "slug": "a-word-called-bei",
    "title": "我只是说了个“呗”",
    "order": 109
  },
  {
    "slug": "reading-manga-reading-words",
    "title": "看漫画，顺便认识几个字",
    "order": 110
  },
  {
    "slug": "project-hail-mary",
    "title": "看完《挽救计划》，又想找原著",
    "order": 111
  },
  {
    "slug": "after-the-credits",
    "title": "看完《狂怒追缉》，我去问了判几年",
    "order": 112
  },
  {
    "slug": "ai-without-outsourcing-understanding",
    "title": "AI 可以帮我做，但我不想自己什么都不懂",
    "order": 114
  },
  {
    "slug": "not-an-instruction-manual",
    "title": "我不想和一本说明书聊天",
    "order": 115
  },
  {
    "slug": "model-and-tools",
    "title": "同一个模型，换个工具为什么像换了个人",
    "order": 117
  },
  {
    "slug": "liking-xiaomi",
    "title": "喜欢小米，也想知道它到底卖得怎么样",
    "order": 118
  },
  {
    "slug": "water-on-a-leaf",
    "title": "绿萝叶尖的一滴水",
    "order": 120
  },
  {
    "slug": "shenzhen-sun",
    "title": "深圳的太阳，和别人追着晒的日光浴",
    "order": 121
  },
  {
    "slug": "living-in-suzhou",
    "title": "适合旅游的城市，也适合过日子吗",
    "order": 122
  }
];
const root = new URL('../dist/', import.meta.url);
const sourceRoot = new URL('../src/content/blog/', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');

async function publicSources() {
  const files = (await readdir(sourceRoot)).filter(file => /\.mdx?$/.test(file));
  const sources = await Promise.all(files.map(async file => ({ file, source: await readFile(new URL(file, sourceRoot), 'utf8') })));
  return sources.filter(({source}) => !/^draft:\s*true\s*$/m.test(source));
}

test('the selected eighteen essays have complete source prose, dates, tags and unique ordering', async () => {
  assert.equal(expected.length, 18);
  assert.equal(new Set(expected.map(post => post.order)).size, 18);
  assert.deepEqual(expected.map(post => post.order), [101,103,104,105,106,107,108,109,110,111,112,114,115,117,118,120,121,122]);
  const archive = await read('blog/index.html');
  const rss = await read('rss.xml');
  const sitemap = await read('sitemap-0.xml');
  for (const post of expected) {
    const source = (await readFile(new URL(post.slug + '.md', sourceRoot), 'utf8')).replace(/\r\n/g, '\n');
    assert.ok(source.startsWith('---\n'), post.slug);
    assert.ok(source.includes('title: ' + JSON.stringify(post.title)), post.slug);
    assert.match(source, /^pubDate: 2026-09-15$/m);
    assert.match(source, /^draft: false$/m);
    assert.match(source, /^tags: \[.+\]$/m);
    assert.ok(source.includes('order: ' + post.order + '\n'));
    const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
    // Guard against placeholder content, not against naturally short essays.
    assert.ok((body.match(/\p{Script=Han}/gu) ?? []).length >= 180, post.slug + ': full essay, not a placeholder');
    assert.doesNotMatch(body, /TODO|待补充|文章正文待写/);
    const html = await read('blog/' + post.slug + '/index.html');
    assert.equal(html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1], post.title, post.slug);
    assert.ok(html.includes('约 ' + readingMinutes(body) + ' 分钟阅读'), post.slug);
    assert.ok(html.includes('datetime="2026-09-15T00:00:00.000Z"'), post.slug);
    const paragraphs = body.split(/\r?\n\s*\r?\n/).filter(p => !/^[#*]/.test(p));
    assert.ok(paragraphs.length >= 4, post.slug);
    for (const p of paragraphs) assert.ok(html.includes('<p>' + p + '</p>'), post.slug + ': ' + p.slice(0,35));
    for (const [name, content] of [['archive', archive], ['RSS', rss], ['sitemap', sitemap]]) {
      assert.ok(content.includes(postUrl(post.slug)), name + ': ' + post.slug);
    }
    assert.ok(archive.includes(post.title));
    assert.ok(rss.includes(post.title));
  }
});

test('all public articles appear once in the archive and feed, while the home stays compact', async () => {
  const total = (await publicSources()).length;
  assert.ok(total >= 19);
  const archive = await read('blog/index.html');
  const rss = await read('rss.xml');
  const home = await read('index.html');
  assert.equal((archive.match(/data-post(?:\s|>)/g) ?? []).length, total);
  assert.equal((rss.match(/<item>/g) ?? []).length, total);
  assert.ok(archive.includes('共 ' + total + ' 篇文章'));
  assert.ok(home.includes('class="article-count"') && home.includes('>' + total + '</span>'));
  assert.equal((home.match(/<article(?:\s|>)/g) ?? []).length, 4);
  const sorted = (await publicSources()).map(({file, source}) => ({
    id: file.replace(/\.mdx?$/, ''),
    data: {
      pubDate: new Date(source.match(/^pubDate:\s*(.+)$/m)[1]),
      order: Number(source.match(/^order:\s*(\d+)$/m)?.[1] ?? 999),
    },
  })).sort(comparePosts);
  for (const post of sorted.slice(0,4)) assert.ok(home.includes(postUrl(post.id)), post.id);
  assert.ok(!home.includes(postUrl(sorted[4].id)), 'not all essays are dumped onto the homepage');
  for (const content of [archive, rss]) {
    let cursor = -1;
    for (const post of expected) {
      const next = content.indexOf(postUrl(post.slug));
      assert.ok(next > cursor, 'consistent editorial order: ' + post.slug);
      cursor = next;
    }
  }
});

test('sorting prioritizes publication date, then same-day order, then stable IDs', () => {
  const entry = (id, date, order) => ({id, data: {pubDate: new Date(date), order}});
  const entries = [entry('b', '2026-09-15'), entry('older', '2026-09-14', 0), entry('two', '2026-09-15', 2), entry('a', '2026-09-15'), entry('one', '2026-09-15', 1), entry('newer', '2026-09-16', 100)];
  assert.deepEqual(entries.sort(comparePosts).map(entry => entry.id), ['newer','one','two','a','b','older']);
  assert.equal(comparePosts(entries[0], entries[0]), 0);
});

test('technical essays render navigable headings while short essays stay free of an empty TOC', async () => {
  for (const slug of ['ai-without-outsourcing-understanding','model-and-tools']) {
    const html = await read('blog/' + slug + '/index.html');
    assert.match(html, /aria-label="文章目录"/);
    const links = [...html.matchAll(/href="#([^"#]+)"[^>]*data-toc-link/g)];
    assert.equal(links.length, 2);
    for (const [, id] of links) assert.ok(html.includes('id="' + id + '"'));
  }
  assert.match(await read('blog/lost-keys/index.html'), /reading-layout without-toc/);
});

test('health and plant references link to the checked public sources', async () => {
  for (const [slug, host] of [['after-fried-chicken','health.clevelandclinic.org'],['one-less-coffee','www.nhlbi.nih.gov'],['water-on-a-leaf','ipm.missouri.edu'],['water-on-a-leaf','www.ars.usda.gov'],['shenzhen-sun','www.who.int']]) {
    assert.ok((await read('blog/' + slug + '/index.html')).includes('href="https://' + host + '/'));
  }
});


test('the withdrawn watch essay is absent from the public site', async () => {
  await assert.rejects(readFile(new URL('two-watches.md', sourceRoot)), { code: 'ENOENT' });
  await assert.rejects(read('blog/two-watches/index.html'), { code: 'ENOENT' });
  for (const file of ['index.html', 'blog/index.html', 'rss.xml', 'sitemap-0.xml']) {
    assert.doesNotMatch(await read(file), /two-watches|两块表，一只手腕/);
  }
});
