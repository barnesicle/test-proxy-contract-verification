FROM node:14-alpine
#FROM dev-docker-reg.digitalriverws.net/node:14

ENV HOME_DIR=/usr/src/app
WORKDIR $HOME_DIR

COPY package.json package-lock.json $HOME_DIR/

RUN npm ci

COPY index.js proxy.js utils.js $HOME_DIR/

CMD [ "npm", "run", "start"]