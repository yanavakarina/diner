function createDateWheel(container, values, selectedValue, onChange) {
    const rowHeight = 44
    let options = []
    let selectedIndex = 0

    function markSelection() {
        for (let index = 0; index < options.length; index++) {
            options[index].setAttribute("aria-selected", index === selectedIndex ? "true" : "false")
        }

        container.setAttribute("aria-activedescendant", options[selectedIndex].id)
    }

    function setOptions(nextValues, nextSelectedValue) {
        values = nextValues
        selectedIndex = Math.max(0, values.findIndex(function(item) {
            return item.value === nextSelectedValue
        }))

        options = values.map(function(item, index) {
            const option = document.createElement("div")
            option.className = "wheel-option"
            option.id = container.id + "-" + item.value
            option.dataset.index = index
            option.setAttribute("role", "option")
            option.textContent = item.label
            return option
        })

        container.replaceChildren(...options)
        markSelection()
        container.scrollTop = selectedIndex * rowHeight
    }

    function select(index, moveScroll) {
        const nextIndex = Math.max(0, Math.min(values.length - 1, index))
        const changed = nextIndex !== selectedIndex
        selectedIndex = nextIndex
        markSelection()

        if (moveScroll) {
            container.scrollTop = selectedIndex * rowHeight
        }

        if (changed) {
            onChange()
        }
    }

    container.addEventListener("scroll", function() {
        if (container.closest(".screen").hidden) {
            return
        }

        select(Math.round(container.scrollTop / rowHeight), false)
    })

    container.addEventListener("click", function(event) {
        const option = event.target.closest(".wheel-option")

        if (option) {
            select(Number(option.dataset.index), true)
        }
    })

    container.addEventListener("keydown", function(event) {
        const positions = {
            ArrowUp: selectedIndex - 1,
            ArrowDown: selectedIndex + 1,
            PageUp: selectedIndex - 5,
            PageDown: selectedIndex + 5,
            Home: 0,
            End: values.length - 1
        }

        if (Object.hasOwn(positions, event.key)) {
            event.preventDefault()
            select(positions[event.key], true)
        }
    })

    setOptions(values, selectedValue)

    return {
        getValue() { return values[selectedIndex].value },
        getCount() { return values.length },
        setOptions
    }
}

function createBirthdayPicker() {
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
    const today = new Date()
    const currentYear = today.getFullYear()
    const button = document.getElementById("birthday-continue")
    const summary = document.getElementById("date-summary")
    const error = document.getElementById("date-error")

    function dayOptions(count) {
        return Array.from({ length: count }, function(_, index) {
            return { value: index + 1, label: String(index + 1) }
        })
    }

    const dayWheel = createDateWheel(document.getElementById("birth-day"), dayOptions(31), 1, updateDate)
    const monthWheel = createDateWheel(document.getElementById("birth-month"),
        monthNames.map(function(label, index) { return { value: index + 1, label } }), 1, updateDate)
    const yearWheel = createDateWheel(document.getElementById("birth-year"),
        Array.from({ length: 121 }, function(_, index) {
            const year = currentYear - index
            return { value: year, label: String(year) }
        }), Math.min(2000, currentYear), updateDate)

    function selectedDate() {
        return new Date(yearWheel.getValue(), monthWheel.getValue() - 1, dayWheel.getValue())
    }

    function isValid() {
        return selectedDate() <= today
    }

    function updateDate() {
        const daysInMonth = new Date(yearWheel.getValue(), monthWheel.getValue(), 0).getDate()

        if (dayWheel.getCount() !== daysInMonth) {
            dayWheel.setOptions(dayOptions(daysInMonth), Math.min(dayWheel.getValue(), daysInMonth))
        }

        summary.textContent = selectedDate().toLocaleDateString("ru-RU", {
            day: "numeric", month: "long", year: "numeric"
        })
        button.disabled = !isValid()
        error.textContent = isValid() ? "" : "Выберите дату рождения, которая уже наступила."
    }

    updateDate()
    return { isValid }
}
