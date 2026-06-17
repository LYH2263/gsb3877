import type { PostMedia } from "@prisma/client";

import { env } from "../config/env";

const MEDIA_PREFIX = env.MEDIA_PUBLIC_PREFIX;

/**
 * 为媒体 URL 添加前缀。
 * 如果 URL 已经是 http:// 或 https:// 开头的绝对地址，则原样返回。
 *
 * @param url - 原始媒体 URL
 * @returns 带前缀的媒体 URL，若入参为空则返回 null
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
 * 将 PostMedia 数组按 sortOrder 排序并映射为前端所需格式。
 *
 * @param media - 原始媒体数组
 * @returns 排序后的媒体项数组，每项包含 id、type 和带前缀的 url
 */
export function mapMediaList(media: PostMedia[]) {
  return media
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      type: item.type,
      url: withMediaPrefix(item.url)
    }));
}
