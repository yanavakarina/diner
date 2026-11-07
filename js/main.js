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
let birthdayPicker


function showScreen(screen, focusTarget) {
    for (const item of screens) {
        item.hidden = item !== screen
    }

    window.scrollTo(0, 0)
    focusTarget.focus({ preventScroll: true })
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
