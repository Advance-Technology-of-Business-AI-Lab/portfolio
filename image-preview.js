"use strict";

const viewer = document.querySelector(".image-viewer");
const viewerImage = viewer.querySelector("img");
const viewerTitle = viewer.querySelector("h2");
const closeButton = viewer.querySelector("button");
let activePreview = null;
let startedOnBackdrop = false;

if (typeof viewer.showModal === "function") {
    for (const preview of document.querySelectorAll("[data-image-preview]")) {
        preview.setAttribute("aria-haspopup", "dialog");
        preview.addEventListener("click", (event) => {
            if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

            event.preventDefault();
            const image = preview.querySelector("img");
            viewerTitle.textContent = preview.closest("figure").querySelector("figcaption strong").textContent;
            viewerImage.alt = image.alt;
            viewerImage.src = preview.href;
            activePreview = preview;
            viewer.showModal();
            viewer.querySelector(".image-viewer-stage").scrollTop = 0;
        });
    }

    closeButton.addEventListener("click", () => viewer.close());
    viewer.addEventListener("pointerdown", (event) => {
        startedOnBackdrop = event.target === viewer;
    });
    viewer.addEventListener("click", (event) => {
        if (event.target === viewer && startedOnBackdrop) viewer.close();
        startedOnBackdrop = false;
    });
    viewer.addEventListener("close", () => {
        if (viewer.open) return;
        viewerImage.removeAttribute("src");
        activePreview?.focus({ preventScroll: true });
        activePreview = null;
        startedOnBackdrop = false;
    });
}
