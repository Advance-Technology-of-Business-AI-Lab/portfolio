"use strict";

const link = document.querySelector("[data-section-link]");
const target = new URL(link.href);
const fragment = window.location.hash.slice(1);

if (link.dataset.sectionLink.split(" ").includes(fragment)) {
    target.hash = fragment;
}
if (target.protocol === "http:" || target.protocol === "https:") {
    target.pathname = target.pathname.replace(/index\.html$/, "");
}
window.location.replace(target.href);
