/**
 * MovieApp НЕГІЗГІ ЛОГИКАСЫ
 * Функционал: Hero Swiper, API-ден дерек алу, Модальді терезе, Іздеу және FAQ.
 */

const API_KEY = "121752a2";
const BASE_URL = "https://www.omdbapi.com/";

// Swiper даналарын сақтауға арналған объект
let swiperInstances = {};

/**
 * 1. БАСТЫ БАННЕР (HERO) SWIPER-І
 */
function initHeroSwiper() {
    new Swiper('.hero-swiper', {
        loop: true,
        effect: 'fade', 
        fadeEffect: { crossFade: true },
        autoplay: {
            delay: 5000, 
            disableOnInteraction: false,
        },
        speed: 1500,
    });
}

/**
 * 2. ФИЛЬМДЕРДІ ЖҮКТЕУ (API)
 */
async function fetchMovies(query, containerId, swiperSelector) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${query}`);
        const data = await response.json();

        if (data.Response === "True") {
            container.innerHTML = data.Search.map(movie => {
                const poster = movie.Poster !== "N/A" 
                    ? movie.Poster 
                    : "https://via.placeholder.com/300x450?text=No+Poster";
                
                return `
                    <div class="swiper-slide">
                        <div class="movie-card" onclick="openMovieModal('${movie.imdbID}')">
                            <img src="${poster}" alt="${movie.Title}" loading="lazy">
                            <div class="movie-info">
                                <p>${movie.Title}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            initSwiper(swiperSelector);
        }
    } catch (error) {
        console.error("Деректерді жүктеу қатесі:", error);
    }
}

/**
 * 3. ТӨМЕНГІ КАРУСЕЛЬДЕРДІ ИНИЦИАЛИЗАЦИЯЛАУ
 */
function initSwiper(selector) {
    if (swiperInstances[selector]) {
        swiperInstances[selector].destroy(true, true);
    }

    swiperInstances[selector] = new Swiper(selector, {
        slidesPerView: 2,
        spaceBetween: 15,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 5, spaceBetween: 25 },
            1440: { slidesPerView: 6, spaceBetween: 25 }
        },
        observer: true,
        observeParents: true,
    });
}

/**
 * 4. МОДАЛЬДІ ТЕРЕЗЕ (INFO MODAL)
 */
const modal = document.getElementById("movie-modal");
const modalBodyContent = document.getElementById("modal-body-content");
const closeModalBtn = document.querySelector(".close-modal");

async function openMovieModal(movieId) {
    if (!movieId) return;

    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${movieId}&plot=full`);
        const movie = await response.json();

        if (movie.Response === "True") {
            const backdrop = movie.Poster !== "N/A" ? movie.Poster : "";

            modalBodyContent.innerHTML = `
                <div class="modal-body">
                    <div class="modal-hero-header" style="background-image: url('${backdrop}');"></div>
                    <div class="modal-info">
                        <h2>${movie.Title}</h2>
                        <div class="modal-meta-row">
                            <span class="modal-rating">⭐ ${movie.imdbRating} Rating</span>
                            <span class="modal-year">${movie.Year}</span>
                            <span class="modal-runtime">${movie.Runtime}</span>
                        </div>
                        <p class="modal-desc">${movie.Plot}</p>
                        <div class="modal-extra-info">
                            <p><strong>Genre:</strong> ${movie.Genre}</p>
                            <p><strong>Cast:</strong> ${movie.Actors}</p>
                        </div>
                    </div>
                </div>
            `;
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        }
    } catch (error) {
        console.error("Модальді мәлімет алу қатесі:", error);
    }
}

function closeMovieModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

if (closeModalBtn) closeModalBtn.onclick = closeMovieModal;
window.onclick = (e) => { if (e.target === modal) closeMovieModal(); };

/**
 * 5. БЕТ ЖҮКТЕЛГЕНДЕГІ ӘРЕКЕТТЕР
 */
document.addEventListener("DOMContentLoaded", () => {
    initHeroSwiper();

    // Алғашқы деректерді жүктеу
    fetchMovies("Marvel", "trending", ".trending-swiper"); 
    fetchMovies("Mission", "popular", ".popular-swiper");

    // Іздеу жүйесі
    const searchInput = document.getElementById("search");
    if (searchInput) {
        searchInput.addEventListener("keypress", async (e) => {
            if (e.key === "Enter") {
                const query = searchInput.value.trim();
                if (query.length > 2) {
                    const hero = document.getElementById('hero-section');
                    if (hero) hero.style.display = 'none';
                    
                    const sectionTitle = document.querySelector('.movie-section h2');
                    if (sectionTitle) sectionTitle.innerText = `Results for: "${query}"`;
                    
                    await fetchMovies(query, "trending", ".trending-swiper");
                }
            }
        });
    }

    // FAQ Аккордеон (Бір сұрақ ашылғанда басқасын жабу)
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.hasAttribute('open')) {
                        otherItem.removeAttribute('open');
                    }
                });
            }
        });
    });
});