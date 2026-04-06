import { loadComponent } from "../utils/loadComponent.js";
const routes = {
  home: {
    folder: new URL("../pages/homePage", import.meta.url).href,
    component: "homePage",
    module: new URL("../pages/homePage/homePage.js", import.meta.url).href
  },
  movie: {
    folder: new URL("../pages/moviePage", import.meta.url).href,
    component: "moviePage",
    module: new URL("../pages/moviePage/moviePage.js", import.meta.url).href
  },
  subscription: {
    folder: new URL("../pages/subscriptionPage", import.meta.url).href,
    component: "subscriptionPage",
    module: new URL("../pages/subscriptionPage/subscriptionPage.js", import.meta.url).href
  },
  support: {
    folder: new URL("../pages/supportPage", import.meta.url).href,
    component: "supportPage",
    module: new URL("../pages/supportPage/supportPage.js", import.meta.url).href
  }
};
function parseHash(hash) {
  return hash.replace(/^#\/?/, "").split("/").filter(Boolean);
}
export function initRouter() {
  window.addEventListener("hashchange", route);
  route();
}
async function route() {
  const hash = window.location.hash || "#/home";
  const parts = parseHash(hash);
  const base = parts[0] || "home";
  const routeKey = routes[base] ? base : "home";
  const config = routes[routeKey];

  const html = await loadComponent(config.folder, config.component);

  document.getElementById("app").innerHTML = html;
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const isActive = link.getAttribute("href") === `#/${routeKey}`;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  try {
    const module = await import(config.module);
    if (module.init) {
      const params = parts.slice(1);
      await module.init({ params });
    }
  } catch (err) {
    console.error("Ошибка загрузки модуля страницы:", err);
  }
}
