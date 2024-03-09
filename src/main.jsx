import "./main.css";
import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./Root.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./routes/Home.jsx";
import Editor from "./routes/Editor.jsx";
import EditorUpdate from "./routes/EditorUpdate.jsx";
import Authenticate from "./routes/Authenticate.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/create",
        element: <Editor />,
      },
      {
        path: "/article/:id",
        element: <EditorUpdate />,
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
