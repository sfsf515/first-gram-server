FROM public-cn-beijing.cr.volces.com/public/node:18-alpine

WORKDIR /opt/application

COPY package.json .
RUN npm config set registry https://registry.npmmirror.com && npm install

COPY server.js .

RUN echo '#!/bin/sh' > /opt/application/run.sh && \
    echo 'cd /opt/application' >> /opt/application/run.sh && \
    echo 'node server.js' >> /opt/application/run.sh && \
    chmod +x /opt/application/run.sh

EXPOSE 3000
