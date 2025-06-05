FROM node:22
# add NODE_ENV
WORKDIR /code

ARG ROOT_PATH
ARG API_URL
ENV NEXT_PUBLIC_API_URL=$API_URL
ENV NEXT_PUBLIC_ROOT_PATH=$ROOT_PATH

RUN echo $NEXT_PUBLIC_ROOT_PATH
RUN echo $NEXT_PUBLIC_API_URL
COPY package.json /code/package.json
COPY tsconfig.json /code/tsconfig.json
COPY next.config.ts /code/next.config.ts
COPY src/ /code/src/
COPY public/ /code/public/
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm","run","start"]
