FROM node:24-alpine AS build
WORKDIR /code

ARG ROOT_PATH
ARG API_URL
ENV VITE_API_URL=$API_URL
ENV VITE_ROOT_PATH=$ROOT_PATH

RUN echo $VITE_ROOT_PATH
RUN echo $VITE_API_URL
COPY package.json package-lock.json /code/
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json /code/
COPY src/ /code/src/
COPY public/ /code/public/
RUN npm run build

FROM nginx:1.30-alpine
ARG ROOT_PATH
ENV ROOT_PATH=$ROOT_PATH
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /code/dist /usr/share/nginx/html${ROOT_PATH}
EXPOSE 3000
