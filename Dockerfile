FROM node:24-alpine3.21

LABEL maintainer="Mriyam Tamuli <mbtamuli@gmail.com>"

# Set a working directory
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install
RUN npm link

ENTRYPOINT [ "cfcli" ]
