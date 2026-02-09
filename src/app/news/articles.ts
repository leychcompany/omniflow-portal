const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const createSlug = (title: string) => normalizeSlug(title)

export interface NewsArticle {
  id: string
  title: string
  excerpt: string
  content: string
  publishedAt: string
  imageUrl: string
  featured: boolean
  slug: string
}

export const newsArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'OMNI Flow Computers Launches New Customer Portal',
    excerpt: 'We are excited to introduce a centralized customer portal for training, support, resources, and account tools from OMNI Flow Computers.',
    content: 'Today we are announcing the launch of the OMNI Flow Computers Customer Portal, a secure hub that brings training, support resources, manuals, and RFQ tools into a single experience. The portal is designed to help teams onboard faster, find technical answers quickly, and manage ongoing service needs more efficiently. Customers can access product documentation, submit service requests, and track updates from one place, with a streamlined interface that reduces time spent searching for information. We will continue to expand the portal with new learning modules, best-practice guides, and proactive service notifications as we roll out additional capabilities over the coming months.',
    publishedAt: '2024-02-01',
    imageUrl: '/news-1.jpg',
    featured: true,
    slug: createSlug('OMNI Flow Computers Launches New Customer Portal')
  }
]

export const getNewsArticleSlug = (article: NewsArticle) =>
  normalizeSlug(article.slug)

export const getNewsArticleBySlug = (slug: string) => {
  const normalizedSlug = normalizeSlug(decodeURIComponent(slug))
  return newsArticles.find(article => normalizeSlug(article.slug) === normalizedSlug)
}
