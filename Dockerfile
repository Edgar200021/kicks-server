FROM node:24-alpine as development

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN npm install -g concurrently
CMD ["sh", "-c", "concurrently  --kill-others-on-fail \"npm run migration:run\" \"npm run start:dev\""]

FROM node:24-alpine as testing

WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .

CMD [ "npm", "run", "test:dev" ]

FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine as production

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist

CMD [ "npm", "run", "start" ]
