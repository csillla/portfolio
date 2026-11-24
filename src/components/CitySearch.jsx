import { useEffect, useState } from "react";
import styles from "./CitySearch.module.css";
import { searchCities } from "../utils/searchCities";
import { createPortal } from "react-dom";

export default function CitySearch({
  onCitySelect,
  inline = false,
  resultsContainer,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const cities = await searchCities(trimmedQuery, controller.signal);

        setResults(cities);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError("Something went wrong. Please try again.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (city) => {
    onCitySelect(city);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      <div className={inline ? styles.searchRow : styles.searchContent}>
        {!inline && (
          <svg
            className={styles.searchIcon}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M19.6,21l-6.3-6.3q-0.75,0.6-1.72,0.95T9.5,16q-2.72,0-4.61-1.89Q3,12.23 3,9.5Q3,6.77 4.89,4.89T9.5,3t4.61,1.89T16,9.5q0,1.1-0.35,2.07T14.7,13.3L21,19.6L19.6,21ZM9.5,14q1.88,0 3.19-1.31T14,9.5T12.69,6.31T9.5,5T6.31,6.31T5,9.5t1.31,3.19T9.5,14Z" />
          </svg>
        )}

        <div className={inline ? styles.searchRow : styles.searchContent}>
          <input
            className={styles.searchInput}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for city"
            autoFocus
          />
        </div>
      </div>

      {query.trim().length >= 2 &&
        resultsContainer &&
        createPortal(
          <div className={styles.suggestions}>
            {isLoading && (
              <div className={styles.searchMessage}>Searching...</div>
            )}

            {!isLoading && error && (
              <div className={styles.searchMessage}>{error}</div>
            )}

            {!isLoading && !error && results.length === 0 && (
              <div className={styles.searchMessage}>No cities found.</div>
            )}

            {!isLoading &&
              results.map((city, index) => (
                <button
                  type="button"
                  className={styles.suggestion}
                  key={`${city.name}-${city.country}-${index}`}
                  onClick={() => handleSelect(city)}
                >
                  <span>
                    <svg
                      className={styles.locIcon}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13.41,11.41Q14,10.83 14,10q0-0.83-0.59-1.41T12,8T10.59,8.59T10,10t0.59,1.41T12,12t1.41-0.59ZM12,22q-4.02-3.43-6.01-6.36T4,10.2Q4,6.45 6.41,4.22T12,2t5.59,2.22T20,10.2q0,2.5-1.99,5.44Q16.03,18.58 12,22Z" />
                    </svg>
                  </span>
                  <span className={styles.suggestionInner}>
                    <span>{city.name}</span>
                    <span>,&nbsp;</span>
                    <span className={styles.country}>{city.country}</span>
                  </span>
                </button>
              ))}
          </div>,
          resultsContainer
        )}
    </>
  );
}
