# Build stage
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine as runner

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
RUN npm run prismagen

EXPOSE 3000
CMD ["npm", "run", "start"]
