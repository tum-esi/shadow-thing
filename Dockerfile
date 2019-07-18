FROM nikolaik/python-nodejs:latest
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
RUN npm run build
CMD python3 -u src/test-scripts/test.py
