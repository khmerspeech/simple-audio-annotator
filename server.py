from fastapi.security import OAuth2PasswordBearer
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi import (
  FastAPI,
  Depends,
  Request,
  status,
  HTTPException,
  UploadFile,
  Response,
)
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from uuid import uuid4
from typing import List, Optional, BinaryIO
from typing_extensions import Annotated
from datetime import datetime, timezone
from pathlib import Path
from jose import JWTError, jwt
import shutil
import json
import os
import sqlite3

from pypika import Table, Query, Column, functions as fn, Order

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
ALGORITHM = "HS256"


class UserAuthentication(BaseModel):
  username: str
  password: str


class AudioItem(BaseModel):
  id: int
  filename: str
  created_at: datetime
  user_id: str


class SpeakerItem(BaseModel):
  id: str
  name: str


class ArticleItem(BaseModel):
  title: str
  content: str
  audio_id: int
  speaker_id: str

  audio: Optional[AudioItem] = None
  id: Optional[int] = None
  user_id: Optional[str] = None
  approved_at: Optional[datetime] = None
  approved_by: Optional[str] = None
  created_at: Optional[str] = None


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
  credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
  )
  try:
    payload = jwt.decode(token, config["secret"], algorithms=[ALGORITHM])
    username: str = payload.get("sub")
    if username is None:
      raise credentials_exception
  except JWTError:
    raise credentials_exception
  return username


class Db:
  def __init__(self, db_file: str):
    self.con = sqlite3.connect(db_file, check_same_thread=False)
    self.audio = Table("audio")
    self.article = Table("article")
    self.create_tables()

  def create_audio_item(self, file_name: str, user_id: str):
    query = Query.into(self.audio).insert(None, file_name, user_id, datetime.now())
    cur = self.con.cursor()
    cur.execute(str(query))
    cur.close()
    self.con.commit()
    return AudioItem(
      id=cur.lastrowid,
      filename=file_name,
      created_at=datetime.now(timezone.utc),
      user_id=user_id,
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
      created_at=values[6],
    )

  @staticmethod
  def map_audio_item(values):
    _id, filename, user_id, date = values
    return AudioItem(id=_id, user_id=user_id, filename=filename, created_at=date)

  def paginate_articles(self, page: int, limit: int = 10):
    offset = (page - 1) * limit
    print(f"{offset=}")
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

  def update_article(self, id: int, item: ArticleItem):
    query = (
      Query.update(self.article)
      .where(self.article.id == id)
      .set(self.article.title, item.title)
      .set(self.article.content, item.content)
      .set(self.article.speaker_id, item.speaker_id)
      .set(self.article.audio_id, item.audio_id)
      .set(self.article.user_id, item.user_id)
      .get_sql()
    )

    cur = self.con.cursor()
    cur.execute(query)
    self.con.commit()
    return self.article_by_id(id)

  def article_by_id(self, id: int):
    cur = self.con.cursor()
    cur.execute(
      Query.from_(self.article).where(self.article.id == id).select("*").get_sql()
    )
    values = cur.fetchone()
    cur.close()
    article = Db.map_article_item(values)
    article.audio = self.audio_by_id(article.audio_id)
    return article

  def audio_by_id(self, id: int):
    cur = self.con.cursor()
    cur.execute(
      Query.from_(self.audio).where(self.audio.id == id).select("*").get_sql()
    )
    values = cur.fetchone()
    cur.close()
    return Db.map_audio_item(values)

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
    return self.article_by_id(cur.lastrowid)

  def create_tables(self):
    create_audio_sql = (
      Query.create_table(self.audio)
      .if_not_exists()
      .primary_key("id")
      .columns(
        Column("id", "INTEGER"),
        Column("filename", "TEXT"),
        Column("user_id", "TEXT"),
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

app_db = Db(config["db_file"])

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
def upload_audio_file(
  file: UploadFile, username: Annotated[str, Depends(get_current_user)]
):
  audio_file = str(uuid4()).replace("-", "") + "-" + file.filename
  audio_path = storage_dir / audio_file
  audio_path_tmp = storage_dir / Path(str(audio_file) + ".tmp")

  with open(audio_path_tmp, "wb") as outfile:
    outfile.write(file.file.read())
  shutil.move(str(audio_path_tmp), str(audio_path))
  return app_db.create_audio_item(audio_file, user_id=username)


@app.get("/api/articles")
def get_items(page: int = 0):
  items, total_page = app_db.paginate_articles(page)
  return {"data": items, "total_pages": total_page}


@app.get("/api/articles/{id}")
def find_article(id: str):
  item = app_db.article_by_id(id)
  return item


@app.post("/api/align")
def align_item(body: ArticleItem):
  return None


@app.post("/api/articles")
def create_item(body: ArticleItem, username: Annotated[str, Depends(get_current_user)]):
  body.user_id = username
  return app_db.create_article(body)


@app.post("/api/articles/{id}/update")
def update_item(
  id: int, body: ArticleItem, username: Annotated[str, Depends(get_current_user)]
):
  body.user_id = username
  return app_db.update_article(id, body)


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


@app.get("/api/profile")
def profile(username: Annotated[str, Depends(get_current_user)]):
  return {"username": username}


class SPAStaticFiles(StaticFiles):
  async def get_response(self, path: str, scope):
    try:
      return await super().get_response(path, scope)
    except (HTTPException, StarletteHTTPException) as ex:
      if ex.status_code == 404:
        return await super().get_response("index.html", scope)
      else:
        raise ex


if os.path.exists("dist"):
  app.mount("/", SPAStaticFiles(directory="dist", html=True), name="whatever")
