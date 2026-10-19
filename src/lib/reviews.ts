import { getPayloadClient } from './runtime.ts';

export type ReviewTarget = 'book' | 'article' | 'magazine';
export const REVIEW_TARGETS: readonly ReviewTarget[] = ['book', 'article', 'magazine'];
export const REVIEWS_PER_PAGE = 30;
/** An aggregate rating is only published (structured data, badges) once this many approved reviews exist. */
export const MIN_REVIEWS_FOR_AGGREGATE = 3;

export interface PublicReview {
  id: number;
  name: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface ReviewSummary {
  items: PublicReview[];
  count: number;
  average: number;
}

/** Aggregate over plain numbers (pure, unit-tested). Average is rounded to one decimal. */
export function summarize(ratings: readonly number[]): { count: number; average: number } {
  const valid = ratings.filter((r) => Number.isFinite(r) && r >= 1 && r <= 5);
  if (!valid.length) return { count: 0, average: 0 };
  return { count: valid.length, average: Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 };
}

/** Approved reviews of one item, newest first. Only approved rows ever leave the database layer. */
export async function approvedReviews(type: ReviewTarget, id: number): Promise<ReviewSummary> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'reviews',
    where: { and: [{ status: { equals: 'approved' } }, { targetType: { equals: type } }, { targetId: { equals: id } }] },
    sort: '-createdAt',
    limit: 200,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const rows = res.docs as unknown as { id: number; name?: string | null; rating: number; body: string; createdAt: string }[];
  const { count, average } = summarize(rows.map((r) => Number(r.rating)));
  return {
    items: rows.slice(0, REVIEWS_PER_PAGE).map((r) => ({ id: r.id, name: r.name?.trim() || '', rating: Number(r.rating), body: r.body, createdAt: r.createdAt })),
    count,
    average,
  };
}
