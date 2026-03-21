/**
 * MovieApp НЕГІЗГІ ЛОГИКАСЫ
 * Орындалатын функциялар: API-ден дерек алу, Swiper-ді баптау, Іздеу жүйесі.
 */

const API_KEY = "121752a2"; // Сіздің OMDb API кілтіңіз
const BASE_URL = "https://www.omdbapi.com/";

// Swiper даналарын сақтауға арналған объект
let swiperInstances = {};

/**
 * 1. ФИЛЬМДЕРДІ ЖҮКТЕУ ФУНКЦИЯСЫ
 * @param {string} query - Іздеу сөзі (мысалы, 'Marvel')
 * @param {string} containerId - HTML контейнердің ID-і
 * @param {string} swiperSelector - Swiper класы
 */
async function fetchMovies(query, containerId, swiperSelector) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${query}`);
        const data = await response.json();

        if (data.Response === "True") {
            // Контейнерді тазартып, жаңа фильмдерді қосу
            container.innerHTML = data.Search.map(movie => {
                // Постер болмаса, placeholder суретті қолдану
                const poster = movie.Poster !== "N/A" 
                    ? movie.Poster 
                    : "https://via.placeholder.com/300x450?text=No+Poster";
                
                return `
                    <div class="swiper-slide">
                        <div class="movie-card">
                            <img src="${poster}" alt="${movie.Title}" loading="lazy">
                            <div class="movie-info">
                                <p>${movie.Title}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Деректер енгізілгеннен кейін Swiper-ді іске қосу немесе жаңарту
            initSwiper(swiperSelector);
        }
    } catch (error) {
        console.error("Деректерді жүктеу кезінде қате шықты:", error);
    }
}

/**
 * 2. SWIPER КАРУСЕЛІН ИНИЦИАЛИЗАЦИЯЛАУ
 * Экран өлшеміне қарай слайд санын автоматты өзгертеді
 */
function initSwiper(selector) {
    // Егер слайдер бұрыннан болса, оны жаңарту алдында жою
    if (swiperInstances[selector]) {
        swiperInstances[selector].destroy(true, true);
    }

    swiperInstances[selector] = new Swiper(selector, {
        slidesPerView: 2,         // Телефонда 2 фильм
        spaceBetween: 15,        // Арақашықтық
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 5, spaceBetween: 25 } // Үлкен экранда 5 фильм
        },
        observer: true,
        observeParents: true,
        grabCursor: true
    });
}

/**
 * 3. ІЗДЕУ ЛОГИКАСЫ (SEARCH LOGIC)
 * Enter басқанда баннерді жасырып, нәтижелерді көрсетеді
 */
const searchInput = document.getElementById("search");
if (searchInput) {
    searchInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if (query.length > 2) {
                // Басты баннерді (Hero section) жасыру
                const hero = document.getElementById('hero-section');
                if (hero) hero.style.display = 'none';
                
                // Барлық секцияларды жасырып, тек іздеу нәтижесін көрсету
                const sections = document.querySelectorAll('.movie-section');
                sections.forEach((s, index) => {
                    s.style.display = index === 0 ? 'block' : 'none';
                });

                const firstTitle = sections[0]?.querySelector('h2');
                if (firstTitle) firstTitle.innerText = `Search results for: "${query}"`;
                
                await fetchMovies(query, "trending", ".trending-swiper");
            }
        }
    });
}

/**
 * 4. БЕТ ЖҮКТЕЛГЕНДЕ АВТОМАТТЫ ТҮРДЕ ОРЫНДАЛАТЫН ӘРЕКЕТТЕР
 */
document.addEventListener("DOMContentLoaded", () => {
    // Әртүрлі санаттар бойынша фильмдерді жүктеу
    fetchMovies("Marvel", "trending", ".trending-swiper"); 
    fetchMovies("Avengers", "popular", ".popular-swiper");
});