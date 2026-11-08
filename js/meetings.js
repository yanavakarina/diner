// Учебная демоверсия: подписка, встречи и сообщения хранятся только в браузере.
const meetingStorageKey = "diner-meetings-v1"
function loadMeetingState() {
    try {
        const saved = JSON.parse(localStorage.getItem(meetingStorageKey))
        if (saved && saved.version === 1 && Array.isArray(saved.bookings)) {
            const bookings = saved.bookings.filter(function(item) {
                return item && ["dinner", "coffee"].includes(item.type) && typeof item.id === "string" &&
                    typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
                    typeof item.label === "string" && typeof item.district === "string" &&
                    Number.isFinite(Date.parse(item.date + "T" + (item.type === "coffee" ? "15:00" : "19:00") + ":00+05:00"))
            }).map(function(item) {
                return { ...item, demoOffset: Number.isFinite(item.demoOffset) ? item.demoOffset : 0,
                    messages: Array.isArray(item.messages) ? item.messages.filter(message => message && typeof message.text === "string").slice(-100) : [] }
            })
            return { version: 1, subscribed: saved.subscribed === true, plan: saved.plan || "quarterly", bookings }
        }
    } catch { /* При недоступном хранилище демо продолжает работать в текущей вкладке. */ }
    return { version: 1, subscribed: false, plan: "quarterly", bookings: [] }
}
const meetingState = loadMeetingState()
let pendingMeeting = null
let selectedMeetingId = null
let lastMeetingPhase = null
let questionIndex = -1
const demoPeople = [
    { id: "anna", name: "Анна", interest: "Кино и прогулки", color: "#ffe0ec", initial: "А", energy: "Амбиверт", hobbies: ["Кино", "Прогулки", "Кофе"], bio: "Люблю хорошие фильмы, долгие прогулки и разговоры, в которых забываешь про время." },
    { id: "mikhail", name: "Михаил", interest: "Музыка и путешествия", color: "#e8e1ff", initial: "М", energy: "Экстраверт", hobbies: ["Музыка", "Путешествия", "Концерты"], bio: "С удовольствием выбираюсь на концерты и в новые места. Всегда рад компании для маленького приключения." },
    { id: "alina", name: "Алина", interest: "Дизайн и кофе", color: "#ffe8d2", initial: "А", energy: "Амбиверт", hobbies: ["Дизайн", "Кофе", "Выставки"], bio: "Замечаю красивые детали, люблю выставки и уютные кофейни. Буду рада обменяться любимыми местами." },
    { id: "sasha", name: "Саша", interest: "Природа и книги", color: "#d9eee1", initial: "С", energy: "Интроверт", hobbies: ["Природа", "Книги", "Походы"], bio: "Хорошая книга, лесная тропа и спокойный разговор — отличный план на выходной." }
]
const icebreakerQuestions = [
    "Какой фильм вы готовы советовать всем?", "Куда вы отправились бы на выходные?",
    "Какое маленькое событие недавно вас порадовало?", "Чему вы хотели бы научиться просто для себя?",
    "Какое место в городе вы бы показали новому знакомому?", "Как выглядел бы ваш идеальный свободный день?"
]
function saveMeetingState() {
    try { localStorage.setItem(meetingStorageKey, JSON.stringify(meetingState)) } catch { /* Данные остаются в памяти вкладки. */ }
}
function findSavedMeeting(type, date) {
    return meetingState.bookings.find(meeting => meeting.type === type && meeting.date === date)
}
function getMeetingById(id = selectedMeetingId) { return meetingState.bookings.find(meeting => meeting.id === id) }
function getMeetingTimes(meeting) {
    const start = Date.parse(meeting.date + "T" + (meeting.type === "coffee" ? "15:00" : "19:00") + ":00+05:00")
    return { start, reveal: start - 86400000, chat: start - 1800000, end: start + (meeting.type === "coffee" ? 5400000 : 7200000) }
}
function getMeetingPhase(meeting, now = Date.now()) {
    const time = now + meeting.demoOffset
    const times = getMeetingTimes(meeting)
    return time >= times.end ? 3 : time >= times.chat ? 2 : time >= times.reveal ? 1 : 0
}
function formatMeetingCountdown(milliseconds) {
    const total = Math.max(0, Math.ceil(milliseconds / 1000))
    const days = Math.floor(total / 86400)
    const hours = Math.floor(total % 86400 / 3600)
    const minutes = Math.floor(total % 3600 / 60)
    const seconds = total % 60
    return (days ? days + "д " : "") + hours + "ч " + minutes + "мин " + seconds + "с"
}
function meetingNode(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined) node.textContent = text
    return node
}
function meetingKind(meeting) { return meeting.type === "coffee" ? "Кофе-знакомство" : "Ужин-знакомство" }
function meetingDateText(meeting) { return meeting.label + " · " + (meeting.type === "coffee" ? "15:00" : "19:00") }
function configureDemoSubscription(forBooking) {
    document.getElementById("subscription-demo-buy").hidden = !forBooking
    document.getElementById("subscription-demo-note").hidden = !forBooking
    document.getElementById("subscription-skip").hidden = forBooking
}
function beginMeetingBooking() {
    if (screenTransition) return
    const existing = findSavedMeeting(district.dataset.eventType, district.dataset.eventDate)
    if (existing) { openMeeting(existing.id); return }
    if (!district.dataset.selectedDistrict || !district.dataset.eventDate) return
    pendingMeeting = {
        id: district.dataset.eventType + ":" + district.dataset.eventDate,
        type: district.dataset.eventType, date: district.dataset.eventDate, label: district.dataset.eventLabel,
        district: district.dataset.selectedDistrict, budget: dinnerPreferences.budget,
        diet: dinnerPreferences.dietEnabled ? dinnerPreferences.diet : "Без ограничений",
        demoOffset: 0, messages: []
    }
    if (meetingState.subscribed) { completeMeetingBooking(); return }
    configureDemoSubscription(true)
    subscription.querySelector(".subscription-close").dataset.backScreen = "booking-details"
    updateSubscriptionSummary()
    showScreen(subscription, subscriptionTitle)
}
function completeMeetingBooking() {
    if (!pendingMeeting || screenTransition) return
    let meeting = findSavedMeeting(pendingMeeting.type, pendingMeeting.date)
    if (!meeting) { meeting = pendingMeeting; meetingState.bookings.push(meeting) }
    selectedMeetingId = meeting.id
    pendingMeeting = null
    saveMeetingState()
    document.getElementById("booking-success-title").textContent = meeting.type === "coffee" ? "Вы идёте на кофе!" : "Вы идёте на ужин!"
    document.getElementById("success-date").textContent = meetingDateText(meeting)
    document.getElementById("success-district").textContent = meeting.district
    showScreen(document.getElementById("booking-success"), document.getElementById("booking-success-title"))
}
document.getElementById("details-confirm").addEventListener("click", beginMeetingBooking)
document.getElementById("subscription-demo-buy").addEventListener("click", function() {
    if (screenTransition || !pendingMeeting) return
    const plan = document.querySelector('input[name="subscription-plan"]:checked')
    if (!plan) return
    meetingState.subscribed = true
    meetingState.plan = plan.value
    completeMeetingBooking()
})
function openMainTab(tab) {
    if (screenTransition) return
    if (tab === "home") { openHome(); return }
    if (tab === "profile") { openProfile(); return }
    if (tab === "events") {
        renderMeetingsList()
        showScreen(document.getElementById("meetings"), document.getElementById("meetings-title"))
    } else if (tab === "chats") {
        renderChatsList()
        showScreen(document.getElementById("chats"), document.getElementById("chats-title"))
    }
}
function bindAppNavigation(nav, active) {
    const tabs = ["home", "chats", "events", "profile"]
    const labels = ["Главная", "Чаты", "События", "Профиль"]
    for (const [index, button] of [...nav.querySelectorAll("button")].entries()) {
        button.disabled = false
        button.setAttribute("aria-label", labels[index])
        button.removeAttribute("aria-current")
        if (tabs[index] === active) button.setAttribute("aria-current", "page")
        button.addEventListener("click", function() { openMainTab(tabs[index]) })
    }
}
const originalAppNavigation = document.querySelector("#home .home-nav")
for (const slot of document.querySelectorAll("[data-app-nav]")) {
    const nav = originalAppNavigation.cloneNode(true)
    bindAppNavigation(nav, slot.dataset.appNav)
    slot.replaceWith(nav)
}
bindAppNavigation(originalAppNavigation, "home")
document.getElementById("success-events").addEventListener("click", function() { openMainTab("events") })
document.getElementById("success-home").addEventListener("click", openHome)
document.getElementById("meeting-back").addEventListener("click", function() { openMainTab("events") })
document.getElementById("chat-back").addEventListener("click", function() { openMainTab("chats") })
function appendPeople(container, includeSelf = false) {
    container.replaceChildren()
    const people = includeSelf ? [...demoPeople, { id: "self", name: "Вы", interest: "До встречи за одним столом" }] : demoPeople
    for (const person of people) {
        const row = meetingNode("button", "person-row person-link")
        row.type = "button"
        row.dataset.personId = person.id
        row.setAttribute("aria-label", person.id === "self" ? "Открыть свой профиль" : "Открыть профиль — " + person.name)
        const avatar = meetingNode("img", "person-avatar")
        avatar.src = person.id === "self" ? demoProfile.photo || "assets/profile-avatar.svg" : "assets/people/" + person.id + ".svg"
        avatar.alt = ""
        if (person.id === "self") avatar.setAttribute("data-profile-avatar", "")
        const copy = meetingNode("span", "person-row-copy")
        copy.append(meetingNode("strong", "", person.name), meetingNode("span", "person-row-interest", person.interest))
        row.append(avatar, copy, meetingNode("span", "person-chevron", "›"))
        row.addEventListener("click", function() {
            if (person.id === "self") openMainTab("profile")
            else openParticipantProfile(person.id)
        })
        container.append(row)
    }
}
function renderMeetingsList() {
    listPhaseSignature = meetingPhaseSignature()
    const list = document.getElementById("meetings-list")
    list.replaceChildren()
    if (!meetingState.bookings.length) {
        const empty = meetingNode("div", "meeting-empty")
        empty.append(meetingNode("span", "empty-art", "✦"), meetingNode("h2", "", "Здесь начнётся ваша история"), meetingNode("p", "meeting-description", "Выберите ужин или кофе на главной. Записанные встречи появятся здесь."))
        const action = meetingNode("button", "button button-dark", "Выбрать встречу")
        action.type = "button"; action.addEventListener("click", openHome); empty.append(action); list.append(empty)
    }
    for (const finished of [false, true]) {
        const bookings = meetingState.bookings.filter(meeting => (getMeetingPhase(meeting) === 3) === finished).sort((a, b) => a.date.localeCompare(b.date))
        if (!bookings.length) continue
        list.append(meetingNode("h2", "meeting-group-heading", finished ? "Прошедшие" : "Предстоящие"))
        for (const meeting of bookings) {
            const phase = getMeetingPhase(meeting)
            const card = meetingNode("article", "meeting-card event-list-card")
            card.append(meetingNode("span", "meeting-status", ["Собираем компанию", "Детали раскрыты", "Чат открыт", "До новых встреч"][phase]), meetingNode("h3", "", meetingKind(meeting)), meetingNode("p", "meeting-date", meetingDateText(meeting)), meetingNode("p", "meeting-description", meeting.district))
            const button = meetingNode("button", "button button-dark", "Посмотреть встречу")
            button.type = "button"; button.addEventListener("click", function() { openMeeting(meeting.id) }); card.append(button); list.append(card)
        }
    }
    const past = meetingState.bookings.some(meeting => getMeetingPhase(meeting) === 3)
    document.getElementById("meeting-connections").hidden = !past
    if (past) appendPeople(document.getElementById("connections-list"))
}
function openMeeting(id) {
    if (screenTransition || !getMeetingById(id)) return
    selectedMeetingId = id
    renderMeetingView()
    showScreen(document.getElementById("meeting-view"), document.getElementById("meeting-title"))
}
function renderMeetingView() {
    const meeting = getMeetingById()
    if (!meeting) return
    const phase = getMeetingPhase(meeting)
    lastMeetingPhase = phase
    document.getElementById("meeting-title").textContent = meetingKind(meeting)
    document.getElementById("meeting-date").textContent = meetingDateText(meeting)
    document.getElementById("meeting-district").textContent = meeting.district
    const preferences = document.getElementById("meeting-preferences")
    preferences.hidden = meeting.type === "coffee"
    preferences.textContent = "До " + Number(meeting.budget || 1500).toLocaleString("ru-RU") + " ₽ · " + meeting.diet
    document.getElementById("meeting-status").textContent = ["Вы записаны", "Всё готово к встрече", "Пора знакомиться", "Встреча завершена"][phase]
    document.getElementById("countdown-card").hidden = phase !== 0
    document.getElementById("venue-locked").hidden = phase > 0
    document.getElementById("venue-revealed").hidden = phase === 0
    document.getElementById("company-locked").hidden = phase > 0
    document.getElementById("company-revealed").hidden = phase === 0
    document.getElementById("venue-name").textContent = meeting.type === "coffee" ? "Кофейня «Кофе рядом»" : "Ресторан «За столом»"
    document.getElementById("venue-address").textContent = "Челябинск, " + meeting.district + ". Условный адрес для макета — ул. Встреч, 12."
    document.getElementById("venue-table").textContent = "Столик № 5 · компания diner"
    document.getElementById("venue-map").href = "https://yandex.ru/maps/?text=" + encodeURIComponent("Челябинск " + meeting.district)
    if (phase > 0) appendPeople(document.getElementById("meeting-people"), true)
    document.getElementById("meeting-open-chat").disabled = phase < 2
    document.getElementById("meeting-chat-heading").textContent = phase === 3 ? "Оставайтесь на связи" : phase >= 2 ? "Ваша компания уже в чате" : "Скоро познакомимся"
    document.getElementById("meeting-chat-note").textContent = phase === 3 ? "Участники появились в ваших знакомствах. Групповой чат остаётся с вами." : phase >= 2 ? "Поздоровайтесь с компанией. Внутри есть вопросы, которые помогут начать разговор." : "Групповой чат откроется за 30 минут до встречи."
    const advance = document.getElementById("meeting-advance")
    advance.hidden = phase === 3
    advance.textContent = ["Демо · перейти ко времени раскрытия", "Демо · до встречи 30 минут", "Демо · завершить встречу", ""][phase]
    document.querySelector(".meeting-demo-controls").hidden = phase === 3
    updateMeetingCountdown()
}
function updateMeetingCountdown() {
    const meeting = getMeetingById()
    if (!meeting) return
    const remaining = getMeetingTimes(meeting).reveal - (Date.now() + meeting.demoOffset)
    document.getElementById("meeting-countdown").textContent = formatMeetingCountdown(remaining)
}
document.getElementById("meeting-advance").addEventListener("click", function() {
    if (screenTransition) return
    const meeting = getMeetingById()
    if (!meeting) return
    const phase = getMeetingPhase(meeting)
    if (phase === 3) return
    const times = getMeetingTimes(meeting)
    const target = [times.reveal, times.chat, times.end][phase]
    meeting.demoOffset = Math.max(meeting.demoOffset, target - Date.now() + 100)
    saveMeetingState()
    renderMeetingView()
})
document.getElementById("meeting-open-chat").addEventListener("click", function() { openMeetingChat(selectedMeetingId) })
function renderChatsList() {
    chatPhaseSignature = meetingPhaseSignature()
    const list = document.getElementById("chats-list")
    list.replaceChildren()
    if (!meetingState.bookings.length) {
        list.append(meetingNode("div", "meeting-empty", "Чаты появятся здесь за полчаса до вашей первой встречи."))
    }
    if (meetingState.bookings.length) list.append(meetingNode("h2", "meeting-group-heading", "Групповые чаты"))
    for (const meeting of meetingState.bookings) {
        const unlocked = getMeetingPhase(meeting) >= 2
        const card = meetingNode("article", "meeting-card")
        card.append(meetingNode("h2", "", meetingKind(meeting)), meetingNode("p", "meeting-date", meetingDateText(meeting)), meetingNode("p", "meeting-description", unlocked ? "Компания готова общаться" : "Откроется за 30 минут до встречи"))
        const button = meetingNode("button", "button button-dark", unlocked ? "Открыть чат" : "Чат пока закрыт")
        button.type = "button"; button.disabled = !unlocked
        button.addEventListener("click", function() { openMeetingChat(meeting.id) }); card.append(button); list.append(card)
    }
    appendDirectChats(list)
}
function appendChatMessage(container, author, text, own = false, personId = null) {
    const message = meetingNode("article", "chat-message" + (own ? " own-message" : ""))
    const name = meetingNode(personId ? "button" : "strong", personId ? "chat-author" : "", author)
    if (personId) {
        name.type = "button"
        name.setAttribute("aria-label", "Открыть профиль — " + author)
        name.addEventListener("click", function() { openParticipantProfile(personId) })
    }
    message.append(name, meetingNode("p", "", text))
    container.append(message)
}
function renderMeetingChat() {
    const meeting = getMeetingById()
    if (!meeting) return
    const container = document.getElementById("chat-messages")
    container.replaceChildren()
    document.getElementById("chat-title").textContent = meeting.type === "coffee" ? "Компания на кофе" : "Компания на ужин"
    appendChatMessage(container, "Анна · пример", "Всем привет! Рада знакомству. Кто ещё любит обсуждать кино?", false, "anna")
    appendChatMessage(container, "Михаил · пример", "Привет! До встречи — будет здорово познакомиться лично.", false, "mikhail")
    for (const message of meeting.messages) appendChatMessage(container, "Вы", message.text, true)
    container.scrollTop = container.scrollHeight
}
function openMeetingChat(id) {
    const meeting = getMeetingById(id)
    if (screenTransition || !meeting || getMeetingPhase(meeting) < 2) return
    selectedMeetingId = id
    questionIndex = -1
    document.getElementById("question-text").textContent = "Не знаете, с чего начать? Откройте первый вопрос."
    document.getElementById("chat-form").reset()
    renderMeetingChat()
    showScreen(document.getElementById("chat-room"), document.getElementById("chat-title")).then(function() {
        const container = document.getElementById("chat-messages")
        container.scrollTop = container.scrollHeight
    })
}
document.getElementById("question-next").addEventListener("click", function() {
    questionIndex = (questionIndex + 1) % icebreakerQuestions.length
    document.getElementById("question-text").textContent = icebreakerQuestions[questionIndex]
})
document.getElementById("chat-form").addEventListener("submit", function(event) {
    event.preventDefault()
    const meeting = getMeetingById()
    const input = document.getElementById("chat-input")
    const text = input.value.trim()
    if (screenTransition || !meeting || getMeetingPhase(meeting) < 2 || !text) return
    meeting.messages.push({ text: text.slice(0, 1000) })
    meeting.messages = meeting.messages.slice(-100)
    saveMeetingState()
    input.value = ""
    const container = document.getElementById("chat-messages")
    appendChatMessage(container, "Вы", text.slice(0, 1000), true)
    container.scrollTop = container.scrollHeight
    input.focus({ preventScroll: true })
})
setInterval(function() {
    if (!document.getElementById("meeting-view").hidden) {
        const meeting = getMeetingById()
        if (meeting && lastMeetingPhase !== getMeetingPhase(meeting)) renderMeetingView()
        else updateMeetingCountdown()
    }
    if (!document.getElementById("meetings").hidden) renderMeetingsListIfPhaseChanged()
    if (!document.getElementById("chats").hidden) renderChatsIfPhaseChanged()
}, 1000)
let listPhaseSignature = ""
let chatPhaseSignature = ""
function meetingPhaseSignature() { return meetingState.bookings.map(meeting => meeting.id + getMeetingPhase(meeting)).join("|") }
function renderMeetingsListIfPhaseChanged() {
    const signature = meetingPhaseSignature()
    if (signature !== listPhaseSignature) { listPhaseSignature = signature; renderMeetingsList() }
}
function renderChatsIfPhaseChanged() {
    const signature = meetingPhaseSignature()
    if (signature !== chatPhaseSignature) { chatPhaseSignature = signature; renderChatsList() }
}
if (meetingState.bookings.length || meetingState.subscribed) openHome()
