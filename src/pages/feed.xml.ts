import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('posts');
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
