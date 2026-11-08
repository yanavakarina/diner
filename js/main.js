const screens = document.querySelectorAll(".screen")
const welcome = document.getElementById("welcome")
const goals = document.getElementById("goals")
const gender = document.getElementById("gender")
const occupation = document.getElementById("occupation")
const relationship = document.getElementById("relationship")
const account = document.getElementById("account")
const start = document.getElementById("start")
const back = document.getElementById("back")
const form = document.getElementById("goals-form")
const choices = document.querySelectorAll('input[name="goal"]')
const continueButton = document.getElementById("continue")
const notice = document.getElementById("notice")
const title = document.getElementById("goals-title")
const genderTitle = document.getElementById("gender-title")
const occupationTitle = document.getElementById("occupation-title")
const relationshipTitle = document.getElementById("relationship-title")
const accountTitle = document.getElementById("account-title")
const genderForm = document.getElementById("gender-form")
const occupationForm = document.getElementById("occupation-form")
const relationshipForm = document.getElementById("relationship-form")
const accountForm = document.getElementById("account-form")
const email = document.getElementById("email")
const accountContinue = document.getElementById("account-continue")
const birthday = document.getElementById("birthday")
const birthdayTitle = document.getElementById("birthday-title")
const birthdayForm = document.getElementById("birthday-form")
const nameScreen = document.getElementById("name")
const nameTitle = document.getElementById("name-title")
const nameForm = document.getElementById("name-form")
const firstName = document.getElementById("first-name")
const nameContinue = document.getElementById("name-continue")
const phone = document.getElementById("phone")
const phoneTitle = document.getElementById("phone-title")
const phoneForm = document.getElementById("phone-form")
const phoneNumber = document.getElementById("phone-number")
const phoneContinue = document.getElementById("phone-continue")
const personalize = document.getElementById("personalize")
const personalizeTitle = document.getElementById("personalize-title")
const energy = document.getElementById("energy")
const energyTitle = document.getElementById("energy-title")
const profileLoadingScreen = document.getElementById("profile-loading")
const profileReadyScreen = document.getElementById("profile-ready")
const readyTitle = document.getElementById("ready-title")
let profileLoading
let energyControl
let birthdayPicker


const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
let currentScreen = welcome
let screenTransition = false

async function showScreen(screen, focusTarget, overlay = null) {
    if (screenTransition || screen === currentScreen) {
        return
    }

    const previous = currentScreen
    const previousProgress = previous.querySelector(".progress span")
    const previousWidth = previousProgress ? previousProgress.getBoundingClientRect().width : 0

    screen.hidden = false
    window.scrollTo(0, 0)

    if (reducedMotion.matches || typeof screen.animate !== "function") {
        previous.hidden = true
        if (overlay) overlay.close()
        currentScreen = screen
        focusTarget.focus({ preventScroll: true })
        return
    }

    screenTransition = true
    previous.inert = true
    screen.inert = true
    const animations = []
    const timing = { duration: 800, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }

    try {
        if (overlay) {
            // Скрываем главную сразу, пока окно ещё открыто поверх нового экрана.
            previous.hidden = true
            overlay.classList.add("is-navigating")
            animations.push(overlay.animate([
                { opacity: 1, offset: 0 },
                { opacity: 1, offset: 0.15 },
                { opacity: 0, offset: 1 }
            ], timing))
        } else {
            animations.push(previous.animate([
                { opacity: 1, offset: 0 },
                { opacity: 0, offset: 0.4 },
                { opacity: 0, offset: 1 }
            ], timing))
        }
        animations.push(screen.animate([
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.25 },
            { opacity: 1, offset: 1 }
        ], timing))

        const progress = screen.querySelector(".progress span")

        if (progress) {
            const width = progress.getBoundingClientRect().width

            if (width > 0) {
                animations.push(progress.animate([
                    { transform: "scaleX(" + previousWidth / width + ")" },
                    { transform: "scaleX(1)" }
                ], timing))
            }
        }

        await Promise.all(animations.map(function(animation) {
            return animation.finished
        }))
    } catch {
        // При отмене анимации всё равно завершаем переход на выбранный экран.
    } finally {
        if (overlay) {
            overlay.close()
            overlay.classList.remove("is-navigating")
        }
        for (const animation of animations) {
            animation.cancel()
        }

        previous.hidden = true
        previous.inert = false
        screen.inert = false
        currentScreen = screen
        screenTransition = false
        focusTarget.focus({ preventScroll: true })
    }
}

start.addEventListener("click", function() {
    showScreen(goals, title)
})

back.addEventListener("click", function() {
    showScreen(welcome, start)
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

    if (!form.querySelector("input:checked")) {
        return
    }

    showScreen(gender, genderTitle)
})

for (const singleForm of document.querySelectorAll(".single-choice-form")) {
    const button = singleForm.querySelector('button[type="submit"]')

    singleForm.addEventListener("change", function() {
        button.disabled = !singleForm.querySelector("input:checked")
    })
}

genderForm.addEventListener("submit", function(event) {
    event.preventDefault()

    if (!genderForm.querySelector("input:checked")) {
        return
    }

    showScreen(occupation, occupationTitle)
})

document.getElementById("gender-back").addEventListener("click", function() {
    showScreen(goals, title)
})

document.getElementById("occupation-back").addEventListener("click", function() {
    showScreen(gender, genderTitle)
})

occupationForm.addEventListener("submit", function(event) {
    event.preventDefault()

    if (!occupationForm.querySelector("input:checked")) {
        return
    }

    showScreen(relationship, relationshipTitle)
})

document.getElementById("relationship-back").addEventListener("click", function() {
    showScreen(occupation, occupationTitle)
})

relationshipForm.addEventListener("submit", function(event) {
    event.preventDefault()

    if (!relationshipForm.querySelector("input:checked")) {
        return
    }

    showScreen(account, accountTitle)
})

document.getElementById("account-back").addEventListener("click", function() {
    showScreen(relationship, relationshipTitle)
})

function updateEmailButton() {
    accountContinue.disabled = !email.validity.valid
}

email.addEventListener("input", updateEmailButton)
email.addEventListener("change", updateEmailButton)
window.addEventListener("pageshow", updateEmailButton)

accountForm.addEventListener("submit", function(event) {
    event.preventDefault()

    if (!email.reportValidity()) {
        return
    }

    showScreen(birthday, birthdayTitle)

    if (!birthdayPicker) {
        birthdayPicker = createBirthdayPicker()
    }
})

document.getElementById("birthday-back").addEventListener("click", function() {
    showScreen(account, accountTitle)
})

birthdayForm.addEventListener("submit", function(event) {
    event.preventDefault()

    if (!birthdayPicker || !birthdayPicker.isValid()) {
        return
    }

    showScreen(nameScreen, nameTitle)
})

document.getElementById("name-back").addEventListener("click", function() {
    showScreen(birthday, birthdayTitle)
})

function updateNameButton() {
    nameContinue.disabled = firstName.value.trim() === ""
}

firstName.addEventListener("input", updateNameButton)
firstName.addEventListener("change", updateNameButton)
window.addEventListener("pageshow", updateNameButton)

nameForm.addEventListener("submit", function(event) {
    event.preventDefault()

    if (firstName.value.trim() === "") {
        firstName.focus()
        return
    }

    firstName.blur()
    showScreen(phone, phoneTitle)
})

document.getElementById("phone-back").addEventListener("click", function() {
    showScreen(nameScreen, nameTitle)
})

function normalizePhone(value) {
    let digits = value.replace(/[^0-9]/g, "")

    if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
        digits = digits.slice(1)
    }

    return digits
}

function updatePhoneButton() {
    const digits = normalizePhone(phoneNumber.value)

    if (phoneNumber.value !== digits) {
        phoneNumber.value = digits
    }

    phoneContinue.disabled = !phoneNumber.validity.valid
}

phoneNumber.addEventListener("input", updatePhoneButton)
phoneNumber.addEventListener("change", updatePhoneButton)
window.addEventListener("pageshow", updatePhoneButton)

phoneForm.addEventListener("submit", function(event) {
    event.preventDefault()
    updatePhoneButton()

    if (!phoneNumber.reportValidity()) {
        return
    }

    phoneNumber.blur()
    showScreen(personalize, personalizeTitle)
})

document.getElementById("personalize-back").addEventListener("click", function() {
    showScreen(phone, phoneTitle)
})

document.getElementById("personalize-start").addEventListener("click", function() {
    showScreen(energy, energyTitle)

    if (!energyControl) {
        energyControl = createEnergyControl()
    }

    energyControl.start()
})

document.getElementById("energy-back").addEventListener("click", function() {
    if (screenTransition) {
        return
    }

    energyControl.stop()
    showScreen(personalize, personalizeTitle)
})

document.getElementById("energy-form").addEventListener("submit", function(event) {
    event.preventDefault()

    if (screenTransition) {
        return
    }

    energyControl.stop()
    showScreen(document.getElementById("hobbies"), document.getElementById("hobbies-title"))
})

function bounceSticker(sticker) {
    if (typeof sticker.animate !== "function") {
        return
    }

    for (const animation of sticker.getAnimations()) {
        animation.cancel()
    }

    if (reducedMotion.matches) {
        sticker.animate([{ opacity: 1 }, { opacity: 0.65 }, { opacity: 1 }], {
            duration: 300
        })
        return
    }

    sticker.animate([
        { transform: "translateY(0) rotate(0deg)", offset: 0, easing: "ease-out" },
        { transform: "translateY(-12px) rotate(-3deg)", offset: 0.4, easing: "ease-in" },
        { transform: "translateY(1.5px) rotate(1deg)", offset: 0.75, easing: "ease-out" },
        { transform: "translateY(0) rotate(0deg)", offset: 1 }
    ], { duration: 650 })
}

for (const sticker of document.querySelectorAll(".sticker-button")) {
    sticker.addEventListener("click", function() {
        bounceSticker(sticker)
    })

    sticker.addEventListener("keydown", function(event) {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
            event.preventDefault()
            bounceSticker(sticker)
        }
    })
}

for (const multiForm of document.querySelectorAll(".multi-choice-form")) {
    const inputs = multiForm.querySelectorAll('input[type="checkbox"]')
    const button = multiForm.querySelector('button[type="submit"]')
    const message = multiForm.querySelector(".notice")
    const limit = Number(multiForm.dataset.maxChoices)

    multiForm.addEventListener("change", function(event) {
        const selected = [...inputs].filter(function(input) {
            return input.checked
        })

        if (selected.length > limit) {
            event.target.checked = false
            message.textContent = "Можно выбрать не больше " + limit + " вариантов. Снимите один, чтобы выбрать другой."
            return
        }

        message.textContent = ""
        button.disabled = selected.length === 0
    })

    multiForm.addEventListener("submit", function(event) {
        event.preventDefault()
        const selected = [...inputs].filter(function(input) {
            return input.checked
        })

        if (selected.length === 0 || selected.length > limit) {
            return
        }

        if (screenTransition) {
            return
        }

        if (multiForm.dataset.nextScreen) {
            const next = document.getElementById(multiForm.dataset.nextScreen)

            if (next === profileLoadingScreen && !profileLoading) {
                profileLoading = createProfileLoading(finishProfileLoading)
            }

            showScreen(next, next.querySelector('[tabindex="-1"]'))

            if (next === profileLoadingScreen && !next.hidden) {
                profileLoading.start()
            }
        }
    })
}

for (const backButton of document.querySelectorAll("[data-back-screen]")) {
    backButton.addEventListener("click", function() {
        if (screenTransition) {
            return
        }

        const previous = document.getElementById(backButton.dataset.backScreen)
        showScreen(previous, previous.querySelector('[tabindex="-1"]'))

        if (previous === energy) {
            energyControl.start()
        }
    })
}

function finishProfileLoading() {
    const name = firstName.value.trim()
    readyTitle.textContent = name ? name + ", теперь мы знаем вас чуть лучше" : "Теперь мы знаем вас чуть лучше"
    const hobby = document.querySelector('input[name="hobbies"]:checked')
    const interest = document.getElementById("ready-interest")

    if (hobby) {
        const emoji = hobby.closest("label").querySelector(".emoji").textContent
        interest.textContent = "У вас уже есть тема для будущего ужина — " + hobby.value.toLocaleLowerCase("ru-RU") + " " + emoji
    } else {
        interest.textContent = "У вас уже есть темы для знакомства."
    }

    showScreen(profileReadyScreen, readyTitle)
}

document.getElementById("loading-back").addEventListener("click", function() {
    if (screenTransition) {
        return
    }

    if (profileLoading) {
        profileLoading.stop()
    }

    showScreen(document.getElementById("self-qualities"), document.getElementById("self-qualities-title"))
})

const notifications = document.getElementById("notifications")
const notificationsTitle = document.getElementById("notifications-title")
const booking = document.getElementById("booking")
const bookingTitle = document.getElementById("booking-title")

document.getElementById("ready-continue").addEventListener("click", function() {
    showScreen(notifications, notificationsTitle)
})

for (const choice of document.querySelectorAll(".notification-choice")) {
    choice.addEventListener("click", function() {
        if (screenTransition) {
            return
        }

        notifications.dataset.preference = choice.dataset.notificationChoice
        document.getElementById("booking-notification-note").textContent =
            choice.dataset.notificationChoice === "enabled" ?
                "В демоверсии выбраны уведомления об ужинах." :
                "Вы сможете вернуться к настройке напоминаний."
        renderDinnerSuggestions()
        showScreen(booking, bookingTitle)
    })
}

const subscription = document.getElementById("subscription")
const subscriptionTitle = document.getElementById("subscription-title")

function updateSubscriptionSummary() {
    const plan = document.querySelector('input[name="subscription-plan"]:checked')
    const summary = document.getElementById("subscription-summary")
    summary.textContent = plan ?
        Number(plan.dataset.price).toLocaleString("ru-RU") + " ₽ " + plan.dataset.period + " · демотариф" :
        "Выберите демонстрационный тариф"
}

document.getElementById("subscription-plans").addEventListener("change", updateSubscriptionSummary)

document.getElementById("book-dinner").addEventListener("click", function() {
    if (screenTransition || this.disabled) {
        return
    }

    const validDate = getDinnerDates().some(function(date) {
        return date.iso === booking.dataset.selectedDate
    })

    if (!validDate) {
        renderDinnerSuggestions()
        return
    }

    subscription.querySelector(".subscription-close").dataset.backScreen = "booking"
    updateSubscriptionSummary()
    showScreen(subscription, subscriptionTitle)
})


const home = document.getElementById("home")
const homeTitle = document.getElementById("home-title")

function openHome() {
    if (screenTransition) return
    renderHomeEvents()
    showScreen(home, homeTitle)
}

document.getElementById("skip-booking").addEventListener("click", openHome)
document.getElementById("subscription-skip").addEventListener("click", openHome)
document.getElementById("open-inbox").addEventListener("click", function() {
    showScreen(document.getElementById("notification-inbox"), document.getElementById("inbox-title"))
})

const district = document.getElementById("district")
const districtForm = document.getElementById("district-form")

const eventDialogControl = createEventDialog(function(event, dialog) {
    if (screenTransition) return
    district.dataset.eventDate = event.iso
    district.dataset.eventType = event.type
    district.dataset.eventLabel = event.label
    district.dataset.eventTime = event.time
    document.getElementById("district-event-kind").textContent = event.type === "coffee" ? "Кофе" : "Ужин"
    return showScreen(district, document.getElementById("district-title"), dialog)
})


function saveDistrictChoice() {
    const selected = districtForm.querySelector('input[name="district"]:checked')
    if (selected) district.dataset.selectedDistrict = selected.value
}

districtForm.addEventListener("change", saveDistrictChoice)
districtForm.addEventListener("submit", function(event) {
    event.preventDefault()
    if (screenTransition || !districtForm.checkValidity()) return
    saveDistrictChoice()
    renderBookingDetails()
    showScreen(document.getElementById("booking-details"), document.getElementById("details-title"))
})


function renderBookingDetails() {
    const coffee = district.dataset.eventType === "coffee"
    const name = coffee ? "Кофе" : "Ужин"
    document.getElementById("details-header").textContent = name
    document.getElementById("details-title").textContent = name
    document.getElementById("details-date").textContent = district.dataset.eventLabel + " · " + district.dataset.eventTime
    document.getElementById("details-district").textContent = district.dataset.selectedDistrict
    document.getElementById("details-budget").textContent = "До " + Number(dinnerPreferences.budget).toLocaleString("ru-RU") + " ₽"
    document.getElementById("details-diet").textContent = dinnerPreferences.dietEnabled ? dinnerPreferences.diet : "Без ограничений"
    document.getElementById("details-icon-image").src = coffee ? "assets/coffee.svg" : "assets/dinner.svg"
    document.getElementById("details-icon").classList.toggle("coffee-icon", coffee)
    for (const row of document.querySelectorAll("[data-dinner-detail]")) row.hidden = coffee
    const details = document.getElementById("booking-details")
    details.dataset.eventType = district.dataset.eventType
    details.dataset.eventDate = district.dataset.eventDate
    details.dataset.selectedDistrict = district.dataset.selectedDistrict
}


const dinnerPreferences = { budget: "1500", dietEnabled: false, diet: "" }
const preferencesScreen = document.getElementById("booking-preferences")
const preferencesForm = document.getElementById("preferences-form")
const dietEnabled = document.getElementById("diet-enabled")
const dietOptions = document.getElementById("diet-options")
const dietFieldset = document.getElementById("diet-fieldset")
let dietRevealAnimation
let dietRevealVersion = 0

function updatePreferencesValidity() {
    document.getElementById("preferences-save").disabled = !preferencesForm.checkValidity()
}

async function updateDietVisibility(animate = true) {
    const version = ++dietRevealVersion
    const height = dietOptions.getBoundingClientRect().height
    if (dietRevealAnimation) dietRevealAnimation.cancel()
    const expanded = dietEnabled.checked && district.dataset.eventType !== "coffee"
    dietEnabled.setAttribute("aria-expanded", String(expanded))
    dietFieldset.disabled = !expanded
    updatePreferencesValidity()
    if (!animate || reducedMotion.matches || typeof dietOptions.animate !== "function") {
        dietOptions.hidden = !expanded
        return
    }
    if (dietOptions.hidden && !expanded) return
    dietOptions.hidden = false
    dietRevealAnimation = dietOptions.animate([
        { height: height + "px", opacity: expanded ? 0 : 1 },
        { height: (expanded ? dietOptions.scrollHeight : 0) + "px", opacity: expanded ? 1 : 0 }
    ], { duration: 500, easing: "cubic-bezier(.4,0,.2,1)", fill: "both" })
    try { await dietRevealAnimation.finished } catch { /* Новое переключение заменяет анимацию. */ }
    if (version === dietRevealVersion) {
        dietOptions.hidden = !expanded
        dietRevealAnimation.cancel()
        dietRevealAnimation = null
    }
}

function openBookingPreferences() {
    if (screenTransition) return
    const coffee = district.dataset.eventType === "coffee"
    document.getElementById("preferences-header").textContent = coffee ? "Кофе" : "Ужин"
    document.getElementById("preferences-title").textContent = coffee ? "Изменить район" : "Изменить предпочтения"
    for (const input of preferencesForm.querySelectorAll('input[name="edit-district"]')) {
        input.checked = input.value === district.dataset.selectedDistrict
    }
    for (const input of preferencesForm.querySelectorAll('input[name="edit-budget"]')) {
        input.checked = input.value === dinnerPreferences.budget
    }
    for (const input of preferencesForm.querySelectorAll('input[name="edit-diet"]')) {
        input.checked = input.value === dinnerPreferences.diet
    }
    const budgetGroup = document.getElementById("budget-preferences")
    budgetGroup.hidden = coffee
    budgetGroup.disabled = coffee
    document.getElementById("food-preferences").hidden = coffee
    dietEnabled.disabled = coffee
    dietEnabled.checked = dinnerPreferences.dietEnabled
    updateDietVisibility(false)
    preferencesScreen.querySelector(".question-scroll").scrollTop = 0
    showScreen(preferencesScreen, document.getElementById("preferences-title"))
}

document.getElementById("edit-preferences").addEventListener("click", openBookingPreferences)
dietEnabled.addEventListener("change", function() { updateDietVisibility() })
preferencesForm.addEventListener("change", updatePreferencesValidity)
preferencesForm.addEventListener("submit", function(event) {
    event.preventDefault()
    if (screenTransition || !preferencesForm.reportValidity()) return
    const selectedDistrict = preferencesForm.querySelector('input[name="edit-district"]:checked').value
    district.dataset.selectedDistrict = selectedDistrict
    for (const input of districtForm.querySelectorAll('input[name="district"]')) {
        input.checked = input.value === selectedDistrict
    }
    if (district.dataset.eventType !== "coffee") {
        dinnerPreferences.budget = preferencesForm.querySelector('input[name="edit-budget"]:checked').value
        dinnerPreferences.dietEnabled = dietEnabled.checked
        const selectedDiet = preferencesForm.querySelector('input[name="edit-diet"]:checked')
        dinnerPreferences.diet = selectedDiet ? selectedDiet.value : ""
    }
    renderBookingDetails()
    showScreen(document.getElementById("booking-details"), document.getElementById("details-title"))
})
