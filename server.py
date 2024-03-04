from fastapi import FastAPI, File, Request, status, HTTPException, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from uuid import uuid4
from typing import List, Optional, BinaryIO
from datetime import datetime, timedelta, timezone
from pathlib import Path
from jose import JWTError, jwt
import shutil
import json
import os
import sqlite3
from pypika import Table, Query, Column, functions as fn, Order


class UserAuthentication(BaseModel):
  username: str
  password: str


class AudioItem(BaseModel):
  id: int
  filename: str
  created_at: datetime


class SpeakerItem(BaseModel):
  id: str
  name: str


class ArticleItem(BaseModel):
  title: str
  content: str
  audio_id: int
  speaker_id: str

  id: Optional[int] = None
  user_id: Optional[str] = None
  approved_at: Optional[datetime] = None
  approved_by: Optional[str] = None


class Db:
  def __init__(self, db_file: str):
    self.con = sqlite3.connect(db_file, check_same_thread=False)
    self.audio = Table("audio")
    self.article = Table("article")
    self.create_tables()

  def create_audio_item(self, file_name: str):
    query = Query.into(self.audio).insert(None, file_name, datetime.now())
    cur = self.con.cursor()
    cur.execute(str(query))
    cur.close()
    return AudioItem(
      id=cur.lastrowid, filename=file_name, created_at=datetime.now(timezone.utc)
    )

  @staticmethod
  def map_article_item(values):
    return ArticleItem(
      id=values[0],
      title=values[1],
      content=values[2],
      user_id=values[3],
      speaker_id=values[4],
      audio_id=values[5],
    )

  def paginate_articles(self, page: int, limit: int = 10):
    offset = (page - 1) * limit
    cur = self.con.cursor()
    cur.execute(
      Query.from_(self.article)
      .orderby("id", order=Order.desc)
      .offset(offset)
      .limit(limit)
      .select("*")
      .get_sql()
    )

    items = list(map(Db.map_article_item, cur.fetchall()))
    cur.execute(Query.from_(self.article).select(fn.Count("*")).get_sql())
    total = cur.fetchone()
    return items, (total[0] // limit) + 1

  def create_article(self, item: ArticleItem):
    query = (
      Query.into(self.article)
      .columns("title", "content", "speaker_id", "user_id", "audio_id", "created_at")
      .insert(
        item.title,
        item.content,
        item.speaker_id,
        item.user_id,
        item.audio_id,
        datetime.now(timezone.utc),
      )
    )

    cur = self.con.cursor()
    cur.execute(query.get_sql())
    self.con.commit()
    cur.execute(
      Query.from_(self.article)
      .where(self.article.id == cur.lastrowid)
      .select("*")
      .get_sql()
    )
    values = cur.fetchone()
    cur.close()
    return Db.map_article_item(values)

  def create_tables(self):
    create_audio_sql = (
      Query.create_table(self.audio)
      .if_not_exists()
      .primary_key("id")
      .columns(
        Column("id", "INTEGER"),
        Column("filename", "TEXT"),
        Column("created_at", "DATETIME"),
      )
    )

    create_article_sql = (
      Query.create_table(self.article)
      .foreign_key(["audio_id"], self.audio, ["id"])
      .columns(
        Column("id", "INTEGER"),
        Column("title", "TEXT"),
        Column("content", "TEXT"),
        Column("user_id", "TEXT"),
        Column("speaker_id", "TEXT"),
        Column("audio_id", "INTEGER"),
        Column("created_at", "DATETIME"),
        Column("approved_at", "DATETIME", nullable=True),
        Column("approved_by", "TEXT", nullable=True),
      )
      .primary_key("id")
      .if_not_exists()
    )

    cur = self.con.cursor()
    cur.execute(create_audio_sql.get_sql())
    cur.execute(create_article_sql.get_sql())
    self.con.commit()
    cur.close()


app_db = Db("app.db")


def send_bytes_range_requests(
  file_obj: BinaryIO, start: int, end: int, chunk_size: int = 10_000
):
  with file_obj as f:
    f.seek(start)
    while (pos := f.tell()) <= end:
      read_size = min(chunk_size, end + 1 - pos)
      yield f.read(read_size)


def _get_range_header(range_header: str, file_size: int):
  def _invalid_range():
    return HTTPException(
      status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
      detail=f"Invalid request range (Range:{range_header!r})",
    )

  try:
    h = range_header.replace("bytes=", "").split("-")
    start = int(h[0]) if h[0] != "" else 0
    end = int(h[1]) if h[1] != "" else file_size - 1
  except ValueError:
    raise _invalid_range()

  if start > end or start < 0 or end > file_size - 1:
    raise _invalid_range()
  return start, end


def range_requests_response(
  request: Request,
  file_path: str,
  content_type: str,
  filename: str,
):
  """Returns StreamingResponse using Range Requests of a given file"""

  file_size = os.stat(file_path).st_size
  range_header = request.headers.get("range")
  disposition = (
    "download" if request.query_params.get("download") is not None else "inline"
  )
  headers = {
    "content-type": content_type,
    "accept-ranges": "bytes",
    "content-encoding": "identity",
    "content-length": str(file_size),
    "content-disposition": f"{disposition}; filename={filename}",
    "access-control-expose-headers": (
      "content-type, accept-ranges, content-length, " "content-range, content-encoding"
    ),
  }

  start = 0
  end = file_size - 1
  status_code = status.HTTP_200_OK

  if range_header is not None:
    start, end = _get_range_header(range_header, file_size)
    size = end - start + 1
    headers["content-length"] = str(size)
    headers["content-range"] = f"bytes {start}-{end}/{file_size}"
    status_code = status.HTTP_206_PARTIAL_CONTENT

  return StreamingResponse(
    send_bytes_range_requests(open(file_path, mode="rb"), start, end),
    headers=headers,
    status_code=status_code,
  )


with open("saa.json") as infile:
  config = json.load(infile)

# create storage file
storage_dir = Path(config["storage_dir"])
storage_dir.mkdir(exist_ok=True)


app = FastAPI()


app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.get("/api/speakers")
def get_speakers() -> List[SpeakerItem]:
  return map(SpeakerItem.model_validate, config["speakers"])


@app.get("/api/storage/{audio_filename}")
def stream_audio_file(request: Request, response: Response, audio_filename: str):
  try:
    return range_requests_response(
      request,
      file_path=f"{config['storage_dir']}/{audio_filename}",
      content_type="audio/mpeg",
      filename=audio_filename,
    )
  except FileNotFoundError:
    return Response(status_code=404)


@app.post("/api/audio")
def upload_audio_file(file: UploadFile):
  audio_file = str(uuid4()).replace("-", "") + file.filename
  audio_path = storage_dir / audio_file
  audio_path_tmp = storage_dir / Path(str(audio_file) + ".tmp")

  with open(audio_path_tmp, "wb") as outfile:
    outfile.write(file.file.read())
  shutil.move(str(audio_path_tmp), str(audio_path))
  return app_db.create_audio_item(audio_file)


@app.get("/api/articles")
def get_items(page: int = 0):
  items, total_page = app_db.paginate_articles(page)
  return {"data": items, "total_pages": total_page}


@app.post("/api/align")
def align_item(body: ArticleItem):
  return None


@app.post("/api/articles")
def create_item(body: ArticleItem):
  return app_db.create_article(body)


@app.put("/api/articles/{id}")
def update_item(id: str, body: ArticleItem):
  return body


@app.post("/api/authenticate")
def authenticate(body: UserAuthentication, response: Response):
  if body.username not in config["users"]:
    response.status_code = 404
    return {"ok": False}

  if config["users"][body.username] != body.password:
    response.status_code = 404
    return {"ok": False}

  return {
    "access_token": jwt.encode(
      {"sub": body.username, "issued_at": datetime.now(timezone.utc).timestamp()},
      key=config["secret"],
    )
  }
