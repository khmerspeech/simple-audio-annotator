import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "date-fns";
import { createHeaders } from "../authenticate.js";

async function getArticle(page) {
  const res = await fetch(new URL("/api/articles?page=" + page, API_BASE_URL));
  const body = await res.json();
  return body;
}

async function getProfile() {
  const r = await fetch(new URL("/api/profile", API_BASE_URL), {
    headers: createHeaders(),
  });
  return await r.json();
}

function DataItem({ id, isOwner, title, creator, created_at }) {
  if (typeof created_at === "string") {
    created_at = new Date(created_at);
    created_at = formatDate(created_at, "dd-MM-yyyy hh:mm aa");
  }

  return (
    <>
      <Link
        to={"/article/" + id}
        className="border-b px-4 py-2 flex hover:bg-slate-50"
      >
        <div className="flex-1 overflow-hidden">
          <h1 className="text-slate-700 font-medium text-lg truncate">
            {title}
          </h1>
          <h2 className="text-slate-600 text-sm">
            <span className="font-medium">#{id}</span>
            {"・"}
            {isOwner ? (
              <span className="font-medium text-lime-600">{creator}</span>
            ) : (
              <span className="font-medium">{creator}</span>
            )}
            {"・"}
            <span>{created_at}</span>
          </h2>
        </div>
      </Link>
    </>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [profile, setProfile] = useState(null);
  const routerNavigate = useNavigate();

  useEffect(() => {
    (async function () {
      const _profile = await getProfile();
      setProfile(_profile);

      const body = await getArticle(page);
      setData(body);
    })();
  }, []);

  const navigate = async (_page) => {
    if (_page < 1) _page = 1;
    if (_page > data.total_pages) _page = data.total_pages;
    const body = await getArticle(_page);
    setData(body);
    setPage(_page);
  };

  const refreshData = async () => {
    await navigate(page);
  };

  const handleSignOut = () => {
    localStorage.removeItem("saa:token");
    routerNavigate("/login");
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col border bg-slate-50 px-4 py-3 rounded-lg">
          <h1 className="text-slate-500 text-sm">Your Profile</h1>
          <div className="flex gap-4">
            <div className="flex items-center flex-1">
              {profile ? (
                <h1 className="text-xl font-semibold flex-1">
                  {profile.username}
                </h1>
              ) : (
                <h1 className="text-xl font-semibold flex-1">-</h1>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium px-2 py-1 text-orange-600 border border-orange-400 bg-red-50 hover:bg-red-100 transition-all rounded"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link
            to={"/create"}
            className="bg-lime-600 hover:bg-lime-700 text-sm font-medium text-white px-4 py-2 rounded-lg"
          >
            Create New
          </Link>
          <button
            disabled={!data}
            onClick={refreshData}
            className="hover:bg-slate-50 disabled:text-slate-400 disabled:bg-slate-100 text-sm font-medium border px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>
        {data != null ? (
          <div className="border py-2 rounded-lg">
            <h1 className="px-4 text-slate-500 text-sm">Documents</h1>
            {Array.isArray(data && data.data)
              ? data.data.map((item) => (
                  <DataItem
                    key={item.id}
                    id={item.id}
                    creator={item.user_id}
                    isOwner={profile.username == item.user_id}
                    created_at={new Date(item.created_at).toLocaleString()}
                    title={item.title}
                  />
                ))
              : null}

            <div className="flex px-4 pt-3 pb-1 gap-2">
              <h4 className="text-slate-500 flex-1">
                Page {page} of {data && data.total_pages}
              </h4>
              <button
                disabled={!data || page <= 1}
                onClick={() => navigate(page - 1)}
                className="hover:bg-lime-700 bg-lime-600 text-white px-2 py-1 inline-block disabled:bg-slate-200 disabled:text-slate-400 rounded text-sm"
              >
                Previous
              </button>

              <button
                disabled={!data || page >= data.total_pages}
                onClick={() => navigate(page + 1)}
                className="hover:bg-lime-700 bg-lime-600 text-white px-2 py-1 inline-block disabled:bg-slate-200 disabled:text-slate-400 rounded text-sm"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
