import { Link, Outlet } from "react-router-dom";

export default function Root() {
  return (
    <div>
      <div className="bg-gradient-to-r  from-lime-600 to-teal-600 border-b">
        <div className="text-center py-3 px-4 mx-auto items-center max-w-4xl flex">
          <Link
            className="text-white font-semibold flex items-center gap-3"
            to={"/"}
          >
            <img src="/icon-white.svg" alt="" width={32} />
            <span>Simple Audio Annotator</span>
          </Link>
        </div>
      </div>
      <div className="px-4 py-4 max-w-4xl mx-auto">
        <Outlet />
      </div>
      <footer className="px-4 mt-10 border-t py-4 text-slate-500 mx-auto">
        <p className="text-sm text-center">
          An open-source project of{" "}
          <a
            href="https://github.com/khmerspeech/simple-audio-annotator"
            className="font-medium text-lime-600"
          >
            [Khmer Speech Processing]
          </a>
        </p>
      </footer>
    </div>
  );
}
