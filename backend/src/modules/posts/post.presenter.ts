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
 * 批量查询当前用户与一批帖子、作者的交互状态。
 * 包括：是否点赞、是否转发、是否关注作者。
 *
 * @param postIds - 帖子 ID 列表
 * @param authorIds - 作者 ID 列表
 * @param currentUserId - 当前登录用户 ID
 * @returns 包含点赞集合、转发集合、关注集合的对象
 */
async function fetchUserInteractions(postIds: number[], authorIds: number[], currentUserId: number) {
  const [likes, reposts, follows] = await Promise.all([
    prisma.like.findMany({
      where: {
        userId: currentUserId,
        postId: { in: postIds }
      },
      select: { postId: true }
    }),
    prisma.repost.findMany({
      where: {
        userId: currentUserId,
        postId: { in: postIds }
      },
      select: { postId: true }
    }),
    prisma.follow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: authorIds }
      },
      select: { followingId: true }
    })
  ]);

  return {
    likedSet: new Set(likes.map((item) => item.postId)),
    repostSet: new Set(reposts.map((item) => item.postId)),
    followSet: new Set(follows.map((item) => item.followingId))
  };
}

/**
 * 将用户交互状态装配到帖子列表上，并用 toFeedItem 转为前端格式。
 *
 * @param posts - 原始帖子列表
 * @param interactionSets - 用户交互状态集合
 * @returns 格式化后的 feed 项列表
 */
function attachInteractionsAndMap(
  posts: MinimalPost[],
  interactionSets: { likedSet: Set<number>; repostSet: Set<number>; followSet: Set<number> }
) {
  const { likedSet, repostSet, followSet } = interactionSets;
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

  const interactionSets = await fetchUserInteractions(postIds, authorIds, currentUserId);

  return attachInteractionsAndMap(posts, interactionSets);
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
