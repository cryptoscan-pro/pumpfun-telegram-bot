FROM node:latest

WORKDIR /src

COPY package.json ./
COPY . .

RUN npm i -g bun
RUN npm i -g pnpm
RUN pnpm i

EXPOSE 3000

CMD ["pnpm", "bot"]
