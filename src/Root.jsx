import { Link, Outlet } from "react-router-dom";

export default function Root() {
  return (
    <div>
      <div className="bg-gradient-to-r  from-sky-500 to-sky-600 border-b">
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
    </div>
  );
}
