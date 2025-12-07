import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('posts')).sort((a, b) =>
    // newest -> oldest
    b.data.published.valueOf() - a.data.published.valueOf())
  return rss({
    title: 'willbadart.com',
    description: "Will's posts and notes",
    site: site!,
    items: posts.map(post => ({
      title: post.data.title,
      link: `/posts/${post.id}?src=rss`,
      // TODO: investigate adding full content
    })),
  });
}
