import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";

const sections = ["info", "work", "contact"];

export default function NavBar() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("info");

  // Handle active section while scrolling
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("work");
      return;
    }

    const updateActiveSection = () => {
      const marker = window.innerHeight * 0.35;
      let current = "info";

      sections.forEach((id) => {
        const section = document.getElementById(id);

        if (section && section.getBoundingClientRect().top <= marker) {
          current = id;
        }
      });

      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      if (atBottom) current = "contact";

      setActiveSection(current);
    };

    window.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });

    updateActiveSection();

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
    };
  }, [location.pathname]);

  // Scroll to the correct section after navigating home
  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;

    const sectionId = location.hash.slice(1);

    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }, [location.pathname, location.hash]);

  return (
    <div className={styles.nav}>
      {sections.map((section, index) => (
        <span key={section}>
          {index > 0 && <span> / </span>}

          <Link
            to={`/#${section}`}
            className={activeSection === section ? styles.active : ""}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </Link>
        </span>
      ))}
    </div>
  );
}
