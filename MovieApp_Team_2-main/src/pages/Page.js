import { fetchTestResource } from "../../services/api.js";

export async function init(){
  const input = document.getElementById("q");
  const btn = document.getElementById("btn-search");
  const results = document.getElementById("results");

  btn.addEventListener("click", async () => {
    const q = input.value.trim();
    results.innerHTML = "Loading...";
    const data = await fetchTestResource(q);
    renderResults(data.results || []);
  });

  // optional: run initial fetch
  const initial = await fetchTestResource("");
  renderResults(initial.results || []);
}

function renderResults(list){
  const results = document.getElementById("results");
  results.innerHTML = "";
  if (!list.length) {
    results.textContent = "Ничего не найдено";
    return;
  }
  for (const item of list) {
    const el = document.createElement("div");
    el.className = "result-card";
    el.innerHTML = `<strong>${item.title}</strong><div style="color:#9aa">${item.overview || ""}</div>`;
    results.appendChild(el);
  }
}