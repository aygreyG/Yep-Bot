# FROM nikolaik/python-nodejs:python3.10-nodejs16
FROM node:16-bullseye-slim

RUN apt-get update && apt-get install -y build-essential

RUN apt-get update || : && apt-get install python3 -y
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1


ENV TOKEN=default

WORKDIR /app

COPY start.sh /app
COPY package.json /app
COPY . /app
RUN npm install
CMD ./start.sh $TOKEN