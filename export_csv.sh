#!/usr/bin/env bash

sqlite3 -header -csv app.db "select * from article inner join audio on audio_id = audio.id;" > metadata.csv