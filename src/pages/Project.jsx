import { useParams } from "react-router-dom";

function Project() {
  const { projectId } = useParams();

  return (
    <main>
      <h1>{projectId}</h1>
      <p>Impatient. Grab a book or build a snowman.</p>
    </main>
  );
}

export default Project;
