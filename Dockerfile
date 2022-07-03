FROM node:16-bullseye-slim

RUN apt-get update && apt-get install -y build-essential

RUN apt-get update || : && apt-get install python3 -y
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1

WORKDIR /app

COPY . .

VOLUME [ "/app/data" ]

RUN npm install

CMD [ "npm", "start" ]