import { useState } from "react";
import { HighlightWithinTextarea } from "react-highlight-within-textarea";

export default function Editor() {
  const [value, setValue] = useState("X Y Z and then XYZ");
  const onChange = (value) => setValue(value);
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="gap-1 flex flex-col">
          <label className="font-medium text-sm text-slate-500">Audio</label>
          <input accept="audio/*" type="file" name="file" id="file" />
        </div>

        <div className="gap-1 flex flex-col">
          <label className="font-medium text-sm text-slate-500">Playback</label>
          <audio src="#" controls className="w-full"></audio>
        </div>
        <div className="gap-1 flex flex-col">
          <label className="font-medium text-sm text-slate-500">Speaker</label>

          <select
            className="text-lg font-semibold border px-2 rounded py-2"
            name="speaker"
            id="speaker"
          >
            <option value="">1. Lia</option>
            <option value="">2. Dan</option>
            <option value="">3. Steve</option>
          </select>
        </div>
        <div className="flex gap-1 flex-col">
          <label className="font-medium text-sm text-slate-500">Title</label>
          <input
            className="text-lg border px-3 py-2 rounded"
            placeholder="Title"
            type="text"
          />
        </div>

        <div className="flex gap-1 flex-col">
          <label className="font-medium text-sm text-slate-500">Body</label>
          <textarea
            rows={14}
            className="text-lg border px-3 py-2 rounded resize-none"
            placeholder="Body"
            type="text"
          />
        </div>

        <div className="flex gap-2">
          <button className="bg-sky-500 text-sm font-medium text-white px-4 py-2 rounded-lg">
            Verify
          </button>

          <button className="border text-sm font-medium px-4 py-2 rounded-lg">
            Download Subtitle
          </button>
          <div className="flex-1"></div>
          <button className="bg-sky-500 text-sm font-medium text-white px-4 py-2 rounded-lg">
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
