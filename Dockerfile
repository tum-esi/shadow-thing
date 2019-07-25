FROM node:10.16.0-alpine
WORKDIR /app
COPY package.json /app
RUN apk add --no-cache make gcc g++ python
RUN npm install
COPY . /app
RUN npm run build
CMD node dist/auto-test.js
