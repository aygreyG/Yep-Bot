FROM ubuntu:22.04

RUN apt-get update && apt-get install -y software-properties-common gcc && \
    add-apt-repository -y ppa:deadsnakes/ppa
RUN apt-get update && apt-get install -y python3.6 python3-distutils python3-pip python3-apt

RUN apt-get update && apt-get install -y build-essential
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1

ENV NODE_VERSION=16.15.1
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"


ENV TOKEN=default

WORKDIR /app

COPY start.sh /app
COPY package.json /app
COPY . /app
RUN npm install && npm cache clean --force

CMD ./start.sh $TOKEN