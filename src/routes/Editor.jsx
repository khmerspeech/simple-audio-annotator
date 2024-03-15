import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createHeaders } from "../authenticate.js";

function resolveAudioFile(audio) {
  return new URL(`/api/storage/${audio.filename}`, API_BASE_URL);
}

async function getSpeakers() {
  const res = await fetch(new URL("/api/speakers", API_BASE_URL));
  const body = await res.json();
  return body;
}

export default function Editor({ id }) {
  const navigate = useNavigate();
  const [speakers, setSpeakers] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [isUploading, setUploading] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [currentSpeaker, setCurrentSpeaker] = useState("");
  const isFormInvalid = !currentSpeaker || !title || !body || !audioFile;

  const audioPlayback = useMemo(
    () =>
      audioFile != null ? (
        <audio
          src={resolveAudioFile(audioFile)}
          controls
          className="w-full"
        ></audio>
      ) : null,
    [audioFile]
  );

  useEffect(() => {
    getSpeakers().then((items) => {
      setSpeakers(items);
    });

    if (id) {
      fetch(new URL(`/api/articles/${id}`, API_BASE_URL))
        .then((r) => r.json())
        .then((body) => {
          setTitle(body.title);
          setBody(body.content);
          setCurrentSpeaker(body.speaker_id);
          setAudioFile(body.audio);
        });
    }
  }, []);

  const onSpeakerChange = (e) => {
    setCurrentSpeaker(e.target.value);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      setUploading(true);
      setAudioFile(null);
      const res = await fetch(new URL("/api/audio", API_BASE_URL), {
        method: "POST",
        body: formData,
        headers: createHeaders(),
      });
      const body = await res.json();
      setAudioFile(body);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async () => {
    if (isFormInvalid) return;
    const res = await fetch(
      new URL(
        id == null ? "/api/articles" : `/api/articles/${id}/update`,
        API_BASE_URL
      ),
      {
        method: "POST",
        body: JSON.stringify({
          title,
          content: body,
          speaker_id: currentSpeaker,
          audio_id: audioFile.id,
        }),
        headers: createHeaders({
          "Content-Type": "application/json",
        }),
      }
    );

    const responseData = await res.json();
    console.log(responseData);
    navigate("/");
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="gap-1 flex flex-col">
          <label className="font-medium text-sm text-slate-500">Audio</label>
          <input
            disabled={isUploading}
            onChange={handleFileUpload}
            accept="audio/*"
            type="file"
            name="file"
            id="file"
          />
        </div>
        {audioFile != null ? (
          <div className="gap-1 flex flex-col">
            <label className="font-medium text-sm text-slate-500">
              Playback
            </label>
            {audioPlayback}
          </div>
        ) : null}
        <div className="gap-1 flex flex-col">
          <label className="font-medium text-sm text-slate-500">Speaker</label>
          <select
            value={currentSpeaker}
            onChange={onSpeakerChange}
            className="text-lg font-semibold border px-2 rounded py-2"
            name="speaker"
            id="speaker"
          >
            <option value="">(Select speaker)</option>
            {Array.isArray(speakers)
              ? speakers.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))
              : null}
          </select>
        </div>
        <div className="flex gap-1 flex-col">
          <label className="font-medium text-sm text-slate-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg border px-3 py-2 rounded"
            placeholder="Title"
            type="text"
          />
        </div>

        <div className="flex gap-1 flex-col">
          <label className="font-medium text-sm text-slate-500">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="text-lg border px-3 py-2 rounded resize-none"
            placeholder="Body"
            type="text"
          />
        </div>

        <div className="flex gap-2">
          {/* <button className="bg-sky-500 text-sm font-medium text-white px-4 py-2 rounded-lg">
            Verify
          </button>

          <button className="border text-sm font-medium px-4 py-2 rounded-lg">
            Download Subtitle
          </button>
           */}
          <button
            onClick={handleFormSubmit}
            disabled={isFormInvalid}
            className="bg-lime-600 hover:bg-lime-700 font-medium text-white disabled:bg-slate-100 disabled:text-slate-400 px-6 py-2 rounded-lg"
          >
            Save
          </button>
        </div>

        <div className="rounded gap-2 flex flex-col px-4 py-2 bg-slate-50">
          <h1 className="text-sm font-semibold text-slate-600">Note</h1>
          <p className="text-sm">1. Please be careful to review each word</p>
        </div>
      </div>
    </>
  );
}
