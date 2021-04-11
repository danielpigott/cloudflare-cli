FROM node:lts-alpine3.13

LABEL maintainer="Mriyam Tamuli <mbtamuli@gmail.com>"

# Set a working directory
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install
RUN npm link

ENTRYPOINT [ "cfcli" ]
