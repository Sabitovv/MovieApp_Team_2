function setToggle(btn, val) {
  document
    .querySelectorAll(".toggle-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

function setTab(btn, plan) {
  document
    .querySelectorAll(".compare-tab")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  ["basic", "standard", "premium"].forEach((p) => {
    const el = document.getElementById("tab-" + p);
    if (el) el.style.display = p === plan ? "block" : "none";
  });
}
