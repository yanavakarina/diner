// Расписание макета. Даты считаются по времени Челябинска.
function getHomeEvents(now = new Date()) {
    const calendar = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Yekaterinburg", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(now)
    const parts = {}
    for (const part of calendar) parts[part.type] = part.value
    const today = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))
    const monday = new Date(today)
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7)

    return getDinnerDates(now).map(function(date) {
        const day = new Date(date.iso + "T00:00:00Z")
        const type = day.getUTCDay() === 6 ? "coffee" : "dinner"
        return {
            ...date, type,
            time: type === "coffee" ? "15:00" : "19:00",
            week: Math.floor((day - monday) / (7 * 24 * 60 * 60 * 1000))
        }
    })
}

function getEventPresentation(type) {
    if (type === "coffee") {
        return {
            title: "Кофе с diner", name: "Кофе-знакомство", action: "Встретиться за кофе",
            description: "Новые знакомства за чашкой кофе. Заходите в уютную кофейню, общайтесь и превратите обычный перерыв в маленькую встречу. Вместе кофе вкуснее.",
            image: "assets/coffee-collage-reference.png", viewBox: "190 1120 790 710"
        }
    }
    return {
        title: "Ужины diner", name: "Ужин-знакомство", action: "Забронировать ужин",
        description: "Главный формат diner — ужин в небольшой компании из 4–6 человек, включая вас. Знакомьтесь с людьми с близкими интересами, пробуйте новое и наслаждайтесь живым разговором.",
        image: "assets/dinner-collage-reference.png", viewBox: "190 1190 790 710"
    }
}

function renderHomeEvents(now = new Date()) {
    const list = document.getElementById("home-event-list")
    list.replaceChildren()
    let currentWeek = -1
    let group
    for (const event of getHomeEvents(now)) {
        if (event.week !== currentWeek) {
            currentWeek = event.week
            group = document.createElement("section")
            group.className = "home-week"
            const heading = document.createElement("h3")
            heading.textContent = event.week === 0 ? "На этой неделе" : event.week === 1 ? "На следующей неделе" : "Через две недели"
            group.append(heading)
            list.append(group)
        }
        const details = getEventPresentation(event.type)
        const card = document.createElement("button")
        card.type = "button"
        card.className = "button dinner-card home-event"
        card.setAttribute("aria-haspopup", "dialog")
        card.setAttribute("aria-controls", "event-dialog")
        const icon = document.createElement("span")
        icon.className = "dinner-icon " + (event.type === "coffee" ? "coffee-icon" : "")
        const image = document.createElement("img")
        image.src = "assets/" + event.type + ".svg"
        image.alt = ""
        icon.append(image)
        const copy = document.createElement("span")
        copy.className = "dinner-copy"
        const date = document.createElement("strong")
        date.textContent = event.label
        const name = document.createElement("span")
        name.textContent = details.name
        const time = document.createElement("small")
        time.textContent = event.time
        copy.append(date, name, time)
        const arrow = document.createElement("span")
        arrow.className = "dinner-arrow"
        arrow.setAttribute("aria-hidden", "true")
        const arrowImage = document.createElement("img")
        arrowImage.src = "assets/dinner-arrow.svg"
        arrowImage.alt = ""
        arrowImage.className = "dinner-indicator"
        arrow.append(arrowImage)
        card.append(icon, copy, arrow)
        card.addEventListener("click", function() {
            eventDialogControl.open(event, card)
        })
        group.append(card)
    }
}

function createEventDialog(onBook) {
    const dialog = document.getElementById("event-dialog")
    const sheet = dialog.querySelector(".event-sheet")
    const closeButton = document.getElementById("event-close")
    const bookButton = document.getElementById("event-book")
    let selectedEvent
    let trigger
    let closing = false
    let entering
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")

    async function close() {
        if (!dialog.open || closing) return false
        closing = true
        dialog.classList.add("is-closing")
        if (entering) entering.cancel()
        if (!motion.matches && typeof sheet.animate === "function") {
            const animation = sheet.animate([
                { transform: "translateY(0)", opacity: 1 },
                { transform: "translateY(40px)", opacity: 0 }
            ], { duration: 420, easing: "cubic-bezier(.4,0,.2,1)" })
            try { await animation.finished } catch { /* Закрываем и при отмене анимации. */ }
        }
        dialog.close()
        closing = false
        if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true })
        return true
    }

    closeButton.addEventListener("click", close)
    dialog.addEventListener("cancel", function(event) {
        event.preventDefault()
        close()
    })
    dialog.addEventListener("click", function(event) {
        if (event.target === dialog) close()
    })
    bookButton.addEventListener("click", async function() {
        if (!dialog.open || closing) return
        closing = true
        if (entering) entering.cancel()
        try {
            // Передаём открытое окно переходу, без промежуточного закрытия вниз.
            await onBook(selectedEvent, dialog)
        } finally {
            closing = false
        }
    })

    return {
        open(event, source) {
            if (dialog.open || closing) return
            selectedEvent = event
            trigger = source
            const details = getEventPresentation(event.type)
            document.getElementById("event-title").textContent = details.title
            document.getElementById("event-description").textContent = details.description
            document.getElementById("event-date").textContent = event.label + " · " + event.time
            document.getElementById("event-collage").setAttribute("viewBox", details.viewBox)
            document.getElementById("event-collage-image").setAttribute("href", details.image)
            bookButton.textContent = details.action
            dialog.classList.remove("is-closing")
            dialog.showModal()
            dialog.querySelector(".event-sheet-scroll").scrollTop = 0
            if (!motion.matches && typeof sheet.animate === "function") {
                entering = sheet.animate([
                    { transform: "translateY(70px)", opacity: 0 },
                    { transform: "translateY(0)", opacity: 1 }
                ], { duration: 750, easing: "cubic-bezier(.22,1,.36,1)" })
            }
            closeButton.focus({ preventScroll: true })
        }
    }
}
