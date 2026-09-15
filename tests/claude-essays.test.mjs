import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { postUrl, readingMinutes } from '../src/lib/posts.ts';

const expected = [
  {
    "slug": "piano-after-five-years",
    "title": "五年没弹琴的人，还能回去吗",
    "order": 1
  },
  {
    "slug": "goats-on-a-nanshan-hill",
    "title": "我记得南山有一座养羊的小山",
    "order": 2
  },
  {
    "slug": "halfway-through-philosophers-stone",
    "title": "《魔法石》读到一半，我还是得查单词",
    "order": 3
  },
  {
    "slug": "hard-to-sit-down-with-a-novel",
    "title": "我不是不喜欢小说了，只是越来越难坐下来",
    "order": 4
  },
  {
    "slug": "the-score-and-the-rest-of-my-day",
    "title": "一场球输了，为什么我的一天也跟着变了",
    "order": 5
  },
  {
    "slug": "milk-at-my-desk",
    "title": "工位上有一瓶鲜奶",
    "order": 6
  },
  {
    "slug": "a-window-i-cannot-see",
    "title": "植物搬到窗边，我就看不到了",
    "order": 7
  },
  {
    "slug": "what-a-more-expensive-car-buys",
    "title": "速腾已经很好开了，贵出来的车贵在哪里",
    "order": 8
  },
  {
    "slug": "a-game-that-always-says-yes",
    "title": "游戏里什么都听我的，为什么反而无聊",
    "order": 9
  },
  {
    "slug": "every-match-was-nil-nil",
    "title": "我让 AI 做了一个足球经理，所有比赛都是零比零",
    "order": 10
  },
  {
    "slug": "a-trip-without-the-famous-stops",
    "title": "旅行不一定要把最有名的地方走一遍",
    "order": 11
  },
  {
    "slug": "why-did-he-do-that",
    "title": "詹姆为什么让布蕾妮去找珊莎",
    "order": 12
  },
  {
    "slug": "rankings-and-an-ordinary-day",
    "title": "国家排名很好看，普通人的日子呢",
    "order": 13
  },
  {
    "slug": "generated-is-not-verified",
    "title": "AI 写出来了，不等于事情做对了",
    "order": 14
  }
];

const root = new URL('../dist/', import.meta.url);
const sourceRoot = new URL('../src/content/blog/', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const source = async slug => (await readFile(new URL(slug + '.md', sourceRoot), 'utf8')).replace(/\r\n/g, '\n');
const bodyOf = content => content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();

test('fourteen new essays have finished prose, publication metadata and distinct editorial order', async () => {
  assert.equal(expected.length, 14);
  assert.equal(new Set(expected.map(post => post.slug)).size, 14);
  assert.deepEqual(expected.map(post => post.order), Array.from({length: 14}, (_, index) => index + 1));
  for (const post of expected) {
    const content = await source(post.slug);
    const body = bodyOf(content);
    assert.ok(content.startsWith('---\n'));
    assert.ok(content.includes('title: ' + JSON.stringify(post.title)));
    assert.match(content, /^pubDate: 2026-09-15$/m);
    assert.match(content, /^draft: false$/m);
    assert.match(content, /^tags: \[.+\]$/m);
    assert.ok(content.includes('order: ' + post.order + '\n'));
    // Guard against placeholder content, not against naturally short essays.
    assert.ok((body.match(/\p{Script=Han}/gu) ?? []).length >= 180, post.slug + ': complete prose');
    assert.doesNotMatch(body, /TODO|待补充|文章正文待写|lorem ipsum/i);
    const html = await read('blog/' + post.slug + '/index.html');
    assert.equal(html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1], post.title, post.slug);
    assert.ok(html.includes('约 ' + readingMinutes(body) + ' 分钟阅读'), post.slug);
    assert.ok(html.includes('datetime="2026-09-15T00:00:00.000Z"'), post.slug);
    const paragraphs = body.split(/\n\s*\n/).filter(paragraph => !/^[#*]/.test(paragraph));
    assert.ok(paragraphs.length >= 4, post.slug);
    for (const paragraph of paragraphs) assert.ok(html.includes('<p>' + paragraph + '</p>'), post.slug + ': rendered prose');
  }
});

test('the second batch appears first in the archive and RSS, with only four essays on the home', async () => {
  const archive = await read('blog/index.html');
  const rss = await read('rss.xml');
  const home = await read('index.html');
  const sitemap = await read('sitemap-0.xml');
  const cards = [...archive.matchAll(/<a\b[^>]*data-post(?:\s|>)[\s\S]*?<\/a>/g)];
  const items = [...rss.matchAll(/<item>[\s\S]*?<\/item>/g)];
  assert.equal(cards.length, 33);
  assert.equal(items.length, 33);
  assert.ok(archive.includes('共 33 篇文章'));
  assert.equal((home.match(/<article(?:\s|>)/g) ?? []).length, 4);
  for (const [index, post] of expected.entries()) {
    const url = postUrl(post.slug);
    assert.ok(cards[index][0].includes(url), post.slug + ': archive position');
    assert.ok(items[index][0].includes(url), post.slug + ': feed position');
    assert.equal(items.filter(([item]) => item.includes(url)).length, 1);
    assert.ok(sitemap.includes(url), post.slug + ': sitemap');
    assert.equal(home.includes(url), index < 4, post.slug + ': compact home');
  }
});

test('all thirty-three public sources have a route and occur exactly once in each discovery surface', async () => {
  const files = (await readdir(sourceRoot)).filter(file => /\.mdx?$/.test(file));
  const archive = await read('blog/index.html');
  const rss = await read('rss.xml');
  const sitemap = await read('sitemap-0.xml');
  const cards = [...archive.matchAll(/<a\b[^>]*data-post(?:\s|>)[\s\S]*?<\/a>/g)].map(match => match[0]);
  const items = [...rss.matchAll(/<item>[\s\S]*?<\/item>/g)].map(match => match[0]);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  let total = 0;
  for (const file of files) {
    const content = await readFile(new URL(file, sourceRoot), 'utf8');
    if (/^draft:\s*true\s*$/m.test(content)) continue;
    total++;
    const slug = file.replace(/\.mdx?$/, '');
    const url = postUrl(slug);
    assert.equal(cards.filter(card => card.includes('href="' + url + '"')).length, 1, slug);
    assert.equal(items.filter(item => item.includes(url)).length, 1, slug);
    assert.equal(locations.filter(location => location.endsWith(url)).length, 1, slug);
    const html = await read('blog/' + slug + '/index.html');
    assert.match(html, /<h1\b/);
  }
  assert.equal(total, 33);
});

test('the reflective essays retain uncertainty rather than inventing completed experiences', async () => {
  assert.match(bodyOf(await source('piano-after-five-years')), /没有恢复练习/);
  assert.match(bodyOf(await source('goats-on-a-nanshan-hill')), /没有一个能确定的答案/);
  assert.match(bodyOf(await source('milk-at-my-desk')), /没调出来喝过/);
  assert.match(bodyOf(await source('a-trip-without-the-famous-stops')), /还没决定具体怎么走/);
  assert.match(bodyOf(await source('generated-is-not-verified')), /虚构的简单例子/);
  const characterEssay = await read('blog/why-did-he-do-that/index.html');
  assert.match(characterEssay, /<em>有《权力的游戏》人物关系和情节剧透。<\/em>/);
});

test('the verification essay exposes working section links; short prose has no empty contents box', async () => {
  const html = await read('blog/generated-is-not-verified/index.html');
  const links = [...html.matchAll(/href="#([^"#]+)"[^>]*data-toc-link/g)];
  assert.equal(links.length, 2);
  for (const [, id] of links) assert.ok(html.includes('id="' + id + '"'));
  assert.match(await read('blog/milk-at-my-desk/index.html'), /reading-layout without-toc/);
});

test('published essays contain no local conversation artifacts or credential-shaped material', async () => {
  for (const post of expected) {
    const content = await source(post.slug);
    assert.doesNotMatch(content, /[A-Z]:[\\/](?:Users|codex_proj)[\\/]|audit\.jsonl|history\.jsonl|local-agent-mode-sessions/i, post.slug);
    assert.doesNotMatch(content, /(?:api[_-]?key|access[_-]?token|authorization)\s*[:=]|Bearer\s+[A-Za-z0-9._-]+|sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}/i, post.slug);
  }
});
