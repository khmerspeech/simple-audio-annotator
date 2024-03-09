import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider
} from "react-router-dom";
import "./main.css";
import Root from "./Root.jsx";
import Authenticate from "./routes/Authenticate.jsx";
import Editor from "./routes/Editor.jsx";
import EditorUpdate from "./routes/EditorUpdate.jsx";
import Home from "./routes/Home.jsx";

function RequiresAuth({ children }) {
  if (!localStorage.getItem("saa:token")) return <Navigate to="/login" />;
  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        element: (
          <RequiresAuth>
            <Home />
          </RequiresAuth>
        ),
      },
      {
        path: "/create",
        element: (
          <RequiresAuth>
            <Editor />
          </RequiresAuth>
        ),
      },
      {
        path: "/article/:id",
        element: (
          <RequiresAuth>
            <EditorUpdate />
          </RequiresAuth>
        ),
      },
      {
        path: "/login",
        element: <Authenticate />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
