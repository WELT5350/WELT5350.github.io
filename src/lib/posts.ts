import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'posts'>;

export interface SiteArchiveStats {
  postCount: number;
  tagCount: number;
  totalUnits: number;
  latestPost: BlogPost | undefined;
}

export function getPublishedPosts(posts: BlogPost[]): BlogPost[] {
  return import.meta.env.DEV ? posts : posts.filter((post) => post.data.draft !== true);
}

export function sortPostsByDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function countTextUnits(body: string): number {
  const chineseChars = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (body.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

export function getSiteArchiveStats(posts: BlogPost[]): SiteArchiveStats {
  const sortedPosts = sortPostsByDate(posts);
  const tags = new Set(sortedPosts.flatMap((post) => post.data.tags || []));

  return {
    postCount: sortedPosts.length,
    tagCount: tags.size,
    totalUnits: sortedPosts.reduce((total, post) => total + countTextUnits(post.body || ''), 0),
    latestPost: sortedPosts[0],
  };
}

export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}
