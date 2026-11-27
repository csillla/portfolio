import styles from "./CityDisplay.module.css";
import { useEffect, useState } from "react";
import cities from "../data/cities";
import { getLocalTime } from "../utils/getLocalTime";
import CitySearch from "./CitySearch";

export default function CityDisplay({
  selectedCity,
  onCityChange,
  isAutoPlaying,
  isSearchOpen,
  onOpenSearch,
  onCloseSearch,
  onToggleAutoPlay,
}) {
  const [reelIndex, setReelIndex] = useState(cities.length);
  const [reelTransition, setReelTransition] = useState(true);
  const [localTime, setLocalTime] = useState("");
  const [resultsContainer, setResultsContainer] = useState(null);

  const city = selectedCity;

  const reelCities = [...cities, ...cities, ...cities, ...cities];

  useEffect(() => {
    const updateTime = () => {
      setLocalTime(getLocalTime(city.timezone));
    };

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [city]);

  // City rotation
  useEffect(() => {
    if (!isAutoPlaying || isSearchOpen) return;

    const interval = setInterval(() => {
      const nextCityIndex =
        (cities.findIndex((item) => item.name === city.name) + 1) %
        cities.length;

      onCityChange(cities[nextCityIndex]);
      setReelIndex((current) => current + cities.length + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [city, onCityChange, isAutoPlaying, isSearchOpen]);

  // Reset the reel to the beginning when autoplay starts
  useEffect(() => {
    if (!isAutoPlaying) return;

    setReelTransition(false);
    setReelIndex(cities.length);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setReelTransition(true);
      });
    });
  }, [isAutoPlaying]);

  const handleCitySelect = (newCity) => {
    onCityChange(newCity);
    onCloseSearch();
  };

  return (
    <div className={styles.cityDisplay}>
      <div
        className={`${styles.cityBubble} ${
          isSearchOpen ? styles.expanded : ""
        }`}
      >
        <div className={styles.playControls}>
          <button
            type="button"
            className={!isAutoPlaying ? styles.activeControl : ""}
            onClick={() => {
              if (!isAutoPlaying) onToggleAutoPlay();
            }}
            aria-label="Play city rotation"
          >
            <svg
              className={styles.playIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M8,19V5l11,7L8,19Z" />
            </svg>
          </button>

          <button
            type="button"
            className={isAutoPlaying ? styles.activeControl : ""}
            onClick={() => {
              if (isAutoPlaying) onToggleAutoPlay();
            }}
            aria-label="Pause city rotation"
          >
            <svg
              className={styles.playIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M16,19q-0.82,0-1.41-0.59T14,17V7q0-0.82 0.59-1.41T16,5q0.82,0 1.41,0.59Q18,6.18 18,7V17q0,0.82-0.59,1.41T16,19ZM8,19q-0.82,0-1.41-0.59T6,17V7Q6,6.18 6.59,5.59T8,5Q8.83,5 9.41,5.59Q10,6.18 10,7V17q0,0.82-0.59,1.41Q8.83,19 8,19Z" />
            </svg>
          </button>
        </div>

        <div>
          <div className={styles.cityText}>
            <span>Based in Budapest, </span>
            <span className={styles.cityTextInner}>
              <span>design for</span>

              <span
                className={styles.cityBlock}
                onClick={!isSearchOpen ? onOpenSearch : undefined}
                role={!isSearchOpen ? "button" : undefined}
                tabIndex={!isSearchOpen ? 0 : undefined}
                onKeyDown={(event) => {
                  if (
                    !isSearchOpen &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault();
                    onOpenSearch();
                  }
                }}
              >
                {!isSearchOpen ? (
                  <>
                    {isAutoPlaying ? (
                      <span className={styles.cityRoll}>
                        <span
                          className={`${styles.cityReel} ${
                            !reelTransition ? styles.noTransition : ""
                          }`}
                          style={{
                            transform: `translateY(-${reelIndex * 1.2}em)`,
                          }}
                          onTransitionEnd={(event) => {
                            if (event.propertyName !== "transform") return;

                            const nextIndex = reelIndex % cities.length;

                            setReelTransition(false);
                            setReelIndex(nextIndex + cities.length);

                            requestAnimationFrame(() => {
                              requestAnimationFrame(() => {
                                setReelTransition(true);
                              });
                            });
                          }}
                        >
                          {reelCities.map((item, index) => (
                            <span className={styles.cityName} key={index}>
                              {item.name}
                            </span>
                          ))}
                        </span>
                      </span>
                    ) : (
                      <span>{city.name}</span>
                    )}

                    <svg
                      className={styles.searchIcon}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.6,21l-6.3-6.3q-0.75,0.6-1.72,0.95T9.5,16q-2.72,0-4.61-1.89Q3,12.23 3,9.5Q3,6.77 4.89,4.89T9.5,3t4.61,1.89T16,9.5q0,1.1-0.35,2.07T14.7,13.3L21,19.6L19.6,21ZM9.5,14q1.88,0 3.19-1.31T14,9.5T12.69,6.31T9.5,5T6.31,6.31T5,9.5t1.31,3.19T9.5,14Z" />
                    </svg>
                  </>
                ) : (
                  <CitySearch
                    onCitySelect={handleCitySelect}
                    inline
                    resultsContainer={resultsContainer}
                  />
                )}
              </span>
            </span>
          </div>

          {!isSearchOpen && (
            <div className={styles.timeBubble}>
              <span>{/* Time-of-day icon goes here */}</span>
              <span>{localTime.replace(/:/g, "|")}</span>
            </div>
          )}

          <div className={styles.searchResults} ref={setResultsContainer} />
        </div>
      </div>
    </div>
  );
}
