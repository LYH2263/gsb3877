import type { Post, PostMedia, User } from "@prisma/client";

import { mapAuthor, mapMediaList, withMediaPrefix } from "./media-mapper";

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
    repostOf: post.repostOf
      ? {
          id: post.repostOf.id,
          author: mapAuthor(post.repostOf.author),
          content: post.repostOf.content,
          source: post.repostOf.source,
          createdAt: post.repostOf.createdAt,
          media: mapMediaList(post.repostOf.media)
        }
      : null
  };
}
