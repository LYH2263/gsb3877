import type { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { toFeedItem, type PostWithRelations } from "../../utils/post-mapper";

const feedAuthorSelect = {
  id: true,
  nickname: true,
  avatarUrl: true,
  level: true
} satisfies Prisma.UserSelect;

export const FEED_POST_INCLUDE = {
  author: { select: feedAuthorSelect },
  media: true,
  repostOf: {
    include: {
      author: { select: feedAuthorSelect },
      media: true
    }
  }
} satisfies Prisma.PostInclude;

type MinimalPost = Prisma.PostGetPayload<{ include: typeof FEED_POST_INCLUDE }>;

/**
 * 批量查询当前用户对指定帖子的点赞记录
 * @param postIds - 待查询的帖子 ID 列表
 * @param userId - 当前用户 ID
 * @returns 被当前用户点赞的帖子 ID 集合
 */
async function batchQueryLiked(postIds: number[], userId: number): Promise<Set<number>> {
  const likes = await prisma.like.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true }
  });
  return new Set(likes.map((item) => item.postId));
}

/**
 * 批量查询当前用户对指定帖子的转发记录
 * @param postIds - 待查询的帖子 ID 列表
 * @param userId - 当前用户 ID
 * @returns 被当前用户转发的帖子 ID 集合
 */
async function batchQueryReposted(postIds: number[], userId: number): Promise<Set<number>> {
  const reposts = await prisma.repost.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true }
  });
  return new Set(reposts.map((item) => item.postId));
}

/**
 * 批量查询当前用户对指定用户的关注记录
 * @param authorIds - 待查询的用户 ID 列表
 * @param userId - 当前用户 ID
 * @returns 被当前用户关注的用户 ID 集合
 */
async function batchQueryFollowed(authorIds: number[], userId: number): Promise<Set<number>> {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId, followingId: { in: authorIds } },
    select: { followingId: true }
  });
  return new Set(follows.map((item) => item.followingId));
}

export async function toFeedItems(posts: MinimalPost[], currentUserId?: number) {
  if (posts.length === 0) {
    return [];
  }

  if (!currentUserId) {
    return posts.map((post) => toFeedItem({ ...post, likedByMe: false, repostedByMe: false, followedByMe: false }));
  }

  const postIds = posts.map((post) => post.id);
  const authorIds = Array.from(new Set(posts.map((post) => post.authorId)));

  const [likedSet, repostSet, followSet] = await Promise.all([
    batchQueryLiked(postIds, currentUserId),
    batchQueryReposted(postIds, currentUserId),
    batchQueryFollowed(authorIds, currentUserId)
  ]);

  return posts.map((post) =>
    toFeedItem({
      ...(post as PostWithRelations),
      likedByMe: likedSet.has(post.id),
      repostedByMe: repostSet.has(post.id),
      followedByMe: followSet.has(post.authorId)
    })
  );
}

export async function toSingleFeedItem(postId: number, currentUserId?: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: FEED_POST_INCLUDE
  });

  if (!post) {
    return null;
  }

  const [item] = await toFeedItems([post], currentUserId);
  return item;
}
