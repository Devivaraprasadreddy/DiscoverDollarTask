# Use node for building and running
FROM node:18-alpine

# create app directory
WORKDIR /usr/src/app

# copy package files first for caching
COPY package*.json ./

# install deps
RUN npm ci --only=production || npm install --only=production

# copy source
COPY . .

# env
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# start app
CMD ["node", "server.js"]
