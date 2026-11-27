import styles from "./NavBar.module.css";

export default function PreNav() {
  return (
    <section className={styles.navBar}>
      <div className={styles.firstRow}>
        <div>Csilla Gárdonyi</div>
        <div>
          <span>EN</span>
          <span className={styles.inAct}> / DE</span>
        </div>
      </div>
      <div className={styles.secondRow}>
        <div className={styles.ln}>
          <div />
          <div className={styles.lnInner}>
            <div className={styles.tag}>(Bio)</div>
            <div className={styles.info}>
              Independent designer and web developer based in Budapest, working
              worldwide. Helping businesses build their visual world on and off
              screen. Creating distinctive designs and functional digital
              experiences that help them grow and reach their full potential.
            </div>
          </div>
        </div>

        <div className={styles.ln}>
          <div />
          <div className={styles.lnInner}>
            <div className={styles.tag}>(Services)</div>
            <div className={styles.info}>
              Brand Identity, Digital Design, Web Development
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
