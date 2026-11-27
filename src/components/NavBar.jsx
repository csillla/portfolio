import styles from "./NavBar.module.css";

export default function NavBar() {
  return (
    <div className={styles.nav}>
      <span>Info</span>
      <span> / </span>
      <span>Work</span>
      <span> / </span>
      <span>Contact</span>
    </div>
  );
}
