const TMDB_BASE_URL = "https://api.themoviedb.org/3"

const TMDB_API_KEY = "0c4b90f48556cdec12e2d46f470b4a92"

async function tmdbRequest(path, params = {}) {

  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: "en-US",
    ...params
  })

  const url = `${TMDB_BASE_URL}${path}?${query.toString()}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status}`)
  }

  return res.json()
}

export async function getTrendingMovies() {
  try {
    const data = await tmdbRequest("/trending/movie/week")
    return Array.isArray(data.results) ? data.results : []
  } catch (error) {
    console.warn("Failed to load trending movies:", error)
    return []
  }
}

export async function getMovieGenres() {
  try {
    const data = await tmdbRequest("/genre/movie/list")
    return Array.isArray(data.genres) ? data.genres : []
  } catch (error) {
    console.warn("Failed to load movie genres:", error)
    return []
  }
}

export async function getMoviesByGenre(genreId) {
  try {
    const data = await tmdbRequest("/discover/movie", {
      with_genres: String(genreId),
      sort_by: "popularity.desc",
      page: "1"
    })
    return Array.isArray(data.results) ? data.results : []
  } catch (error) {
    console.warn(`Failed to load movies for genre ${genreId}:`, error)
    return []
  }
}

export async function getNowPlayingMovies() {
  try {
    const data = await tmdbRequest("/movie/now_playing")
    return Array.isArray(data.results) ? data.results : []
  } catch (error) {
    console.warn("Failed to load now playing movies:", error)
    return []
  }
}

export async function getUpcomingMovies() {
  try {
    const data = await tmdbRequest("/movie/upcoming")
    return Array.isArray(data.results) ? data.results : []
  } catch (error) {
    console.warn("Failed to load upcoming movies:", error)
    return []
  }
}

export async function getTopRatedMovies() {
  try {
    const data = await tmdbRequest("/movie/top_rated")
    return Array.isArray(data.results) ? data.results.slice(0, 10) : []
  } catch (error) {
    console.warn("Failed to load top rated movies:", error)
    return []
  }
}

export async function getTrendingShows() {
  try {
    const data = await tmdbRequest("/trending/tv/week")
    return Array.isArray(data.results) ? data.results : []
  } catch (error) {
    console.warn("Failed to load trending shows:", error)
    return []
  }
}

export async function getOnAirShows() {
  try {
    const data = await tmdbRequest("/tv/on_the_air")
    return Array.isArray(data.results) ? data.results : []
  } catch (error) {
    console.warn("Failed to load on-air shows:", error)
    return []
  }
}

export async function getTopRatedShows() {
  try {
    const data = await tmdbRequest("/tv/top_rated")
    return Array.isArray(data.results) ? data.results.slice(0, 12) : []
  } catch (error) {
    console.warn("Failed to load top rated shows:", error)
    return []
  }
}
