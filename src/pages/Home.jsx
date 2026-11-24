import { useState } from "react";
import SkyCanvas from "../components/SkyCanvas";
import styles from "./Home.module.css";
import cities from "../data/cities";
import CityDisplay from "../components/CityDisplay";

export default function Home() {
  const [selectedCity, setSelectedCity] = useState(cities[0]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openCitySearch = () => {
    setIsSearchOpen(true);
    setIsAutoPlaying(false);
  };

  const closeCitySearch = () => {
    setIsSearchOpen(false);
  };

  const toggleAutoPlay = () => {
    if (!isAutoPlaying) {
      setSelectedCity(cities[0]);
    }

    setIsAutoPlaying((current) => !current);
    setIsSearchOpen(false);
  };

  return (
    <section className={styles.home}>
      <div className={styles.pIntro}>
        <div className={styles.textIntro}>
          Independent designer and web developer based in Budapest, working
          worldwide. Helping businesses build their visual world on and off
          screen. Creating distinctive designs and functional digital
          experiences that help them grow and reach their full potential.
        </div>
        <div className={`grid2`}>
          <div className={`jstfySelfRight`}>
            <div className={styles.tagWrapper}>(Services)</div>
          </div>
          <div>Brand Identity, Digital Design, Web Development</div>
          {/* <div className={`jstfySelfRight`}>
            <div className={styles.tagWrapper}>(P)</div>
          </div>
          <div>+36 70 532 2963</div>
          <div className={`jstfySelfRight`}>
            <div className={styles.tagWrapper}>(@)</div>
          </div>
          <div className={styles.wrap}>gardonyi.csilla@gmail.com</div> */}
        </div>
      </div>

      <div className={styles.canvasWrapper}>
        <div className={styles.locPanel}>
          <CityDisplay
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            isAutoPlaying={isAutoPlaying}
            isSearchOpen={isSearchOpen}
            onOpenSearch={openCitySearch}
            onCloseSearch={closeCitySearch}
            onToggleAutoPlay={toggleAutoPlay}
          />
        </div>

        <SkyCanvas city={selectedCity} />
      </div>

      <div className={styles.csillagExp}>
        csillag [ˈt͡ʃilːɒɡ] n.
        <br />
        1. A celestial body that shines in the night sky. 2. A point of light in
        the darkness; a symbol of hope, wonder, or direction.
        <br />
        Hungarian — star.
      </div>

      <div className={styles.textBelow}>{/* Your text below */}</div>
    </section>
  );
}
