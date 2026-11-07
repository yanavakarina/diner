function createProfileLoading(onComplete) {
    const screen = document.getElementById("profile-loading")
    const orbit = screen.querySelector(".loading-orbit")
    const dots = screen.querySelector(".orbit-dots")
    const counter = document.getElementById("loading-percent")
    const status = document.getElementById("loading-status")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const steps = [...screen.querySelectorAll(".loading-step")].map(function(element) {
        return {
            element,
            label: element.dataset.stepLabel,
            ring: element.querySelector(".step-progress")
        }
    })
    const duration = 6800
    const completionPause = 600
    let frame = null
    let running = false
    let elapsed = 0
    let previousTime = null
    let previousPercent = -1

    function render(progress) {
        dots.style.transform = motion.matches ? "none" : "rotate(" + progress * 1080 + "deg)"
        const percent = Math.floor(progress * 100)

        if (percent === previousPercent) {
            return
        }

        previousPercent = percent
        counter.textContent = percent + "%"
        orbit.setAttribute("aria-valuenow", String(percent))

        for (let index = 0; index < steps.length; index++) {
            const step = steps[index]
            const amount = Math.max(0, Math.min(1, percent / 100 * steps.length - index))
            step.ring.style.strokeDashoffset = String(100 * (1 - amount))
            step.element.classList.toggle("is-current", percent < 100 && index === Math.floor(percent / 100 * steps.length))
            step.element.classList.toggle("is-complete", amount === 1)
            step.element.setAttribute("aria-label", step.label + " — " + Math.round(amount * 100) + "%")
        }

        const currentIndex = Math.min(steps.length - 1, Math.floor(percent / 100 * steps.length))
        const message = percent === 100 ? "Анкета готова" : steps[currentIndex].label

        if (status.textContent !== message) {
            status.textContent = message
        }
    }

    function tick(time) {
        frame = null

        if (!running || document.hidden || screen.hidden) {
            return
        }

        if (previousTime !== null) {
            elapsed += Math.min(100, time - previousTime)
        }
        previousTime = time
        const fraction = Math.min(1, elapsed / duration)
        const eased = fraction * fraction * (3 - 2 * fraction)
        render(eased)

        if (elapsed >= duration + completionPause) {
            running = false
            onComplete()
            return
        }

        frame = requestAnimationFrame(tick)
    }

    function stop() {
        running = false
        previousTime = null

        if (frame !== null) {
            cancelAnimationFrame(frame)
            frame = null
        }
    }

    function start() {
        stop()
        running = true
        elapsed = 0
        previousPercent = -1
        render(0)

        if (!document.hidden && !screen.hidden) {
            frame = requestAnimationFrame(tick)
        }
    }

    document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
            if (frame !== null) {
                cancelAnimationFrame(frame)
                frame = null
            }
            previousTime = null
        } else if (running && !screen.hidden && frame === null) {
            frame = requestAnimationFrame(tick)
        }
    })

    return { start, stop }
}
