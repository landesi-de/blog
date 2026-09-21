import { createClient, type MicroCMSImage, type MicroCMSListContent } from 'microcms-js-sdk';

const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

if (!serviceDomain || !apiKey) {
  throw new Error('MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を .env に設定してください。');
}

export const client = createClient({
  serviceDomain,
  apiKey,
});

export type Blog = {
  title: string;
  content: string;
  eyecatch?: MicroCMSImage;
  category?: string | string[];
  tags?: string | string[];
} & MicroCMSListContent;

export async function getBlogs() {
  return client.getList<Blog>({
    endpoint: 'blog',
    queries: {
      orders: '-publishedAt',
      limit: 100,
    },
  });
}

export function getCategoryValues(post: Pick<Blog, 'category' | 'tags'>): string[] {
  const rawValues = [
    ...(Array.isArray(post.category) ? post.category : post.category ? [post.category] : []),
    ...(Array.isArray(post.tags) ? post.tags : post.tags ? [post.tags] : []),
  ];

  return [...new Set(rawValues.map((value) => String(value).trim()).filter(Boolean))];
}

export function getSidebarData(posts: Blog[]) {
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())
    .slice(0, 5);

  const ALL_CATEGORIES = [
    '家電・ガジェット',
    '暮らし・習慣',
    '子ども・家族',
    '趣味・お出かけ',
    '仕事',
    '日常',
    'その他',
  ];

  const categoryMap = new Map<string, number>();
  const archiveMap = new Map<string, number>();

  ALL_CATEGORIES.forEach((category) => categoryMap.set(category, 0));

  posts.forEach((post) => {
    const categories = getCategoryValues(post);

    if (categories.length === 0) {
      const fallbackTag = 'その他';
      categoryMap.set(fallbackTag, (categoryMap.get(fallbackTag) ?? 0) + 1);
    } else {
      categories.forEach((category) => {
        if (ALL_CATEGORIES.includes(category)) {
          categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);
        } else {
          const fallbackCategory = 'その他';
          categoryMap.set(fallbackCategory, (categoryMap.get(fallbackCategory) ?? 0) + 1);
        }
      });
    }

    const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
    if (publishedAt && !Number.isNaN(publishedAt.getTime())) {
      const archiveKey = `${publishedAt.getFullYear()}年${publishedAt.getMonth() + 1}月`;
      archiveMap.set(archiveKey, (archiveMap.get(archiveKey) ?? 0) + 1);
    }
  });

  const categories = ALL_CATEGORIES.map((category) => ({
    name: category,
    count: categoryMap.get(category) ?? 0,
  }));

  const archives = [...archiveMap.entries()]
    .sort((a, b) => {
      const [yearA, monthA] = a[0].match(/(\d+)年(\d+)月/)?.slice(1) ?? ['0', '0'];
      const [yearB, monthB] = b[0].match(/(\d+)年(\d+)月/)?.slice(1) ?? ['0', '0'];
      return Number(yearB) - Number(yearA) || Number(monthB) - Number(monthA);
    })
    .map(([label, count]) => {
      const match = label.match(/(\d+)年(\d+)月/);
      const year = Number(match?.[1] ?? 0);
      const month = Number(match?.[2] ?? 0);

      return {
        label,
        count,
        year,
        month,
        href: `/archive/${year}/${month}`,
      };
    });

  return {
    recentPosts,
    categories,
    archives,
  };
}

export async function getBlog(contentId: string) {
  return client.getListDetail<Blog>({
    endpoint: 'blog',
    contentId,
  });
}

export function formatDate(dateString?: string) {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function excerptFromHtml(html: string, maxLength = 90) {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
