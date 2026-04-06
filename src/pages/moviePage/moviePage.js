import {
  getMovieGenres,
  getMoviesByGenre,
  getTopRatedMovies,
  getTrendingMovies,
  getTrendingShows,
  getUpcomingMovies,
  getOnAirShows,
  getTopRatedShows
} from "../../services/api.js"

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

const fallbackSlides = [
  {
    title: "Avengers: Endgame",
    description: "With the help of remaining allies, the Avengers must assemble once more to restore balance to the universe.",
    image: ""
  },
  {
    title: "Featured Collection",
    description: "Trending highlights from the latest catalog appear here automatically.",
    image: ""
  },
  {
    title: "Weekly Spotlight",
    description: "Curated picks are refreshed using TMDB data.",
    image: ""
  }
]

const fallbackGenres = ["Action", "Adventure", "Comedy", "Drama", "Horror", "Thriller", "Science Fiction", "Animation"]

const rowConfig = {
  "movie-genres": { kind: "genre", renderer: renderGenreRow },
  "top10-genres": { kind: "genre", renderer: renderGenreTopRow },
  "trending-now": { kind: "media", renderer: (items) => renderMediaRow(items, "compact") },
  "new-releases": { kind: "media", renderer: (items) => renderMediaRow(items, "release") },
  "must-watch-movies": { kind: "media", renderer: (items) => renderMediaRow(items, "feature") },
  "trending-shows": { kind: "media", renderer: (items) => renderMediaRow(items, "compact") },
  "new-released-shows": { kind: "media", renderer: (items) => renderMediaRow(items, "release") },
  "must-watch-shows": { kind: "media", renderer: (items) => renderMediaRow(items, "feature") }
}

let slides = [...fallbackSlides]
let activeSlide = 0
let autoplayId

let rowData = {}
const rowIndexState = new Map()
let resizeHandler

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function imageUrl(path, size = "w500") {
  if (!path) return ""
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

function normalizeDescription(text) {
  if (!text) return "No description available yet."
  return text.length > 190 ? `${text.slice(0, 190).trim()}...` : text
}

function buildDuration(seed) {
  const minutes = 95 + (seed % 80)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours}h ${String(rest).padStart(2, "0")}min`
}

function buildSeason(seed) {
  return `${1 + (seed % 5)} Season`
}

function buildViews(popularity = 0) {
  const value = Math.max(1, Math.round(popularity))
  return `${value}K`
}

function starsMarkup(voteAverage = 0) {
  const activeCount = Math.max(1, Math.min(5, Math.round(voteAverage / 2)))
  return Array.from({ length: 5 }, (_, index) => `<span class="media-card__star${index < activeCount ? " is-active" : ""}">&#9733;</span>`).join("")
}

function mapMoviesToSlides(movies) {
  return movies
    .filter((movie) => movie.backdrop_path)
    .slice(0, 6)
    .map((movie) => ({
      title: movie.title || movie.name || "Untitled",
      description: normalizeDescription(movie.overview),
      image: imageUrl(movie.backdrop_path, "original")
    }))
}

function toMediaCard(item, mode) {
  const seed = item.id || Math.round(item.popularity || 1)
  const title = item.title || item.name || "Untitled"

  if (mode === "release") {
    const dateText = item.release_date || item.first_air_date || "2026-01-01"
    return {
      title,
      poster: imageUrl(item.poster_path),
      leftMeta: `Released at ${dateText}`,
      rightMeta: ""
    }
  }

  if (mode === "feature") {
    return {
      title,
      poster: imageUrl(item.poster_path),
      leftMeta: buildDuration(seed),
      rightMeta: starsMarkup(item.vote_average),
      rightMetaType: "rating"
    }
  }

  return {
    title,
    poster: imageUrl(item.poster_path),
    leftMeta: buildDuration(seed),
    rightMeta: item.media_type === "tv" || item.first_air_date ? buildSeason(seed) : buildViews(item.popularity)
  }
}

function buildFallbackMedia(prefix, count = 12, mode = "compact") {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `${prefix} ${index + 1}`,
    popularity: 2 * index + 5,
    vote_average: 6.5 + (index % 3),
    mode
  }))
}

function clearAutoplay() {
  if (autoplayId) {
    clearInterval(autoplayId)
    autoplayId = undefined
  }
}

function updateSlide(sliderEl, titleEl, descriptionEl, indicatorsEl) {
  const slide = slides[activeSlide]

  sliderEl.style.backgroundImage = slide.image
    ? `url("${slide.image}")`
    : "linear-gradient(130deg, #181d2a 0%, #0b1019 54%, #101521 100%)"

  titleEl.textContent = slide.title
  descriptionEl.textContent = slide.description

  indicatorsEl.querySelectorAll(".hero-slider__dot").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeSlide)
    dot.setAttribute("aria-current", index === activeSlide ? "true" : "false")
  })
}

function moveSlide(step, sliderEl, titleEl, descriptionEl, indicatorsEl) {
  activeSlide = (activeSlide + step + slides.length) % slides.length
  updateSlide(sliderEl, titleEl, descriptionEl, indicatorsEl)
}

function startAutoplay(sliderEl, titleEl, descriptionEl, indicatorsEl) {
  clearAutoplay()
  autoplayId = setInterval(() => {
    moveSlide(1, sliderEl, titleEl, descriptionEl, indicatorsEl)
  }, 6200)
}

async function loadSlidesFromApi() {
  const movies = await getTrendingMovies()
  const mappedSlides = mapMoviesToSlides(movies)
  slides = mappedSlides.length > 0 ? mappedSlides : [...fallbackSlides]
  activeSlide = 0
}

function buildFallbackGenreRows() {
  const genres = fallbackGenres.map((name) => ({
    name,
    posters: []
  }))

  return {
    genres,
    topGenres: genres.slice(0, 6)
  }
}

async function loadGenresFromApi() {
  const allGenres = await getMovieGenres()
  if (!allGenres.length) return buildFallbackGenreRows()

  const selected = fallbackGenres
    .map((name) => allGenres.find((genre) => genre.name === name))
    .filter(Boolean)

  const finalGenres = selected.length > 0 ? selected.slice(0, 8) : allGenres.slice(0, 8)

  const moviesByGenre = await Promise.all(finalGenres.map((genre) => getMoviesByGenre(genre.id)))

  const genres = finalGenres.map((genre, index) => ({
    id: genre.id,
    name: genre.name,
    posters: moviesByGenre[index]
      .map((movie) => imageUrl(movie.poster_path, "w342"))
      .filter(Boolean)
      .slice(0, 4)
  }))

  return {
    genres,
    topGenres: [...genres].sort((a, b) => b.name.length - a.name.length)
  }
}

async function loadRowsData() {
  const [trendingMovies, upcomingMovies, topRatedMovies, trendingShows, onAirShows, topRatedShows, genreRows] = await Promise.all([
    getTrendingMovies(),
    getUpcomingMovies(),
    getTopRatedMovies(),
    getTrendingShows(),
    getOnAirShows(),
    getTopRatedShows(),
    loadGenresFromApi()
  ])

  rowData = {
    "movie-genres": genreRows.genres,
    "top10-genres": genreRows.topGenres,
    "trending-now": (trendingMovies.length ? trendingMovies : buildFallbackMedia("Trending", 14, "compact")).map((item) => toMediaCard(item, "compact")),
    "new-releases": (upcomingMovies.length ? upcomingMovies : buildFallbackMedia("Release", 12, "release")).map((item) => toMediaCard(item, "release")),
    "must-watch-movies": (topRatedMovies.length ? topRatedMovies : buildFallbackMedia("Must Watch", 12, "feature")).map((item) => toMediaCard(item, "feature")),
    "trending-shows": (trendingShows.length ? trendingShows : buildFallbackMedia("Show", 14, "compact")).map((item) => toMediaCard({ ...item, media_type: "tv" }, "compact")),
    "new-released-shows": (onAirShows.length ? onAirShows : buildFallbackMedia("On Air", 12, "release")).map((item) => toMediaCard({ ...item, media_type: "tv" }, "release")),
    "must-watch-shows": (topRatedShows.length ? topRatedShows : buildFallbackMedia("Top Show", 12, "feature")).map((item) => toMediaCard({ ...item, media_type: "tv" }, "feature"))
  }
}

function posterMarkup(src, alt) {
  if (!src) return '<div class="media-card__poster-placeholder" aria-hidden="true"></div>'
  return `<img class="media-card__poster" src="${src}" alt="${escapeHtml(alt)}" loading="lazy">`
}

function renderMediaRow(items, mode) {
  return items
    .map((item) => {
      const rightMetaMarkup =
        item.rightMetaType === "rating"
          ? `<span class="media-card__rating" aria-label="Rating">${item.rightMeta}</span>`
          : item.rightMeta
            ? `<span class="media-card__meta">${escapeHtml(item.rightMeta)}</span>`
            : ""

      return `
        <article class="media-card media-card--${mode}" aria-label="${escapeHtml(item.title)}">
          <div class="media-card__poster-box">
            ${posterMarkup(item.poster, item.title)}
          </div>
          <div class="media-card__footer">
            <span class="media-card__meta">${escapeHtml(item.leftMeta)}</span>
            ${rightMetaMarkup}
          </div>
        </article>
      `
    })
    .join("")
}

function genreCollageMarkup(posters, title) {
  return Array.from({ length: 4 }, (_, index) => {
    const poster = posters[index]
    if (!poster) return '<div class="genre-tile__placeholder" aria-hidden="true"></div>'
    return `<img class="genre-tile__poster" src="${poster}" alt="${escapeHtml(title)} poster ${index + 1}" loading="lazy">`
  }).join("")
}

function renderGenreRow(items) {
  return items
    .map(
      (genre) => `
      <article class="genre-tile" aria-label="${escapeHtml(genre.name)}">
        <div class="genre-tile__collage">
          ${genreCollageMarkup(genre.posters, genre.name)}
        </div>
        <div class="genre-tile__footer">
          <p class="genre-tile__name">${escapeHtml(genre.name)}</p>
          <span class="genre-tile__arrow" aria-hidden="true">&#8594;</span>
        </div>
      </article>
    `
    )
    .join("")
}

function renderGenreTopRow(items) {
  return items
    .map(
      (genre) => `
      <article class="genre-tile" aria-label="${escapeHtml(genre.name)} top 10">
        <div class="genre-tile__collage">
          ${genreCollageMarkup(genre.posters, genre.name)}
        </div>
        <span class="genre-tile__top-badge">Top 10 In</span>
        <div class="genre-tile__footer">
          <p class="genre-tile__name">${escapeHtml(genre.name)}</p>
          <span class="genre-tile__arrow" aria-hidden="true">&#8594;</span>
        </div>
      </article>
    `
    )
    .join("")
}

function visibleCountByWidth() {
  if (window.innerWidth <= 620) return 2
  if (window.innerWidth <= 860) return 3
  if (window.innerWidth <= 1040) return 4
  return 5
}

function updateSectionControls(sectionEl, startIndex, maxStart) {
  const navButtons = Array.from(sectionEl.querySelectorAll("[data-row-dir]"))
  const prevButton = navButtons.find((button) => Number(button.getAttribute("data-row-dir")) < 0)
  const nextButton = navButtons.find((button) => Number(button.getAttribute("data-row-dir")) > 0)
  if (!prevButton || !nextButton) return

  prevButton.disabled = startIndex <= 0
  nextButton.disabled = startIndex >= maxStart
}

function renderRowById(rowId) {
  const sectionEl = document.querySelector(`[data-row-section="${rowId}"]`)
  const trackEl = document.querySelector(`[data-row-track="${rowId}"]`)
  if (!sectionEl || !trackEl) return

  const config = rowConfig[rowId]
  const allItems = rowData[rowId] || []
  const visibleCount = visibleCountByWidth()
  const maxStart = Math.max(allItems.length - visibleCount, 0)

  const currentIndex = Math.min(Math.max(rowIndexState.get(rowId) || 0, 0), maxStart)
  rowIndexState.set(rowId, currentIndex)

  const visibleItems = allItems.slice(currentIndex, currentIndex + visibleCount)
  trackEl.innerHTML = config.renderer(visibleItems)

  updateSectionControls(sectionEl, currentIndex, maxStart)
}

function renderAllRows() {
  Object.keys(rowConfig).forEach((rowId) => renderRowById(rowId))
}

function bindRowControls() {
  document.querySelectorAll("[data-row-target][data-row-dir]").forEach((button) => {
    button.addEventListener("click", () => {
      const rowId = button.getAttribute("data-row-target")
      const step = Number(button.getAttribute("data-row-dir"))
      if (!rowId || Number.isNaN(step) || step === 0) return

      rowIndexState.set(rowId, (rowIndexState.get(rowId) || 0) + step)
      renderRowById(rowId)
    })
  })
}

function bindResizeHandler() {
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler)
  }

  resizeHandler = () => renderAllRows()
  window.addEventListener("resize", resizeHandler)
}

export async function init() {
  const sliderEl = document.querySelector("[data-slider]")
  if (!sliderEl) return

  clearAutoplay()
  await Promise.all([loadSlidesFromApi(), loadRowsData()])

  const titleEl = sliderEl.querySelector("[data-title]")
  const descriptionEl = sliderEl.querySelector("[data-description]")
  const indicatorsEl = sliderEl.querySelector("[data-indicators]")
  const navButtons = sliderEl.querySelectorAll("[data-slide-dir]")

  if (!titleEl || !descriptionEl || !indicatorsEl || navButtons.length === 0) return

  indicatorsEl.innerHTML = slides
    .map(
      (_, index) =>
        `<button class="hero-slider__dot${index === activeSlide ? " is-active" : ""}" type="button" data-index="${index}" aria-label="Go to slide ${index + 1}" aria-current="${index === activeSlide ? "true" : "false"}"></button>`
    )
    .join("")

  updateSlide(sliderEl, titleEl, descriptionEl, indicatorsEl)

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = Number(button.getAttribute("data-slide-dir"))
      moveSlide(direction, sliderEl, titleEl, descriptionEl, indicatorsEl)
    })
  })

  indicatorsEl.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-index]")
    if (!dot) return

    activeSlide = Number(dot.getAttribute("data-index"))
    updateSlide(sliderEl, titleEl, descriptionEl, indicatorsEl)
  })

  sliderEl.addEventListener("mouseenter", () => clearAutoplay())
  sliderEl.addEventListener("mouseleave", () => startAutoplay(sliderEl, titleEl, descriptionEl, indicatorsEl))

  bindRowControls()
  bindResizeHandler()
  renderAllRows()
  startAutoplay(sliderEl, titleEl, descriptionEl, indicatorsEl)
}
