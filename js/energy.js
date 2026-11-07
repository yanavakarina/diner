function getEnergyPresentation(value) {
    const amount = Math.max(0, Math.min(100, Number(value)))
    const palette = [
        { start: [255, 216, 180], end: [255, 240, 107] },
        { start: [255, 133, 222], end: [218, 210, 255] },
        { start: [255, 198, 228], end: [255, 133, 38] }
    ]
    const index = amount <= 50 ? 0 : 1
    const fraction = amount <= 50 ? amount / 50 : (amount - 50) / 50

    function mix(first, second) {
        const channels = first.map(function(channel, channelIndex) {
            return Math.round(channel + (second[channelIndex] - channel) * fraction)
        })
        return "rgb(" + channels.join(", ") + ")"
    }

    let state = "ambivert"
    let label = "Амбиверт"

    if (amount <= 33) {
        state = "introvert"
        label = "Интроверт"
    } else if (amount >= 67) {
        state = "extrovert"
        label = "Экстраверт"
    }

    return {
        state,
        label,
        startColor: mix(palette[index].start, palette[index + 1].start),
        endColor: mix(palette[index].end, palette[index + 1].end)
    }
}

function idleEyePosition(milliseconds) {
    const frames = [
        { time: 0, x: 0 },
        { time: 1800, x: 0 },
        { time: 2800, x: 4 },
        { time: 4800, x: 4 },
        { time: 6800, x: -4 },
        { time: 8800, x: -4 },
        { time: 10000, x: 0 },
        { time: 12000, x: 0 }
    ]
    const phase = milliseconds % 12000

    for (let index = 1; index < frames.length; index++) {
        const next = frames[index]
        const previous = frames[index - 1]

        if (phase <= next.time) {
            const fraction = (phase - previous.time) / (next.time - previous.time)
            const easing = fraction * fraction * (3 - 2 * fraction)
            return previous.x + (next.x - previous.x) * easing
        }
    }

    return 0
}

function createEnergyControl() {
    const screen = document.getElementById("energy")
    const range = document.getElementById("energy-range")
    const face = document.getElementById("energy-face")
    const pupils = document.getElementById("energy-pupils")
    const colorStart = document.getElementById("energy-color-start")
    const colorEnd = document.getElementById("energy-color-end")
    const captions = document.querySelectorAll("[data-energy-state]")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let animationFrame = null
    let previousTime = 0
    let lastInteraction = performance.now()
    let dragging = false
    let eyePosition = 0

    function renderSelection() {
        const presentation = getEnergyPresentation(range.value)
        colorStart.setAttribute("stop-color", presentation.startColor)
        colorEnd.setAttribute("stop-color", presentation.endColor)
        face.dataset.state = presentation.state
        range.setAttribute("aria-valuetext", presentation.label)

        for (const caption of captions) {
            const current = caption.dataset.energyState === presentation.state
            caption.classList.toggle("is-current", current)
            caption.setAttribute("aria-hidden", current ? "false" : "true")
        }
    }

    function restingEyePosition() {
        return (Number(range.value) - 50) / 50 * 6
    }

    function animateEyes(time) {
        animationFrame = null

        if (screen.hidden || document.hidden || motion.matches) {
            return
        }

        const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16
        previousTime = time
        const idleTime = Math.max(0, time - lastInteraction - 1800)
        const wandering = dragging ? 0 : idleEyePosition(idleTime)
        const target = Math.max(-6, Math.min(6, restingEyePosition() + wandering))
        eyePosition += (target - eyePosition) * (1 - Math.exp(-elapsed / 220))
        pupils.setAttribute("transform", "translate(" + eyePosition.toFixed(3) + ", 2)")
        animationFrame = requestAnimationFrame(animateEyes)
    }

    function start() {
        if (screen.hidden || document.hidden) {
            return
        }

        if (motion.matches) {
            eyePosition = restingEyePosition()
            pupils.setAttribute("transform", "translate(" + eyePosition + ", 2)")
        } else if (animationFrame === null) {
            previousTime = 0
            animationFrame = requestAnimationFrame(animateEyes)
        }
    }

    function stop() {
        if (animationFrame !== null) {
            cancelAnimationFrame(animationFrame)
            animationFrame = null
        }
        dragging = false
        previousTime = 0
    }

    function followRange() {
        lastInteraction = performance.now()
        renderSelection()
        start()
    }

    function finishDragging() {
        if (dragging) {
            dragging = false
            lastInteraction = performance.now()
        }
    }

    range.addEventListener("input", followRange)
    range.addEventListener("change", followRange)
    range.addEventListener("pointerdown", function() {
        dragging = true
        lastInteraction = performance.now()
        start()
    })
    window.addEventListener("pointerup", finishDragging)
    window.addEventListener("pointercancel", finishDragging)
    document.addEventListener("visibilitychange", function() {
        stop()
        start()
    })
    motion.addEventListener("change", function() {
        stop()
        start()
    })

    renderSelection()
    return { start, stop }
}
