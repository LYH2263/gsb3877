import type { PostMedia } from "@prisma/client";

import { env } from "../config/env";

const MEDIA_PREFIX = env.MEDIA_PUBLIC_PREFIX;

/**
 * 为媒体 URL 添加公共前缀。
 * 若 URL 为空或已是绝对地址（http/https 开头），则原样返回。
 *
 * @param url - 原始媒体 URL
 * @returns 带前缀的媒体 URL，或 null（当输入为空时）
 */
export function withMediaPrefix(url: string | null): string | null {
  if (!url) {
    return null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${MEDIA_PREFIX}${url}`;
}

/**
 * 将 PostMedia 数组按 sortOrder 排序后映射为 Feed 项所需的媒体结构。
 *
 * @param media - 原始 PostMedia 数组
 * @returns 排序并映射后的媒体数组，包含 id、type、url 字段
 */
export function mapFeedMedia(media: PostMedia[]) {
  return media
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      type: item.type,
      url: withMediaPrefix(item.url)
    }));
}
