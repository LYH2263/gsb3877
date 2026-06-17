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
 * 批量查询指定用户对一批帖子的点赞状态，返回已点赞帖子 ID 的集合。
 *
 * @param postIds - 帖子 ID 数组
 * @param userId - 当前用户 ID
 * @returns 已点赞帖子 ID 的 Set 集合
 */
async function batchQueryLikedSet(postIds: number[], userId: number) {
  const likes = await prisma.like.findMany({
    where: {
      userId,
      postId: { in: postIds }
    },
    select: { postId: true }
  });
  return new Set(likes.map((item) => item.postId));
}

/**
 * 批量查询指定用户对一批帖子的转发状态，返回已转发帖子 ID 的集合。
 *
 * @param postIds - 帖子 ID 数组
 * @param userId - 当前用户 ID
 * @returns 已转发帖子 ID 的 Set 集合
 */
async function batchQueryRepostedSet(postIds: number[], userId: number) {
  const reposts = await prisma.repost.findMany({
    where: {
      userId,
      postId: { in: postIds }
    },
    select: { postId: true }
  });
  return new Set(reposts.map((item) => item.postId));
}

/**
 * 批量查询指定用户对一批作者的关注状态，返回已关注作者 ID 的集合。
 *
 * @param authorIds - 作者 ID 数组
 * @param followerId - 当前用户（关注者）ID
 * @returns 已关注作者 ID 的 Set 集合
 */
async function batchQueryFollowedSet(authorIds: number[], followerId: number) {
  const follows = await prisma.follow.findMany({
    where: {
      followerId,
      followingId: { in: authorIds }
    },
    select: { followingId: true }
  });
  return new Set(follows.map((item) => item.followingId));
}

/**
 * 将点赞、转发、关注状态装配到帖子列表中，并映射为 Feed 项结构。
 *
 * @param posts - 原始帖子数组
 * @param likedSet - 已点赞帖子 ID 集合
 * @param repostSet - 已转发帖子 ID 集合
 * @param followSet - 已关注作者 ID 集合
 * @returns 映射后的 Feed 项数组
 */
function assembleFeedPosts(
  posts: MinimalPost[],
  likedSet: Set<number>,
  repostSet: Set<number>,
  followSet: Set<number>
) {
  return posts.map((post) =>
    toFeedItem({
      ...(post as PostWithRelations),
      likedByMe: likedSet.has(post.id),
      repostedByMe: repostSet.has(post.id),
      followedByMe: followSet.has(post.authorId)
    })
  );
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
    batchQueryLikedSet(postIds, currentUserId),
    batchQueryRepostedSet(postIds, currentUserId),
    batchQueryFollowedSet(authorIds, currentUserId)
  ]);

  return assembleFeedPosts(posts, likedSet, repostSet, followSet);
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
