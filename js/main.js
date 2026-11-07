const welcome = document.getElementById("welcome")
const goals = document.getElementById("goals")
const start = document.getElementById("start")
const back = document.getElementById("back")
const form = document.getElementById("goals-form")
const choices = document.querySelectorAll('input[name="goal"]')
const continueButton = document.getElementById("continue")
const notice = document.getElementById("notice")
const title = document.getElementById("goals-title")

start.addEventListener("click", function() {
    welcome.hidden = true
    goals.hidden = false
    window.scrollTo(0, 0)
    title.focus({ preventScroll: true })
})

back.addEventListener("click", function() {
    goals.hidden = true
    welcome.hidden = false
    window.scrollTo(0, 0)
    start.focus({ preventScroll: true })
})

form.addEventListener("change", function(event) {
    const selected = [...choices].filter(function(choice) {
        return choice.checked
    })

    if (selected.length > 2) {
        event.target.checked = false
        notice.textContent = "Можно выбрать только две цели. Сними одну, чтобы выбрать другую."
        return
    }

    notice.textContent = ""
    continueButton.disabled = selected.length === 0
})

form.addEventListener("submit", function(event) {
    event.preventDefault()
    // Переход подключим, когда добавим следующий экран регистрации.
})
