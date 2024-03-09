## Simple Audio Annotator

<img width=512 alt="" src="https://github.com/khmerspeech/simple-audio-annotator/assets/15277233/b6955c31-f46f-436b-bf5f-b1c82988a802">


## Get started

1. Create a config file called `saa.json` in the local directory

```json
{
  "secret": "42",
  "storage_dir": "storage",
  "db_file": "data/app.db",
  "speakers": [
    {
      "id": "MEAS-TOLA",
      "name": "1. Meas Tola"
    },
    {
      "id": "SOK-DYNA",
      "name": "2. Sok Dyna"
    }
  ],
  "users": {
    "test": "pass",
    "admin": "adminpass"
  }
}
```

2. Docker Compose

```yaml
version: "3"
services:
   app:
      image: ghcr.io/khmerspeech/simple-audio-annotator:main
      restart: unless-stopped
      volumes:
        - "./saa.json:/app/saa.json"
        - "./storage:/app/storage"
        - "./data:/app/data"
      ports:
        - "127.0.0.1:8080:80"
```

### License

`Apache-2.0`
