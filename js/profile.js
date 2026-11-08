const profileStorageKey = "diner-profile-v1"
function loadDemoProfile() {
    try {
        const value = JSON.parse(localStorage.getItem(profileStorageKey))
        if (value && value.version === 1) {
            return { version: 1, name: typeof value.name === "string" ? value.name.slice(0, 80) : "", email: typeof value.email === "string" ? value.email.slice(0, 254) : "" }
        }
    } catch { /* При недоступном хранилище используем значения формы. */ }
    return { version: 1, name: "", email: "" }
}
const demoProfile = loadDemoProfile()
function rememberDemoProfile() {
    if (firstName.value.trim()) demoProfile.name = firstName.value.trim().slice(0, 80)
    if (email.value.trim() && email.checkValidity()) demoProfile.email = email.value.trim().slice(0, 254)
    try { localStorage.setItem(profileStorageKey, JSON.stringify(demoProfile)) } catch { /* Профиль остаётся в памяти текущей вкладки. */ }
}
accountForm.addEventListener("submit", function() {
    if (email.checkValidity()) rememberDemoProfile()
})
nameForm.addEventListener("submit", function() {
    if (firstName.value.trim()) rememberDemoProfile()
})
if (!firstName.value && demoProfile.name) firstName.value = demoProfile.name
if (!email.value && demoProfile.email) email.value = demoProfile.email
updateNameButton()
updateEmailButton()
function profileCountLabel(count, one, few, many) {
    const lastTwo = count % 100
    const last = count % 10
    if (lastTwo >= 11 && lastTwo <= 14) return many
    return last === 1 ? one : last >= 2 && last <= 4 ? few : many
}
function updateProfileStats() {
    const completed = meetingState.bookings.filter(meeting => getMeetingPhase(meeting) === 3).length
    document.getElementById("profile-event-count").textContent = completed
    // В демо на встречах используется одна и та же четвёрка людей.
    const people = completed ? demoPeople.length : 0
    document.getElementById("profile-people-count").textContent = people
    document.getElementById("profile-event-label").textContent = profileCountLabel(completed, "встреча", "встречи", "встреч")
    document.getElementById("profile-people-label").textContent = profileCountLabel(people, "знакомство", "знакомства", "знакомств")
}
function renderProfile() {
    rememberDemoProfile()
    document.getElementById("profile-name").textContent = demoProfile.name || "Участник diner"
    updateProfileStats()
}
function openProfile() {
    if (screenTransition) return
    renderProfile()
    showScreen(document.getElementById("profile"), document.getElementById("profile-title"))
}
document.getElementById("open-security").addEventListener("click", function() {
    if (screenTransition) return
    rememberDemoProfile()
    document.getElementById("security-email").textContent = demoProfile.email || "Почта не указана"
    document.getElementById("copy-profile-email").disabled = !demoProfile.email
    document.getElementById("profile-copy-status").textContent = ""
    showScreen(document.getElementById("security"), document.getElementById("security-title"))
})
let copyingProfileEmail = false
document.getElementById("copy-profile-email").addEventListener("click", async function() {
    if (copyingProfileEmail || !demoProfile.email) return
    copyingProfileEmail = true
    const status = document.getElementById("profile-copy-status")
    let copied = false
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(demoProfile.email)
            copied = true
        }
    } catch { /* Если браузер отклоняет Clipboard API, пробуем выделяемое поле. */ }
    if (!copied) {
        const field = document.createElement("textarea")
        field.value = demoProfile.email
        field.setAttribute("aria-label", "Адрес для копирования")
        field.style.position = "fixed"
        field.style.opacity = "0"
        document.body.append(field)
        field.select()
        try { copied = document.execCommand("copy") } catch { /* Адрес остаётся доступен для ручного выделения. */ }
        field.remove()
        this.focus({ preventScroll: true })
    }
    status.textContent = copied ? "Почта скопирована" : "Не удалось скопировать. Выделите адрес и скопируйте его вручную."
    copyingProfileEmail = false
})
document.addEventListener("visibilitychange", function() {
    if (!document.hidden && !document.getElementById("profile").hidden) updateProfileStats()
})
