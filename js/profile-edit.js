const profileFieldConfig = {
    name: { screen: "name", form: "name-form", title: "name-title", kind: "name" },
    phone: { screen: "phone", form: "phone-form", title: "phone-title", kind: "phone" },
    gender: { screen: "gender", form: "gender-form", title: "gender-title", kind: "single", group: "gender" },
    relationship: { screen: "relationship", form: "relationship-form", title: "relationship-title", kind: "single", group: "relationship" },
    occupation: { screen: "occupation", form: "occupation-form", title: "occupation-title", kind: "single", group: "occupation" },
    goals: { screen: "goals", form: "goals-form", title: "goals-title", kind: "multi", group: "goal", limit: 2 },
    energy: { screen: "energy", form: "energy-form", title: "energy-title", kind: "energy" },
    hobbies: { screen: "hobbies", form: "hobbies-form", title: "hobbies-title", kind: "multi", group: "hobbies", limit: 5 },
    birthday: { screen: "birthday", form: "birthday-form", title: "birthday-title", kind: "birthday" }
}
const profileEditor = document.getElementById("profile-editor")
let activeProfileEdit = null
let profileEditorWasOpened = false
function persistFullDemoProfile() {
    try { localStorage.setItem(profileStorageKey, JSON.stringify(demoProfile)); return true } catch { return false }
}
function readProfileAnswer(key) {
    const config = profileFieldConfig[key]
    if (config.kind === "name") return firstName.value.trim().slice(0, 80)
    if (config.kind === "phone") {
        const digits = normalizePhone(phoneNumber.value)
        return /^\d{10}$/.test(digits) ? digits : ""
    }
    if (config.kind === "energy") return document.getElementById("energy-range").value
    if (config.kind === "birthday") return birthdayPicker && birthdayPicker.isValid() ? birthdayPicker.getValue() : ""
    const checked = [...document.querySelectorAll('input[name="' + config.group + '"]:checked')].map(input => input.value)
    return config.kind === "single" ? checked[0] || "" : checked
}
function profileAnswerComplete(key, value) {
    const config = profileFieldConfig[key]
    if (config.kind === "multi") return Array.isArray(value) && value.length > 0 && value.length <= config.limit
    return typeof value === "string" && value !== ""
}
function saveProfileAnswer(key, value, persist = true) {
    if (key === "name") demoProfile.name = value
    else demoProfile.answers[key] = Array.isArray(value) ? [...value] : value
    if (persist) persistFullDemoProfile()
}
function hydrateProfileAnswers() {
    for (const [key, config] of Object.entries(profileFieldConfig)) {
        const value = demoProfile.answers[key]
        if (value === undefined) continue
        if (config.kind === "phone" && typeof value === "string" && /^\d{10}$/.test(value)) phoneNumber.value = value
        else if (config.kind === "energy" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100) document.getElementById("energy-range").value = value
        else if (config.group) {
            for (const input of document.querySelectorAll('input[name="' + config.group + '"]')) input.checked = Array.isArray(value) ? value.includes(input.value) : value === input.value
        }
        refreshProfileFieldControls(key)
    }
}
function refreshProfileFieldControls(key) {
    const config = profileFieldConfig[key]
    const form = document.getElementById(config.form)
    if (key === "name") updateNameButton()
    else if (key === "phone") updatePhoneButton()
    else if (key === "energy") {
        if (energyControl) document.getElementById("energy-range").dispatchEvent(new Event("input", { bubbles: true }))
    } else if (config.group) {
        form.querySelector('button[type="submit"]').disabled = !profileAnswerComplete(key, readProfileAnswer(key))
        const note = form.querySelector(".notice")
        if (note) note.textContent = ""
    }
}
function profileAnswerLabel(key) {
    const value = key === "name" ? demoProfile.name : demoProfile.answers[key]
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Не указано"
    if (!value) return "Не указано"
    if (key === "phone") return "+7 (" + value.slice(0, 3) + ") " + value.slice(3, 6) + "-" + value.slice(6, 8) + "-" + value.slice(8)
    if (key === "energy") return getEnergyPresentation(Number(value)).label
    if (key === "birthday") {
        const date = new Date(value + "T12:00:00")
        return Number.isNaN(date.getTime()) ? "Не указано" : date.toLocaleDateString("ru-RU")
    }
    return value
}
function renderProfileAvatars() {
    const source = demoProfile.photo || "assets/profile-avatar.svg"
    for (const avatar of document.querySelectorAll("[data-profile-avatar]")) {
        if (avatar.getAttribute("src") !== source) avatar.src = source
    }
    document.getElementById("remove-profile-photo").hidden = !demoProfile.photo
}
function renderProfileEditor() {
    for (const key of Object.keys(profileFieldConfig)) document.getElementById("profile-value-" + key).textContent = profileAnswerLabel(key)
    renderProfileAvatars()
}
function openProfileEditor() {
    if (screenTransition) return
    rememberDemoProfile()
    if (!profileEditorWasOpened) {
        for (const key of Object.keys(profileFieldConfig)) {
            if (key === "birthday" && demoProfile.answers.birthday) continue
            const value = readProfileAnswer(key)
            if (profileAnswerComplete(key, value)) saveProfileAnswer(key, value, false)
        }
        persistFullDemoProfile()
        profileEditorWasOpened = true
    }
    renderProfileEditor()
    document.getElementById("profile-photo-status").textContent = ""
    showScreen(profileEditor, document.getElementById("profile-editor-title"))
}
document.getElementById("open-profile-editor").addEventListener("click", openProfileEditor)
function openProfileField(key) {
    if (screenTransition || activeProfileEdit) return
    const config = profileFieldConfig[key]
    const screen = document.getElementById(config.screen)
    const form = document.getElementById(config.form)
    const submit = form.querySelector('button[type="submit"]')
    const back = screen.querySelector(".back")
    activeProfileEdit = {
        key, config, screen, form, submit, back, oldSubmit: submit.textContent, oldBackLabel: back.getAttribute("aria-label"),
        inputs: [...form.querySelectorAll("input")].map(input => ({ input, value: input.value, checked: input.checked })),
        date: birthdayPicker ? birthdayPicker.getValue() : null
    }
    submit.textContent = "Сохранить"
    back.setAttribute("aria-label", "Вернуться к профилю без сохранения")
    screen.classList.add("editing-profile-field")
    showScreen(screen, document.getElementById(config.title))
    if (key === "birthday") {
        if (!birthdayPicker) birthdayPicker = createBirthdayPicker()
        activeProfileEdit.date = demoProfile.answers.birthday || activeProfileEdit.date || birthdayPicker.getValue()
        birthdayPicker.setValue(activeProfileEdit.date)
    }
    if (key === "energy") {
        if (!energyControl) energyControl = createEnergyControl()
        document.getElementById("energy-range").dispatchEvent(new Event("input", { bubbles: true }))
        energyControl.start()
    }
    refreshProfileFieldControls(key)
}
for (const button of document.querySelectorAll("[data-edit-profile-field]")) button.addEventListener("click", function() { openProfileField(button.dataset.editProfileField) })
async function finishProfileField(save) {
    if (!activeProfileEdit || screenTransition) return
    const edit = activeProfileEdit
    if (save) {
        if (edit.key === "phone") updatePhoneButton()
        const value = readProfileAnswer(edit.key)
        if (!edit.form.reportValidity() || !profileAnswerComplete(edit.key, value)) return
        saveProfileAnswer(edit.key, value)
    } else {
        for (const snapshot of edit.inputs) { snapshot.input.value = snapshot.value; snapshot.input.checked = snapshot.checked }
        if (edit.key === "birthday" && edit.date) birthdayPicker.setValue(edit.date)
        refreshProfileFieldControls(edit.key)
    }
    if (edit.key === "energy" && energyControl) energyControl.stop()
    renderProfileEditor()
    renderProfile()
    await showScreen(profileEditor, document.getElementById("profile-editor-title"))
    edit.submit.textContent = edit.oldSubmit
    if (edit.oldBackLabel) edit.back.setAttribute("aria-label", edit.oldBackLabel)
    else edit.back.removeAttribute("aria-label")
    edit.screen.classList.remove("editing-profile-field")
    activeProfileEdit = null
}
// Перехватываем сохранение и возврат только в режиме редактирования.
// Обычный путь регистрации продолжает использовать свои обработчики.
document.addEventListener("submit", function(event) {
    if (!activeProfileEdit || event.target !== activeProfileEdit.form) return
    event.preventDefault()
    event.stopImmediatePropagation()
    finishProfileField(true)
}, true)
document.addEventListener("click", function(event) {
    if (!activeProfileEdit) return
    const back = event.target.closest("button.back")
    if (back !== activeProfileEdit.back) return
    event.preventDefault()
    event.stopImmediatePropagation()
    finishProfileField(false)
}, true)
document.addEventListener("submit", function(event) {
    if (activeProfileEdit) return
    for (const [key, config] of Object.entries(profileFieldConfig)) {
        if (event.target.id !== config.form) continue
        const value = readProfileAnswer(key)
        if (profileAnswerComplete(key, value)) saveProfileAnswer(key, value)
    }
    if (event.target === accountForm && birthdayPicker && demoProfile.answers.birthday) birthdayPicker.setValue(demoProfile.answers.birthday)
})
let photoSelection = 0
const photoFileInput = document.getElementById("profile-photo-file")
document.getElementById("choose-profile-photo").addEventListener("click", function() { photoFileInput.click() })
photoFileInput.addEventListener("change", async function() {
    const file = photoFileInput.files[0]
    if (!file) return
    const version = ++photoSelection
    const status = document.getElementById("profile-photo-status")
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.size > 20 * 1024 * 1024) {
        status.textContent = "Выберите фотографию JPG, PNG или WebP размером до 20 МБ."
        photoFileInput.value = ""
        return
    }
    status.textContent = "Сохраняем фото…"
    const url = URL.createObjectURL(file)
    try {
        const image = new Image()
        image.src = url
        await image.decode()
        if (version !== photoSelection) return
        const side = Math.min(image.naturalWidth, image.naturalHeight)
        if (!side) throw Error("empty image")
        const canvas = document.createElement("canvas")
        canvas.width = canvas.height = Math.min(512, side)
        const context = canvas.getContext("2d")
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height)
        const previous = demoProfile.photo
        demoProfile.photo = canvas.toDataURL("image/jpeg", 0.82)
        if (!persistFullDemoProfile()) { demoProfile.photo = previous; throw Error("storage full") }
        renderProfileAvatars()
        status.textContent = "Фото сохранено"
    } catch {
        if (version === photoSelection) status.textContent = "Не удалось сохранить фото. Попробуйте другую фотографию JPG, PNG или WebP."
    } finally {
        URL.revokeObjectURL(url)
        if (version === photoSelection) photoFileInput.value = ""
    }
})
document.getElementById("remove-profile-photo").addEventListener("click", function() {
    photoSelection++
    photoFileInput.value = ""
    demoProfile.photo = ""
    persistFullDemoProfile()
    renderProfileAvatars()
    document.getElementById("profile-photo-status").textContent = "Стандартный аватар восстановлен"
})
hydrateProfileAnswers()
renderProfileAvatars()
