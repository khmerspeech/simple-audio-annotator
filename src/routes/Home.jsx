import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-500 text-sm">Your Profile</h1>
        <div className="flex items-center">
          <h1 className="text-xl font-semibold flex-1">Sok Nha</h1>
        </div>
        <h1 className="text-slate-500 text-sm">Documents</h1>
        <div className="flex gap-2 flex-wrap">
          <Link
            to={"/create"}
            className="bg-sky-500 text-sm font-medium text-white px-4 py-2 rounded-lg"
          >
            Create New
          </Link>
          <button className=" text-sm font-medium border px-4 py-2 rounded-lg">
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-2">
          
          <div className="border-b px-3 py-2 flex">
            <div className="flex-1">
              <h1 className="font-medium text-lg">
                ផ្ទះជួលថ្លៃពេក!
                និស្សិតសាកលវិទ្យាល័យម្នាក់សុខចិត្តជិះយន្តហោះទៅរៀនវិញ
              </h1>
              <h2 className="text-slate-600 text-sm">Sok Nha - <em>2 days ago</em></h2>
            </div>
            <div className="text-orange-600  font-medium text-sm self-center px-2 py-1 rounded-lg bg-orange-50">In Review</div>
          </div>


          <div className="border-b px-3 py-2 flex">
            <div className="flex-1">
              <h1 className="font-medium text-lg">
                ផ្ទះជួលថ្លៃពេក!
                និស្សិតសាកលវិទ្យាល័យម្នាក់សុខចិត្តជិះយន្តហោះទៅរៀនវិញ
              </h1>
              <h2 className="text-slate-600 text-sm">Sok Nha - <em>2 days ago</em></h2>
            </div>
            <div className="text-sky-600  font-medium text-sm self-center px-2 py-1 rounded-lg bg-sky-50">Approved</div>
          </div>
          
        </div>
      </div>
    </>
  );
}
