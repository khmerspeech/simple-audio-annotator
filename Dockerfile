FROM node:20 as builder

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .
ENV NODE_ENV production
RUN npm run build

FROM python:3.8

RUN apt-get update && apt-get install \
  build-essential \
  libsndfile1 \
  ffmpeg \
  sox \
  libsox-dev \
  cmake -y

RUN pip install -U --no-cache-dir pip
RUN pip install --no-cache-dir --disable-pip-version-check \
  khmercut \
  tqdm \
  librosa \
  Unidecode==1.1.1 \
  matplotlib==3.3.1 \
  ftfy==6.1.1 \
  samplerate \
  pydub \
  requests \
  fastapi \
  'uvicorn[standard]' \
  chardet \
  pypika \
  python-jose \
  python-multipart

WORKDIR /app

COPY --from=builder /app/dist/ dist

COPY server.py .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "80"]