import type { Post, PostMedia, User } from "@prisma/client";

import { mapFeedMedia, withMediaPrefix } from "./media-mapper";

type PostAuthor = Pick<User, "id" | "nickname" | "avatarUrl" | "level">;
type QuotedPost = Pick<Post, "id" | "content" | "source" | "createdAt"> & {
  author: PostAuthor;
  media: PostMedia[];
};

export interface PostWithRelations extends Post {
  author: PostAuthor;
  media: PostMedia[];
  repostOf?: QuotedPost | null;
  likedByMe?: boolean;
  repostedByMe?: boolean;
  followedByMe?: boolean;
}

/**
 * 将作者信息映射为 Feed 项所需的作者结构。
 *
 * @param author - 原始作者信息
 * @param followedByMe - 当前用户是否已关注该作者
 * @returns Feed 作者对象，包含 id、nickname、avatarUrl、level、isFollowed
 */
function mapFeedAuthor(author: PostAuthor, followedByMe: boolean) {
  return {
    id: author.id,
    nickname: author.nickname,
    avatarUrl: withMediaPrefix(author.avatarUrl),
    level: author.level,
    isFollowed: followedByMe
  };
}

/**
 * 将转发引用的帖子映射为 Feed 项所需的引用结构。
 *
 * @param repostOf - 原始转发引用帖子，可为 null 或 undefined
 * @returns 映射后的引用帖子对象，或 null（当输入为空时）
 */
function mapFeedRepostOf(repostOf: QuotedPost | null | undefined) {
  if (!repostOf) {
    return null;
  }

  return {
    id: repostOf.id,
    author: {
      id: repostOf.author.id,
      nickname: repostOf.author.nickname,
      avatarUrl: withMediaPrefix(repostOf.author.avatarUrl),
      level: repostOf.author.level
    },
    content: repostOf.content,
    source: repostOf.source,
    createdAt: repostOf.createdAt,
    media: mapFeedMedia(repostOf.media)
  };
}

export function toFeedItem(post: PostWithRelations) {
  return {
    id: post.id,
    author: mapFeedAuthor(post.author, Boolean(post.followedByMe)),
    content: post.content,
    source: post.source,
    createdAt: post.createdAt,
    channel: post.channel,
    media: mapFeedMedia(post.media),
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    repostsCount: post.repostsCount,
    isLiked: Boolean(post.likedByMe),
    isReposted: Boolean(post.repostedByMe),
    repostOf: mapFeedRepostOf(post.repostOf)
  };
}

export { withMediaPrefix } from "./media-mapper";
