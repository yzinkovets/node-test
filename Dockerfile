# specify the node base image with your desired version node:<version>
FROM node:11.15

RUN npm install -g nodemon

EXPOSE 3000

ENTRYPOINT ["nodemon"]
CMD ["app.js"]