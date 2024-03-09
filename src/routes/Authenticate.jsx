import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Authenticate() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const invalid = !username || !password;
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (invalid) return;
    try {
      setMsg("");
      setLoading(true);
      const response = await fetch(new URL("/api/authenticate", API_BASE_URL), {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
        headers: {
          "content-type": "application/json",
          
        },
      });
      const data = await response.json();
      if (!data.access_token) {
        setMsg("Username or password is incorrect!");
        return;
      }

      localStorage.setItem("saa:token", data.access_token);
      navigate("/");
    } catch (e) {
      console.error(e);
      setMsg("Username or password is incorrect!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-lg mx-auto">
        <h1 className="text-center font-bold text-xl">Authentication</h1>
        <div className="flex flex-col mt-4 gap-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            type="text"
            className="border font-medium px-2 py-1 rounded font-sans"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="border font-medium px-2 py-1 rounded font-sans"
          />
          <button
            disabled={invalid || loading}
            onClick={handleLogin}
            className="bg-sky-500 transition-all hover:bg-sky-400 disabled:bg-slate-50 disabled:text-slate-300 text-white px-2 py-3 rounded-lg text-sm font-medium"
          >
            Login
          </button>
          {msg ? (
            <>
              <p className="font-medium text-sm text-orange-500">{msg}</p>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
