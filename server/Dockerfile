FROM node:22

WORKDIR /app

# install dependencies
RUN apt-get update && apt-get install -y curl git

# install railpack
RUN curl -sSL https://railpack.com/install.sh | sh

COPY package*.json .
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]