const API_KEY = "121752a2"
const BASE_URL = "https://www.omdbapi.com/"
const FALLBACK_POSTER = "https://via.placeholder.com/300x450?text=No+Poster"

let removeListeners = []
let swiperInstances = []

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function on(target, event, handler, options) {
  target.addEventListener(event, handler, options)
  removeListeners.push(() => target.removeEventListener(event, handler, options))
}

function destroyPrevious() {
  removeListeners.forEach((remove) => remove())
  removeListeners = []
  swiperInstances.forEach((swiper) => swiper?.destroy?.(true, true))
  swiperInstances = []
}

function ensureSwiperLoaded() {
  if (window.Swiper) return Promise.resolve(window.Swiper)

  const existingScript = document.querySelector('script[data-home-swiper="script"]')
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(window.Swiper), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Swiper script")), { once: true })
    })
  }

  if (!document.querySelector('link[data-home-swiper="style"]')) {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
    link.setAttribute("data-home-swiper", "style")
    document.head.appendChild(link)
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"
    script.async = true
    script.setAttribute("data-home-swiper", "script")
    script.onload = () => resolve(window.Swiper)
    script.onerror = () => reject(new Error("Failed to load Swiper script"))
    document.body.appendChild(script)
  })
}

function renderSkeleton(containerId, count = 8) {
  const container = document.getElementById(containerId)
  if (!container) return

  container.innerHTML = Array.from({ length: count }, () => '<div class="swiper-slide"><div class="home-skeleton"></div></div>').join("")
}

async function fetchMovies(query) {
  const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`)
  const data = await response.json()

  if (data.Response !== "True" || !Array.isArray(data.Search)) return []

  return data.Search.filter((movie, index, list) => index === list.findIndex((item) => item.imdbID === movie.imdbID))
}

function renderMovieSlides(containerId, movies) {
  const container = document.getElementById(containerId)
  if (!container) return

  if (!movies.length) {
    container.innerHTML = '<div class="swiper-slide"><p>No results found.</p></div>'
    return
  }

  container.innerHTML = movies
    .map((movie) => {
      const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : FALLBACK_POSTER
      return `
        <div class="swiper-slide">
          <article class="home-movie-card" data-movie-id="${escapeHtml(movie.imdbID)}">
            <img src="${escapeHtml(poster)}" alt="${escapeHtml(movie.Title)}" loading="lazy" />
            <p class="home-movie-card__title">${escapeHtml(movie.Title)}</p>
          </article>
        </div>
      `
    })
    .join("")
}

function initSwipers(Swiper) {
  const heroSwiper = new Swiper(".home-hero__swiper", {
    loop: true,
    effect: "fade",
    fadeEffect: { crossFade: true },
    autoplay: { delay: 5000, disableOnInteraction: false },
    speed: 1200
  })

  const trendingSwiper = new Swiper(".home-swiper--trending", {
    slidesPerView: 2,
    spaceBetween: 14,
    navigation: {
      nextEl: ".home-swiper-next-trending",
      prevEl: ".home-swiper-prev-trending"
    },
    breakpoints: {
      640: { slidesPerView: 3, spaceBetween: 16 },
      960: { slidesPerView: 4, spaceBetween: 18 },
      1240: { slidesPerView: 5, spaceBetween: 20 }
    }
  })

  const popularSwiper = new Swiper(".home-swiper--popular", {
    slidesPerView: 2,
    spaceBetween: 14,
    navigation: {
      nextEl: ".home-swiper-next-popular",
      prevEl: ".home-swiper-prev-popular"
    },
    breakpoints: {
      640: { slidesPerView: 3, spaceBetween: 16 },
      960: { slidesPerView: 4, spaceBetween: 18 },
      1240: { slidesPerView: 5, spaceBetween: 20 }
    }
  })

  swiperInstances.push(heroSwiper, trendingSwiper, popularSwiper)
}

async function openMovieModal(movieId) {
  const modal = document.getElementById("home-movie-modal")
  const body = document.getElementById("home-modal-body")
  if (!modal || !body || !movieId) return

  try {
    const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${encodeURIComponent(movieId)}&plot=full`)
    const movie = await response.json()
    if (movie.Response !== "True") return

    const poster = movie.Poster && movie.Poster !== "N/A" ? movie.Poster : FALLBACK_POSTER
    body.innerHTML = `
      <div class="home-modal__hero" style="background-image:url('${escapeHtml(poster)}')"></div>
      <div class="home-modal__info">
        <h3>${escapeHtml(movie.Title)}</h3>
        <p class="home-modal__meta">
          <span>⭐ ${escapeHtml(movie.imdbRating || "N/A")}</span>
          <span>${escapeHtml(movie.Year || "-")}</span>
          <span>${escapeHtml(movie.Runtime || "-")}</span>
        </p>
        <p class="home-modal__desc">${escapeHtml(movie.Plot || "No description")}</p>
      </div>
    `

    modal.style.display = "block"
    modal.setAttribute("aria-hidden", "false")
    document.body.style.overflow = "hidden"
  } catch (error) {
    console.error("Failed to load movie details:", error)
  }
}

function closeMovieModal() {
  const modal = document.getElementById("home-movie-modal")
  if (!modal) return
  modal.style.display = "none"
  modal.setAttribute("aria-hidden", "true")
  document.body.style.overflow = ""
}

function bindUiEvents(root) {
  on(root, "click", (event) => {
    const card = event.target.closest("[data-movie-id]")
    if (card) {
      openMovieModal(card.getAttribute("data-movie-id"))
      return
    }

    const scrollButton = event.target.closest("[data-scroll-target]")
    if (scrollButton) {
      const id = scrollButton.getAttribute("data-scroll-target")
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
      return
    }

    if (event.target.closest("[data-open-sample]")) {
      openMovieModal("tt0903747")
      return
    }

    if (event.target.closest(".home-modal__close")) {
      closeMovieModal()
      return
    }

    if (event.target.id === "home-movie-modal") {
      closeMovieModal()
    }
  })

  const searchInput = document.getElementById("home-search-input")
  if (searchInput) {
    on(searchInput, "keypress", async (event) => {
      if (event.key !== "Enter") return

      const query = searchInput.value.trim()
      if (query.length < 3) return

      const hero = document.getElementById("hero-section")
      if (hero) hero.style.display = "none"

      renderSkeleton("home-trending-list", 8)
      const searched = await fetchMovies(query)
      renderMovieSlides("home-trending-list", searched)
      swiperInstances.forEach((swiper) => swiper?.update?.())
    })
  }

  document.querySelectorAll(".home-faq__item").forEach((item) => {
    on(item, "toggle", () => {
      if (!item.open) return
      document.querySelectorAll(".home-faq__item").forEach((other) => {
        if (other !== item && other.open) other.removeAttribute("open")
      })
    })
  })

  const backToTop = document.getElementById("home-back-to-top")
  if (backToTop) {
    on(window, "scroll", () => {
      backToTop.style.display = window.scrollY > 360 ? "inline-flex" : "none"
    })

    on(backToTop, "click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    })
  }
}

export async function init() {
  destroyPrevious()

  const root = document.querySelector(".home-page")
  if (!root) return

  try {
    const Swiper = await ensureSwiperLoaded()

    renderSkeleton("home-trending-list", 8)
    renderSkeleton("home-popular-list", 8)

    const [trending, popular] = await Promise.all([fetchMovies("Marvel"), fetchMovies("Mission")])
    renderMovieSlides("home-trending-list", trending)
    renderMovieSlides("home-popular-list", popular)

    initSwipers(Swiper)
    bindUiEvents(root)
  } catch (error) {
    console.error("Failed to initialize Home page:", error)
  }
}
