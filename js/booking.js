function getDinnerDates(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Asia/Yekaterinburg",
        year: "numeric", month: "numeric", day: "numeric"
    }).formatToParts(now)
    const values = {}

    for (const part of parts) {
        values[part.type] = part.value
    }

    const day = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)))
    const dates = []

    while (dates.length < 4) {
        day.setUTCDate(day.getUTCDate() + 1)

        if (day.getUTCDay() === 3 || day.getUTCDay() === 6) {
            const label = day.toLocaleDateString("ru-RU", {
                timeZone: "UTC", weekday: "long", day: "numeric", month: "long"
            })
            dates.push({
                iso: day.toISOString().slice(0, 10),
                label: label.charAt(0).toLocaleUpperCase("ru-RU") + label.slice(1)
            })
        }
    }

    return dates
}

function getBookingTags(energyValue, qualities) {
    const social = getEnergyPresentation(energyValue)
    const icons = { introvert: "🌙", ambivert: "✨", extrovert: "☀️" }
    return [{ label: social.label, emoji: icons[social.state] }, ...qualities]
}

function renderDinnerSuggestions() {
    const booking = document.getElementById("booking")
    const container = document.getElementById("dinner-suggestions")
    const selection = document.getElementById("booking-selection")
    const bookButton = document.getElementById("book-dinner")
    const qualities = [...document.querySelectorAll('input[name="self-qualities"]:checked')].map(function(input) {
        return {
            label: input.value,
            emoji: input.closest("label").querySelector(".emoji").textContent
        }
    })
    const tags = getBookingTags(document.getElementById("energy-range").value, qualities)
    const dates = getDinnerDates()
    const previouslySelected = dates.find(function(date) {
        return date.iso === booking.dataset.selectedDate
    })

    if (!previouslySelected) {
        delete booking.dataset.selectedDate
    }

    selection.textContent = previouslySelected ? "Выбрана дата — " + previouslySelected.label.toLocaleLowerCase("ru-RU") + ", 19:00." : ""
    bookButton.disabled = !previouslySelected
    container.replaceChildren()

    for (let index = 0; index < dates.length; index++) {
        const date = dates[index]
        const card = document.createElement("button")
        card.type = "button"
        card.className = "button dinner-card"
        card.dataset.date = date.iso
        card.setAttribute("aria-pressed", booking.dataset.selectedDate === date.iso ? "true" : "false")
        card.setAttribute("aria-label", date.label + ". Ужин-знакомство в 19:00")

        const icon = document.createElement("span")
        icon.className = "dinner-icon"
        const image = document.createElement("img")
        image.src = "assets/dinner.svg"
        image.alt = ""
        image.width = 32
        image.height = 32
        icon.append(image)

        const copy = document.createElement("span")
        copy.className = "dinner-copy"
        const title = document.createElement("strong")
        title.textContent = date.label
        const kind = document.createElement("span")
        kind.textContent = "Ужин-знакомство"
        const time = document.createElement("small")
        time.textContent = "19:00 · 4–6 человек"
        copy.append(title, kind, time)

        const arrow = document.createElement("span")
        arrow.className = "dinner-arrow"
        arrow.setAttribute("aria-hidden", "true")
        const indicator = document.createElement("img")
        indicator.className = "dinner-indicator"
        indicator.src = booking.dataset.selectedDate === date.iso ? "assets/dinner-check.svg" : "assets/dinner-arrow.svg"
        indicator.alt = ""
        indicator.width = 20
        indicator.height = 20
        arrow.append(indicator)
        card.append(icon, copy, arrow)

        card.addEventListener("click", function() {
            booking.dataset.selectedDate = date.iso
            bookButton.disabled = false

            for (const button of container.querySelectorAll(".dinner-card")) {
                const selected = button.dataset.date === date.iso
                button.setAttribute("aria-pressed", selected ? "true" : "false")
                button.querySelector(".dinner-indicator").src = selected ? "assets/dinner-check.svg" : "assets/dinner-arrow.svg"
            }

            selection.textContent = "Выбрана дата — " + date.label.toLocaleLowerCase("ru-RU") + ", 19:00."
        })

        if (index === 0) {
            const featured = document.createElement("div")
            featured.className = "recommended-dinner booking-reveal"
            featured.style.setProperty("--reveal-delay", "600ms")
            const label = document.createElement("span")
            label.className = "recommendation-label"
            label.textContent = "На основе ваших ответов"
            const description = document.createElement("p")
            description.className = "recommendation-description"
            description.textContent = "Ваш стиль общения и качества"
            const traits = document.createElement("div")
            traits.className = "recommendation-tags"

            for (const tag of tags) {
                const chip = document.createElement("span")
                chip.className = "recommendation-tag"
                chip.textContent = tag.emoji + " " + tag.label
                traits.append(chip)
            }

            featured.append(label, description, traits, card)
            container.append(featured)
        } else {
            card.classList.add("booking-reveal")
            card.style.setProperty("--reveal-delay", 600 + index * 350 + "ms")
            container.append(card)
        }
    }
}
