import type { PostMedia, User } from "@prisma/client";

import { env } from "../config/env";

const MEDIA_PREFIX = env.MEDIA_PUBLIC_PREFIX;

type PostAuthor = Pick<User, "id" | "nickname" | "avatarUrl" | "level">;

/**
 * 为 URL 添加媒体公共前缀
 *
 * 若 url 为空则返回 null；若已含 http(s) 协议头则原样返回；否则拼接 MEDIA_PUBLIC_PREFIX
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
 * 将媒体列表按 sortOrder 升序排列，并为每条媒体的 url 添加公共前缀
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

/**
 * 将作者信息映射为 Feed 输出格式，并为头像 URL 添加公共前缀
 *
 * 当 isFollowed 传入时，在结果中包含 isFollowed 字段；否则省略该字段
 */
export function mapAuthor(author: PostAuthor, isFollowed?: boolean) {
  return {
    id: author.id,
    nickname: author.nickname,
    avatarUrl: withMediaPrefix(author.avatarUrl),
    level: author.level,
    ...(isFollowed !== undefined ? { isFollowed } : {})
  };
}
