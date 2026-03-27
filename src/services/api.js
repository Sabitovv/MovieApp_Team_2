export async function fetchTestResource(q = ""){
  const url = `https://api.example.com/search?q=${encodeURIComponent(q)}&page=1`;
  // пример с TMDB (в комментарии)
  // const url = `https://api.themoviedb.org/3/search/movie?api_key=YOUR_API_KEY&query=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      // вернуть тестовые данные, если ссылка не работает
      console.warn("API returned non-ok status:", res.status);
      return { results: [{ id: 101, title: "Test fallback movie", overview: "Fallback data" }] };
    }
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn("Fetch failed, returning fallback data:", err);
    return { results: [{ id: 100, title: "Offline movie", overview: "Local fallback" }] };
  }
}