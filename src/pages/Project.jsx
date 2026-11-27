import { useParams } from "react-router-dom";

function Project() {
  const { projectId } = useParams();

  return (
    <main>
      <h1>{projectId}</h1>
      <p>Project page placeholder</p>
    </main>
  );
}

export default Project;
