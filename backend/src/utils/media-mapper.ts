import type { PostMedia } from "@prisma/client";

import { env } from "../config/env";

const MEDIA_PREFIX = env.MEDIA_PUBLIC_PREFIX;

/**
 * 为媒体 URL 添加前缀。若 URL 已是完整的 http/https 地址则直接返回。
 * @param url - 原始媒体 URL，可为 null
 * @returns 添加前缀后的 URL，若输入为 null 则返回 null
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
 * 将 PostMedia 数组按 sortOrder 排序并映射为前端所需的媒体项格式。
 * @param media - 原始媒体数组
 * @returns 排序并格式化后的媒体项数组
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
