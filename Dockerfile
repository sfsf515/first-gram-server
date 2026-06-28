FROM node:18-alpine
WORKDIR /opt/application
COPY package.json .
RUN npm install
COPY server.js .
COPY run.sh .
RUN chmod +x run.sh
EXPOSE 3000
CMD ["bash", "run.sh"]
