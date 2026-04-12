const TMDB_API_KEY = "f6c44b80699265cbc6099f14cd33dc4b"
const BASE_URL = "https://api.themoviedb.org/3"
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

let swiperInstances = []

/* ---------------- API ---------------- */

async function fetchTrending() {
  try {
    const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`)
    const data = await res.json()
    return data.results || []
  } catch (err) { console.error(err); return [] }
}

async function fetchPopular() {
  try {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`)
    const data = await res.json()
    return data.results || []
  } catch (err) { console.error(err); return [] }
}

async function fetchMovies(query) {
  try {
    const res = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`)
    const data = await res.json()
    return data.results || []
  } catch (err) { console.error(err); return [] }
}

/* ---------------- RENDER ---------------- */

function renderMovies(containerId, movies) {
  const container = document.getElementById(containerId)
  if (!container) return
  container.innerHTML = movies
    .filter((movie) => movie.poster_path)
    .map((movie) => {
      const poster = IMAGE_BASE + movie.poster_path
      return `
      <div class="swiper-slide">
        <article class="home-movie-card" data-id="${movie.id}">
          <img src="${poster}" alt="${movie.title}" loading="lazy" />
          <p class="home-movie-card__title">${movie.title}</p>
        </article>
      </div>`
    }).join("")
}

function renderCtaPosters(movies) {
  const container = document.getElementById("cta-posters")
  if (!container) return
  const withPosters = movies.filter(m => m.poster_path)
  const shuffled = [...withPosters].sort(() => Math.random() - 0.5)
  const repeated = []
  while (repeated.length < 24) repeated.push(...shuffled)
  container.innerHTML = repeated.slice(0, 24).map(m => `
    <img
      src="https://image.tmdb.org/t/p/w200${m.poster_path}"
      alt="movie poster"
      loading="lazy"
      onerror="this.style.background='#1a1f2e';this.style.border='none';this.style.opacity='0'"
    >`).join("")
}

/* ---------------- MODAL ---------------- */

async function openMovieModal(id) {
  const modal = document.getElementById("home-movie-modal")
  const body = document.getElementById("home-modal-body")
  const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`)
  const movie = await res.json()
  const poster = movie.poster_path ? IMAGE_BASE + movie.poster_path : null
  body.innerHTML = `
    <div class="home-modal__hero" style="background-image:url(${poster})"></div>
    <div class="home-modal__info">
      <h2>${movie.title}</h2>
      <p>⭐ Rating: ${movie.vote_average}</p>
      <p>${movie.overview || "No description available."}</p>
      <p>Release: ${movie.release_date || "Unknown"}</p>
    </div>`
  modal.style.display = "block"
  document.body.style.overflow = "hidden"
}

function closeModal() {
  const modal = document.getElementById("home-movie-modal")
  modal.style.display = "none"
  document.body.style.overflow = ""
}

/* ---------------- HELPERS ---------------- */

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
}

function goToPage(hash) {
  window.location.hash = hash
}

/* ---------------- SWIPERS ---------------- */

function destroySwipers() {
  swiperInstances.forEach((sw) => { if (sw && sw.destroy) sw.destroy(true, true) })
  swiperInstances = []
}

function initSwipers() {
  if (typeof Swiper === "undefined") { console.error("Swiper not loaded"); return }
  destroySwipers()

  const heroSwiper = new Swiper(".home-hero__swiper", {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: false,
    autoplay: { delay: 5000, disableOnInteraction: false },
    speed: 600,
    navigation: { nextEl: ".home-hero__next", prevEl: ".home-hero__prev" },
    pagination: { el: ".home-hero__pagination", clickable: true }
  })

  const trendingSwiper = new Swiper(".home-swiper--trending", {
    slidesPerView: 2,
    spaceBetween: 16,
    navigation: { nextEl: ".home-swiper-next-trending", prevEl: ".home-swiper-prev-trending" },
    breakpoints: {
      640: { slidesPerView: 3 },
      960: { slidesPerView: 5 },
      1200: { slidesPerView: 6 }
    }
  })

  const popularSwiper = new Swiper(".home-swiper--popular", {
    slidesPerView: 2,
    spaceBetween: 16,
    navigation: { nextEl: ".home-swiper-next-popular", prevEl: ".home-swiper-prev-popular" },
    breakpoints: {
      640: { slidesPerView: 3 },
      960: { slidesPerView: 5 },
      1200: { slidesPerView: 6 }
    }
  })

  swiperInstances.push(heroSwiper, trendingSwiper, popularSwiper)
}

/* ---------------- FAQ ---------------- */

function initFaq() {
  const items = document.querySelectorAll(".home-faq__item")
  if (!items.length) return
  const first = items[0]
  if (first) first.setAttribute("open", "")
  items.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) items.forEach((other) => { if (other !== item) other.removeAttribute("open") })
    })
  })
}

/* ---------------- PRICING ---------------- */

function initPricing() {
  const btns = document.querySelectorAll(".home-pricing__toggle-btn")
  const amounts = document.querySelectorAll(".home-pricing__amount")
  if (!btns.length) return
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      const period = btn.dataset.period
      amounts.forEach((amount) => {
        amount.textContent = period === "yearly" ? amount.dataset.yearly : amount.dataset.monthly
      })
    })
  })
}

/* ---------------- BUTTONS ---------------- */

function initButtons() {
  // Hero кнопки
  const slide1Btn = document.querySelector(".home-hero__slide--1 .home-btn")
  const slide2Btn = document.querySelector(".home-hero__slide--2 .home-btn")
  const slide3Btn = document.querySelector(".home-hero__slide--3 .home-btn")
  if (slide1Btn) slide1Btn.addEventListener("click", () => scrollToSection("trending-movies"))
  if (slide2Btn) slide2Btn.addEventListener("click", () => scrollToSection("popular-movies"))
  if (slide3Btn) slide3Btn.addEventListener("click", () => scrollToSection("trending-movies"))

  // FAQ кнопка
  const askBtn = document.querySelector(".home-faq__ask-btn")
  if (askBtn) askBtn.addEventListener("click", () => goToPage("#/support"))

  // Pricing кнопки
  document.querySelectorAll(".home-pricing__trial").forEach((btn) => {
    btn.addEventListener("click", () => goToPage("#/subscription"))
  })
  document.querySelectorAll(".home-pricing__actions .home-btn").forEach((btn) => {
    btn.addEventListener("click", () => goToPage("#/subscription"))
  })

  // CTA кнопка
  const ctaBtn = document.querySelector(".home-cta__btn")
  if (ctaBtn) ctaBtn.addEventListener("click", () => goToPage("#/subscription"))

  // Footer Home ссылки — скролл к секциям через data-scroll
  document.querySelectorAll("[data-scroll]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const id = link.getAttribute("data-scroll")
      scrollToSection(id)
    })
  })
}

/* ---------------- EVENTS ---------------- */

function bindEvents() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".home-movie-card")
    if (card) openMovieModal(card.dataset.id)
    if (e.target.classList.contains("home-modal__close") || e.target.id === "home-movie-modal") closeModal()
  })

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal() })

  const backBtn = document.getElementById("home-back-to-top")
  if (backBtn) {
    window.addEventListener("scroll", () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100
      backBtn.style.display = (window.scrollY > 400 && !nearBottom) ? "flex" : "none"
    })
    backBtn.addEventListener("click", () => { window.scrollTo({ top: 0, behavior: "smooth" }) })
  }
}

/* ---------------- SEARCH ---------------- */

function initSearch() {
  const input = document.getElementById("home-search-input")
  if (!input) return
  input.addEventListener("keypress", async (e) => {
    if (e.key !== "Enter") return
    const query = input.value.trim()
    if (query.length < 3) return
    const movies = await fetchMovies(query)
    renderMovies("home-trending-list", movies)
    setTimeout(() => initSwipers(), 0)
  })
}

/* ---------------- INIT ---------------- */

export async function init() {
  initFaq()
  initPricing()
  initButtons()
  bindEvents()
  initSearch()

  const [trending, popular] = await Promise.all([fetchTrending(), fetchPopular()])

  renderMovies("home-trending-list", trending)
  renderMovies("home-popular-list", popular)
  renderCtaPosters([...trending, ...popular])

  setTimeout(() => initSwipers(), 0)
}