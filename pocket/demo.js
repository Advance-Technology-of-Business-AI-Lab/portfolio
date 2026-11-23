"use strict";

const modeSwitch = document.querySelector("#mode-switch");
const controls = document.querySelector("#runtime-controls");
const play = document.querySelector("#play");
const next = document.querySelector("#next");
const count = document.querySelector("#step-count");
const output = document.querySelector("#trace-output");
const detail = document.querySelector("#trace-detail");
const modes = [...modeSwitch.querySelectorAll("button")].map((button) => {
    const flow = document.getElementById(button.dataset.mode);
    return { button, flow, steps: [...flow.querySelectorAll(".flow-node")] };
});

let activeMode = modes[0];
let stepIndex = 0;
let timer = null;

function render() {
    const { flow, steps } = activeMode;
    const step = steps[stepIndex];
    const playing = timer !== null;
    const finished = stepIndex === steps.length - 1;
    flow.classList.toggle("is-playing", playing);
    steps.forEach((button, index) => {
        button.setAttribute("aria-pressed", String(index === stepIndex));
    });
    count.textContent = `0${stepIndex + 1} / 0${steps.length}`;
    output.textContent = step.dataset.output;
    detail.textContent = step.dataset.detail;
    play.textContent = playing ? "Ⅱ Pause trace" : finished ? "↻ Replay trace" : "▶ Play trace";
    next.textContent = finished ? "First step ↺" : "Next step →";
}

function stop() {
    window.clearInterval(timer);
    timer = null;
}

function selectStep(index) {
    stop();
    stepIndex = index;
    render();
}

for (const mode of modes) {
    mode.button.addEventListener("click", () => {
        if (activeMode === mode) return;
        stop();
        activeMode.flow.classList.remove("is-playing");
        activeMode = mode;
        for (const item of modes) {
            item.button.setAttribute("aria-pressed", String(item === mode));
            item.flow.hidden = item !== mode;
        }
        selectStep(0);
    });
    mode.steps.forEach((button, index) => {
        button.disabled = false;
        button.addEventListener("click", () => selectStep(index));
    });
}

play.addEventListener("click", () => {
    if (timer !== null) {
        stop();
    } else {
        const lastIndex = activeMode.steps.length - 1;
        if (stepIndex === lastIndex) stepIndex = 0;
        timer = window.setInterval(() => {
            stepIndex += 1;
            if (stepIndex === lastIndex) stop();
            render();
        }, 1600);
    }
    render();
});

next.addEventListener("click", () => {
    selectStep((stepIndex + 1) % activeMode.steps.length);
});

modeSwitch.hidden = false;
controls.hidden = false;
render();
