const directChatStorageKey = "diner-direct-chats-v1"
function getDemoPerson(id) { return demoPeople.find(person => person.id === id) }
function getSharedMeetings(personId, finishedOnly = false) {
    if (!getDemoPerson(personId)) return []
    // В текущей демоверсии на всех встречах участвует одна и та же четвёрка.
    return meetingState.bookings.filter(meeting => getMeetingPhase(meeting) >= (finishedOnly ? 3 : 1))
        .sort((a, b) => b.date.localeCompare(a.date))
}
function canMessagePerson(personId) { return getSharedMeetings(personId, true).length > 0 }
function loadDirectChats() {
    try {
        const saved = JSON.parse(localStorage.getItem(directChatStorageKey))
        if (saved && saved.version === 1 && Array.isArray(saved.threads)) {
            const unique = new Map()
            for (const thread of saved.threads) {
                if (!thread || !getDemoPerson(thread.personId) || unique.has(thread.personId)) continue
                unique.set(thread.personId, {
                    personId: thread.personId,
                    updatedAt: Number.isFinite(thread.updatedAt) ? thread.updatedAt : 0,
                    messages: Array.isArray(thread.messages) ? thread.messages.filter(message => message && typeof message.text === "string")
                        .slice(-100).map(message => ({ text: message.text.slice(0, 1000) })) : []
                })
            }
            return { version: 1, threads: [...unique.values()] }
        }
    } catch { /* Демо продолжит работу даже без доступного хранилища. */ }
    return { version: 1, threads: [] }
}
const directChatState = loadDirectChats()
let activeParticipantId = null
let activeDirectPersonId = null
let participantReturn = null
let participantMessageAvailable = false
function saveDirectChats() {
    try { localStorage.setItem(directChatStorageKey, JSON.stringify(directChatState)) } catch { /* Сообщения остаются в памяти текущей вкладки. */ }
}
function getDirectThread(personId) { return directChatState.threads.find(thread => thread.personId === personId) }
function ensureDirectThread(personId) {
    let thread = getDirectThread(personId)
    if (!thread) {
        thread = { personId, updatedAt: Date.now(), messages: [] }
        directChatState.threads.push(thread)
        saveDirectChats()
    }
    return thread
}
function personAvatar(person, className = "person-avatar") {
    const image = meetingNode("img", className)
    image.src = "assets/people/" + person.id + ".svg"
    image.alt = ""
    return image
}
function renderParticipantProfile() {
    const person = getDemoPerson(activeParticipantId)
    if (!person) return
    document.getElementById("participant-name").textContent = person.name
    const avatar = document.getElementById("participant-avatar")
    avatar.src = "assets/people/" + person.id + ".svg"
    avatar.alt = "Аватар — " + person.name
    document.getElementById("participant-bio").textContent = person.bio
    document.getElementById("participant-energy").textContent = person.energy
    const hobbies = document.getElementById("participant-hobbies")
    hobbies.replaceChildren(...person.hobbies.map(hobby => meetingNode("span", "participant-hobby", hobby)))
    const shared = document.getElementById("participant-meetings")
    shared.replaceChildren()
    for (const meeting of getSharedMeetings(person.id)) {
        const button = meetingNode("button", "shared-meeting-link")
        button.type = "button"
        button.append(meetingNode("strong", "", meetingKind(meeting)), meetingNode("span", "", meetingDateText(meeting)),
            meetingNode("small", "", getMeetingPhase(meeting) === 3 ? "Вы уже встретились" : "Встреча впереди"))
        button.addEventListener("click", function() { openMeeting(meeting.id) })
        shared.append(button)
    }
    participantMessageAvailable = canMessagePerson(person.id)
    document.getElementById("participant-message").disabled = !participantMessageAvailable
    document.getElementById("participant-message-note").textContent = participantMessageAvailable ?
        "Продолжите знакомство в личном чате." : "Личная переписка откроется после вашей совместной встречи."
}
function openParticipantProfile(personId) {
    if (screenTransition || !getDemoPerson(personId) || !getSharedMeetings(personId).length) return
    const screen = document.getElementById("participant-profile")
    if (currentScreen !== screen) {
        const scroll = currentScreen.querySelector(".question-scroll")
        participantReturn = { screen: currentScreen, focus: document.activeElement, scrollTop: scroll ? scroll.scrollTop : 0, meetingId: selectedMeetingId }
    }
    activeParticipantId = personId
    renderParticipantProfile()
    const fromChat = ["chats", "chat-room", "direct-chat"].includes(currentScreen.id)
    const buttons = screen.querySelectorAll(".home-nav button")
    for (const button of buttons) button.removeAttribute("aria-current")
    buttons[fromChat ? 1 : 2].setAttribute("aria-current", "page")
    screen.querySelector(".question-scroll").scrollTop = 0
    showScreen(screen, document.getElementById("participant-name"))
}
document.getElementById("participant-back").addEventListener("click", async function() {
    if (screenTransition) return
    if (!participantReturn) { openMainTab("events"); return }
    const previous = participantReturn
    selectedMeetingId = previous.meetingId
    if (previous.screen.id === "meetings") renderMeetingsList()
    else if (previous.screen.id === "meeting-view") renderMeetingView()
    else if (previous.screen.id === "chats") renderChatsList()
    else if (previous.screen.id === "chat-room") renderMeetingChat()
    else if (previous.screen.id === "direct-chat") renderDirectConversation()
    const focus = previous.focus && previous.focus.isConnected && previous.focus.tagName === "BUTTON" ? previous.focus : previous.screen.querySelector('[tabindex="-1"]')
    await showScreen(previous.screen, focus || previous.screen.querySelector("button"))
    const scroll = previous.screen.querySelector(".question-scroll")
    if (scroll) scroll.scrollTop = previous.scrollTop
})
document.getElementById("participant-message").addEventListener("click", function() { openDirectChat(activeParticipantId) })
function appendDirectChats(container) {
    const threads = directChatState.threads.filter(thread => canMessagePerson(thread.personId)).sort((a, b) => b.updatedAt - a.updatedAt)
    if (!threads.length) return
    container.append(meetingNode("h2", "meeting-group-heading direct-chat-heading", "Личные сообщения"))
    for (const thread of threads) {
        const person = getDemoPerson(thread.personId)
        const card = meetingNode("button", "meeting-card direct-chat-card")
        card.type = "button"
        card.dataset.directPersonId = person.id
        card.setAttribute("aria-label", "Личный чат — " + person.name)
        const copy = meetingNode("span", "direct-chat-card-copy")
        const latest = thread.messages[thread.messages.length - 1]
        copy.append(meetingNode("strong", "", person.name), meetingNode("span", "", latest ? "Вы: " + latest.text : "Продолжите знакомство после встречи"))
        card.append(personAvatar(person), copy, meetingNode("span", "person-chevron", "›"))
        card.addEventListener("click", function() { openDirectChat(person.id) })
        container.append(card)
    }
}
function renderDirectConversation() {
    const person = getDemoPerson(activeDirectPersonId)
    const thread = getDirectThread(activeDirectPersonId)
    if (!person || !thread) return
    document.getElementById("direct-chat-name").textContent = person.name
    document.getElementById("direct-chat-avatar").src = "assets/people/" + person.id + ".svg"
    document.getElementById("direct-chat-person").setAttribute("aria-label", "Открыть профиль — " + person.name)
    const meeting = getSharedMeetings(person.id, true)[0]
    document.getElementById("direct-chat-context").textContent = meeting ? "Общая встреча · " + meetingDateText(meeting) : "Личная переписка"
    const container = document.getElementById("direct-chat-messages")
    container.replaceChildren()
    appendChatMessage(container, person.name + " · пример", "Привет! Было приятно познакомиться 🙂", false, person.id)
    for (const message of thread.messages) appendChatMessage(container, "Вы", message.text, true)
    container.scrollTop = container.scrollHeight
}
function openDirectChat(personId) {
    if (screenTransition || !canMessagePerson(personId)) return
    activeDirectPersonId = personId
    ensureDirectThread(personId)
    document.getElementById("direct-chat-form").reset()
    renderDirectConversation()
    showScreen(document.getElementById("direct-chat"), document.getElementById("direct-chat-title")).then(function() {
        const container = document.getElementById("direct-chat-messages")
        container.scrollTop = container.scrollHeight
    })
}
document.getElementById("direct-chat-back").addEventListener("click", function() { openMainTab("chats") })
document.getElementById("direct-chat-person").addEventListener("click", function() { openParticipantProfile(activeDirectPersonId) })
document.getElementById("direct-chat-form").addEventListener("submit", function(event) {
    event.preventDefault()
    const input = document.getElementById("direct-chat-input")
    const text = input.value.trim()
    if (screenTransition || !canMessagePerson(activeDirectPersonId) || !text) return
    const thread = ensureDirectThread(activeDirectPersonId)
    thread.messages.push({ text: text.slice(0, 1000) })
    thread.messages = thread.messages.slice(-100)
    thread.updatedAt = Date.now()
    saveDirectChats()
    input.value = ""
    const container = document.getElementById("direct-chat-messages")
    appendChatMessage(container, "Вы", text.slice(0, 1000), true)
    container.scrollTop = container.scrollHeight
    input.focus({ preventScroll: true })
})
setInterval(function() {
    if (!document.getElementById("participant-profile").hidden && activeParticipantId && participantMessageAvailable !== canMessagePerson(activeParticipantId)) renderParticipantProfile()
}, 1000)
