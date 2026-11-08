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

async function showScreen(screen, focusTarget) {
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
        animations.push(previous.animate([
            { opacity: 1, offset: 0 },
            { opacity: 0, offset: 0.4 },
            { opacity: 0, offset: 1 }
        ], timing))
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
