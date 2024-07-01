FROM node:latest

WORKDIR /src

COPY package.json ./
COPY . .

ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

RUN npm i -g bun
RUN npm i

EXPOSE 3000

CMD ["npm", "start"]
