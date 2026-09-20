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
