export async function init() {
  const form = document.getElementById("supportForm")
  const status = document.getElementById("supportFormStatus")
  if (!form || !status) return

  form.addEventListener("submit", (event) => {
    event.preventDefault()
    status.textContent = "Your message has been sent to support."
    form.reset()
  })
}
