FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

RUN mkdir -p /app/uploads

EXPOSE 38771

CMD ["sh", "-c", "pnpm install --no-frozen-lockfile && pnpm prisma generate && pnpm exec prisma db push --accept-data-loss && pnpm exec prisma db seed && pnpm dev"]
