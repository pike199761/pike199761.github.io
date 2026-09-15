import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { comparePosts, postUrl } from '../lib/posts';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
export async function GET(context) {
  const posts = (await getCollection('blog')).filter(post => !post.data.draft).sort(comparePosts);
  return rss({ title: SITE_TITLE, description: SITE_DESCRIPTION, site: context.site, items: posts.map(post => ({ title: post.data.title, description: post.data.description, pubDate: post.data.pubDate, link: postUrl(post.id) })) });
}
