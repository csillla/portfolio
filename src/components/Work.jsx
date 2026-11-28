import { useState } from "react";
import { Link } from "react-router-dom";
import projects from "../data/projects";
import styles from "./Work.module.css";

export default function Work() {
  const [layout, setLayout] = useState("grid");

  return (
    <section id="work" className={styles.work}>
      <div className={styles.workHeader}>
        <h2 className={styles.title}>Work</h2>

        <div className={styles.layoutToggle}>
          <button
            className={layout === "grid" ? styles.active : ""}
            onClick={() => setLayout("grid")}
          >
            Grid
          </button>
          <div>/</div>
          <button
            className={layout === "list" ? styles.active : ""}
            onClick={() => setLayout("list")}
          >
            List
          </button>
        </div>
      </div>

      <div
        className={`${styles.projects} ${
          layout === "grid" ? styles.grid : styles.list
        }`}
      >
        <div />
        <div />

        <div className={styles.header}>
          <div>Year</div>
          <div>Project</div>
          <div className={styles.type}>Type</div>
        </div>

        {projects.map((project, index) => (
          <Link
            to={`/work/${project.id}`}
            className={styles.project}
            key={project.id}
          >
            <div className={styles.projectImage}>
              <img src={project.cover} />
            </div>

            <div className={styles.projectInfo}>
              <div className={styles.projectInfoInner}>
                <span className={styles.year}>{project.year}</span>
                <h3>{project.title}</h3>
              </div>
              <div className={styles.projectInfoInner2}>
                <span>{project.category}</span>
                <svg
                  className={styles.arrow}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.18,13H5q-0.42,0-0.71-0.29Q4,12.43 4,12t0.29-0.71T5,11H16.18l-4.9-4.9q-0.3-0.3-0.29-0.7T11.3,4.7Q11.6,4.42 12,4.41T12.7,4.7l6.6,6.6q0.15,0.15 0.21,0.33T19.58,12t-0.06,0.38T19.3,12.7l-6.6,6.6q-0.28,0.27-0.69,0.27T11.3,19.3Q11,19 11,18.59q0-0.41 0.3-0.71L16.18,13Z" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
