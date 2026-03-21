import { loadComponent } from "../utils/loadComponent.js";
const routes = {
  page1: "Page1"
};

function parseHash(hash){
  return hash.replace(/^#\/?/, "").split("/").filter(Boolean);
}

export function initRouter(){
  window.addEventListener("hashchange", route);
  route(); // initial
}

async function route(){
  const hash = window.location.hash || "#/page1";
  const parts = parseHash(hash);
  const base = parts[0] || "page1";
  const pageName = routes[base] || "Page";
  const folder = `/src/pages`;

  // load page HTML into #app
  const html = await loadComponent(folder, "Page");
  document.getElementById("app").innerHTML = html;

  try {
    const module = await import(`${folder}/${pageName}.js`);
    if (module.init) {
      const params = parts.slice(1);
      await module.init({ params });
    }
  } catch (err) {
    console.error("Ошибка загрузки модуля страницы:", err);
  }
}