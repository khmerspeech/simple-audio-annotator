import { useParams } from "react-router-dom";
import Editor from "./Editor.jsx";

export default function EditorUpdate() {
  const params = useParams();
  return (
    <>
      <Editor id={params.id} />
    </>
  );
}
