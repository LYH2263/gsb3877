FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

ENV FRONTEND_PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "pnpm install --no-frozen-lockfile && pnpm exec vite --host 0.0.0.0 --port ${FRONTEND_PORT:-3000}"]
