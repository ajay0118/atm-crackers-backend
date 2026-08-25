import { Types } from 'mongoose';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function calculateSellingPrice(
  mrp: number,
  discountPercent: number,
): number {
  const discountAmount = (mrp * discountPercent) / 100;
  return Math.max(0, Math.round(mrp - discountAmount));
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function makePlaceholderImageUrl(
  label: string,
  size = '600x600',
): string {
  return `https://placehold.co/${size}/F5A623/111827?text=${encodeURIComponent(label)}`;
}

export function buildIdentifierFilter(
  identifier: string,
): Record<string, unknown> {
  const trimmed = identifier.trim();
  const orConditions: Array<Record<string, unknown>> = [{ slug: trimmed }];

  if (Types.ObjectId.isValid(trimmed)) {
    orConditions.push({ _id: new Types.ObjectId(trimmed) });
  }

  return { $or: orConditions };
}
