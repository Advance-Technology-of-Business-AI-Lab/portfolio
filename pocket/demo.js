"use strict";

const modelField = document.querySelector("#model");
const environmentField = document.querySelector("#environment");
const scenarioField = document.querySelector("#scenario");
const noRecord = document.querySelector("#no-record");
const environmentDetails = document.querySelector("#environment-details");
const runPanel = document.querySelector("#run");
const timeline = document.querySelector("#steps");
const play = document.querySelector("#play");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const sample = document.querySelector("#image-sample");
const metrics = document.querySelector("#metrics");

let run = null;
let step = 0;
let timer = null;

function setOptions(field, choices) {
    const previousValue = field.value;
    field.replaceChildren(...choices.map(choice => new Option(choice.label, choice.id)));
    if (choices.some(choice => choice.id === previousValue)) field.value = previousValue;
    field.disabled = choices.length === 0;
}

function selectedModel() {
    return replayModels.find(model => model.id === modelField.value);
}

function stop() {
    window.clearInterval(timer);
    timer = null;
}

function renderStep() {
    const [title, output, detail] = run.steps[step];
    document.querySelector("#step-count").textContent = (step + 1) + " / " + run.steps.length;
    document.querySelector("#frame-title").textContent = title;
    document.querySelector("#trace-output").textContent = output;
    document.querySelector("#frame-detail").textContent = detail;
    for (const [index, item] of Array.from(timeline.children).entries()) {
        item.firstElementChild.setAttribute("aria-current", index === step ? "step" : "false");
    }
    previous.disabled = step === 0;
    next.disabled = step === run.steps.length - 1;
    play.textContent = timer !== null ? "暂停" : next.disabled ? "重新播放" : "播放";
}

function goTo(index) {
    stop();
    step = index;
    renderStep();
}

function showRun() {
    stop();
    step = 0;
    const model = selectedModel();
    const available = model.runs[environmentField.value] || [];
    run = available.find(entry => entry.id === scenarioField.value) || null;
    runPanel.hidden = run === null;
    noRecord.hidden = run !== null;
    noRecord.textContent = model.note || "";
    environmentDetails.textContent = environments[environmentField.value] || "";
    environmentDetails.hidden = !environmentField.value;
    if (!run) return;

    timeline.replaceChildren(...run.steps.map(([title], index) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = title;
        button.addEventListener("click", () => goTo(index));
        item.append(button);
        return item;
    }));
    sample.hidden = !run.image;
    if (run.image) {
        document.querySelector("#sample-color").style.backgroundColor = run.image.hex;
        document.querySelector("#sample-name").textContent = run.image.name;
    }
    metrics.replaceChildren(...run.metrics.map(([label, value]) => {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const description = document.createElement("dd");
        term.textContent = label;
        description.textContent = value;
        row.append(term, description);
        return row;
    }));
    document.querySelector("#record-note").textContent = run.note;
    renderStep();
}

function selectEnvironment() {
    setOptions(scenarioField, selectedModel().runs[environmentField.value] || []);
    showRun();
}

function selectModel() {
    const names = { desktop: "桌面 Linux", android: "Android 15 模拟器" };
    setOptions(environmentField, Object.keys(selectedModel().runs).map(id => ({ id, label: names[id] })));
    selectEnvironment();
}

modelField.addEventListener("change", selectModel);
environmentField.addEventListener("change", selectEnvironment);
scenarioField.addEventListener("change", showRun);
previous.addEventListener("click", () => goTo(step - 1));
next.addEventListener("click", () => goTo(step + 1));
play.addEventListener("click", () => {
    if (timer !== null) {
        stop();
    } else {
        if (next.disabled) step = 0;
        timer = window.setInterval(() => {
            step += 1;
            if (step === run.steps.length - 1) stop();
            renderStep();
        }, 1250);
    }
    renderStep();
});

setOptions(modelField, replayModels);
selectModel();
document.querySelector("#replay-controls").hidden = false;
