const API_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

export async function searchCities(query, signal) {
  if (!query.trim() || query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    text: query,
    type: "city",
    format: "json",
    limit: "3",
    lang: "en",
    apiKey: API_KEY,
  });

  const response = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?${params}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Geoapify error: ${response.status}`);
  }

  const data = await response.json();

  return data.results
    .filter((result) => result.timezone?.name)
    .map((result) => ({
      name: result.city || result.name,
      country: result.country,
      latitude: result.lat,
      longitude: result.lon,
      timezone: result.timezone.name,
    }));
}
