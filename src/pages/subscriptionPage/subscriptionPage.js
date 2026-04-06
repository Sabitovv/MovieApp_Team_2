const prices = {
  monthly: {
    basic: "$9.99",
    standard: "$12.99",
    premium: "$14.99",
    period: "/month"
  },
  yearly: {
    basic: "$99.99",
    standard: "$129.99",
    premium: "$149.99",
    period: "/year"
  }
}

function setBilling(mode) {
  document.querySelectorAll(".billing-toggle__btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.billing === mode)
  })

  document.querySelectorAll(".plan-card").forEach((card) => {
    const plan = card.dataset.plan
    const valueEl = card.querySelector("[data-price-value]")
    const periodEl = card.querySelector("[data-price-period]")

    if (valueEl) valueEl.textContent = prices[mode][plan]
    if (periodEl) periodEl.textContent = prices[mode].period
  })
}

function setCompareTab(plan) {
  document.querySelectorAll(".compare-tabs__btn").forEach((button) => {
    const isActive = button.dataset.tabTarget === plan
    button.classList.toggle("is-active", isActive)
    button.setAttribute("aria-selected", isActive ? "true" : "false")
  })

  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    const isActive = panel.dataset.tabPanel === plan
    panel.classList.toggle("is-active", isActive)
    panel.hidden = !isActive
  })
}

export async function init() {
  document.querySelectorAll(".billing-toggle__btn").forEach((button) => {
    button.addEventListener("click", () => setBilling(button.dataset.billing))
  })

  document.querySelectorAll(".compare-tabs__btn").forEach((button) => {
    button.addEventListener("click", () => setCompareTab(button.dataset.tabTarget))
  })

  setBilling("monthly")
  setCompareTab("basic")
}
