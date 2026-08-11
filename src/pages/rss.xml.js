import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts', (post) => {
    return import.meta.env.DEV ? true : post.data.draft !== true;
  });
  const sorted = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: '我的博客',
    description: '死宅 / 技术笨蛋 / 社交恐怖分子',
    site: context.site,
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}`,
    })),
    customData: `<language>zh-CN</language>`,
  });
}
