import type { Post, PostMedia, User } from "@prisma/client";

import { mapMediaList, withMediaPrefix } from "./media-mapper";

export { withMediaPrefix } from "./media-mapper";

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
 * 将作者信息映射为前端所需的作者格式。
 * @param author - 原始作者信息
 * @param isFollowed - 当前用户是否关注该作者
 * @returns 格式化后的作者对象
 */
function mapAuthor(author: PostAuthor, isFollowed: boolean) {
  return {
    id: author.id,
    nickname: author.nickname,
    avatarUrl: withMediaPrefix(author.avatarUrl),
    level: author.level,
    isFollowed
  };
}

/**
 * 将被转发的帖子映射为前端所需的引用格式。
 * @param repostOf - 原始被转发帖子
 * @returns 格式化后的引用帖子对象，若输入为 null/undefined 则返回 null
 */
function mapQuotedPost(repostOf: QuotedPost | null | undefined) {
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
    media: mapMediaList(repostOf.media)
  };
}

export function toFeedItem(post: PostWithRelations) {
  return {
    id: post.id,
    author: mapAuthor(post.author, Boolean(post.followedByMe)),
    content: post.content,
    source: post.source,
    createdAt: post.createdAt,
    channel: post.channel,
    media: mapMediaList(post.media),
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    repostsCount: post.repostsCount,
    isLiked: Boolean(post.likedByMe),
    isReposted: Boolean(post.repostedByMe),
    repostOf: mapQuotedPost(post.repostOf)
  };
}
