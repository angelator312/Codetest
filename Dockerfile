FROM fedora:latest

RUN dnf install -y nodejs npm gcc-c++ make

ADD . /app
WORKDIR /app

# build codetest
RUN npm install
RUN npm link .

# build frontend
WORKDIR /app/web/frontend
RUN npm install
RUN npm run build

# build backend
WORKDIR /app/web/backend
RUN npm install
RUN npm run build

CMD ["node", "dist/main"]