import { useEffect, useRef } from "react";
import styles from "./Contact.module.css";

export default function Contact() {
  const contactRef = useRef(null);

  useEffect(() => {
    const section = contactRef.current;
    if (!section) return;

    let progress = 0;
    const maxProgress = 0.5;
    let lastTouchY = null;

    const updateGradient = () => {
      const eased = 1 - Math.pow(1 - progress, 3);

      const width = section.clientWidth;
      const height = section.clientHeight;

      const maxRadius = Math.hypot(width / 2, height) / 0.35;
      const radius = 80 + (maxRadius - 80) * eased;

      section.style.setProperty("--gradient-radius", `${radius}px`);

      const textProgress = Math.min(1, Math.max(0, (progress - 0.02) / 0.03));

      section.style.setProperty("--text-progress", textProgress);
    };

    const handleWheel = (event) => {
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      if (!atBottom) return;

      if (event.deltaY > 0 && progress < maxProgress) {
        event.preventDefault();
        progress = Math.min(maxProgress, progress + event.deltaY / 1500);
        updateGradient();
      } else if (event.deltaY < 0 && progress > 0) {
        event.preventDefault();
        progress = Math.max(0, progress + event.deltaY / 1500);
        updateGradient();
      }
    };

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1) return;
      lastTouchY = event.touches[0].clientY;
    };

    const handleTouchMove = (event) => {
      if (lastTouchY === null || event.touches.length !== 1) return;

      const currentY = event.touches[0].clientY;
      const deltaY = lastTouchY - currentY;

      lastTouchY = currentY;

      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      if (!atBottom) return;

      if (
        (deltaY > 0 && progress < maxProgress) ||
        (deltaY < 0 && progress > 0)
      ) {
        event.preventDefault();

        progress = Math.min(maxProgress, Math.max(0, progress + deltaY / 1500));

        updateGradient();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    updateGradient();

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <section ref={contactRef} className={styles.contact}>
      <div className={styles.contactInner}>
        <div className={`${styles.sayHi} ${styles.borderElement}`}>
          Have a project in mind?
          <br />
          Reach out and let's talk about it!
        </div>
        <div className={`${styles.grid} ${styles.borderElement}`}>
          <div className={`${styles.ln} ${styles.borderElement}`}>
            <div className={styles.tag}>(Phone)</div>
            <div>+36 70 532 2963</div>
          </div>
          <div className={`${styles.ln} ${styles.borderElement}`}>
            <div className={styles.tag}>(@)</div>
            <div>csilla.gardonyi@gmail.com</div>
          </div>
        </div>
      </div>
    </section>
  );
}
