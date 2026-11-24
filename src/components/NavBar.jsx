import styles from "./NavBar.module.css";

export default function NavBar() {
  return (
    <section className={styles.navBar}>
      <div>Csilla Gárdonyi</div>
      <div className={styles.nav}>
        <div>(Info)</div>
        <div>(Work)</div>
        <div>(Contact)</div>
      </div>
    </section>
  );
}
