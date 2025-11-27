const closedNotebook = document.getElementById("closed-notebook");
const landing = document.querySelector(".landing");
const layout = document.querySelector(".journal-layout");
const pencilcase = document.querySelector(".pencilcase");
const pencilcaseArea = document.querySelector(".pencilcase-area");
const pencilcaseMenu = document.querySelector(".pencilcase-menu");
const uploadScrapsInput = document.getElementById("upload-scraps-input");
const scrapCanvas = document.getElementById("scrap-canvas");

let opened = false;
let scrapZIndex = 10;
const SCRAP_MIN_SIZE = 90;

closedNotebook.addEventListener("click", () => {
  if (opened) return;
  opened = true;

  // First shake
  closedNotebook.classList.add("shake");
});

// After shake completes
closedNotebook.addEventListener("animationend", () => {
  // Only run on shake animation
  if (!closedNotebook.classList.contains("shake")) return;

  // Stop shake
  closedNotebook.classList.remove("shake");

  // Fade out screen
  landing.classList.add("fade-out");

  // After fade finishes, switch screens
  setTimeout(() => {
    landing.style.display = "none";
    layout.classList.remove("hidden");
    layout.style.display = "flex"; // force show open layout
  }, 600); // match fade time
});

pencilcase?.addEventListener("click", () => {
  if (layout.classList.contains("hidden")) return;
  pencilcaseArea.classList.toggle("open");
  pencilcaseMenu.classList.toggle("hidden");
});

uploadScrapsInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const img = document.createElement("img");
    img.src = loadEvent.target?.result;
    img.alt = file.name || "Uploaded scrap";
    img.className = "scrap-image";
    addScrapToCanvas(img);
  };

  reader.readAsDataURL(file);
  event.target.value = "";
});

function addScrapToCanvas(contentElement) {
  if (!scrapCanvas) return;

  const scrap = document.createElement("div");
  scrap.className = "scrap-item";

  contentElement.classList.add("scrap-content");
  if ("draggable" in contentElement) {
    contentElement.draggable = false;
  }
  scrap.appendChild(contentElement);

  const handle = document.createElement("button");
  handle.type = "button";
  handle.className = "scrap-handle";
  handle.setAttribute("aria-label", "Resize scrap");
  handle.textContent = "+";
  scrap.appendChild(handle);

  scrapCanvas.appendChild(scrap);
  bringScrapToFront(scrap);

  const finishSetup = () => {
    if (contentElement.tagName === "IMG") {
      const img = contentElement;
      if (img.naturalWidth && img.naturalHeight) {
        scrap.dataset.aspectRatio = (
          img.naturalWidth / img.naturalHeight
        ).toString();
      }
    }
    lockScrapSize(scrap);
    placeScrapInCenter(scrap);
    enableDragging(scrap);
    enableResizing(scrap, handle);
  };

  if (contentElement.tagName === "IMG" && !contentElement.complete) {
    contentElement.addEventListener("load", finishSetup, { once: true });
  } else {
    finishSetup();
  }
}

function bringScrapToFront(element) {
  element.style.zIndex = String(scrapZIndex++);
}

function placeScrapInCenter(element) {
  const { width, height } = scrapCanvas.getBoundingClientRect();
  if (!width || !height) {
    requestAnimationFrame(() => placeScrapInCenter(element));
    return;
  }
  const startLeft = width / 2 - (element.offsetWidth || 110);
  const startTop = height / 2 - (element.offsetHeight || 110);
  element.style.left = `${Math.max(0, startLeft)}px`;
  element.style.top = `${Math.max(0, startTop)}px`;
}

function enableDragging(element) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  element.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    pointerId = event.pointerId;
    element.setPointerCapture(pointerId);
    element.classList.add("dragging");
    bringScrapToFront(element);
    startX = event.clientX;
    startY = event.clientY;
    initialLeft = parseFloat(element.style.left) || 0;
    initialTop = parseFloat(element.style.top) || 0;
  });

  element.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const canvasRect = scrapCanvas.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    let nextLeft = initialLeft + deltaX;
    let nextTop = initialTop + deltaY;

    nextLeft = Math.min(
      Math.max(0, nextLeft),
      canvasRect.width - elementRect.width
    );
    nextTop = Math.min(
      Math.max(0, nextTop),
      canvasRect.height - elementRect.height
    );

    element.style.left = `${nextLeft}px`;
    element.style.top = `${nextTop}px`;
  });

  element.addEventListener("pointerup", clearDraggingState);
  element.addEventListener("pointercancel", clearDraggingState);

  function clearDraggingState(event) {
    if (pointerId !== event.pointerId) return;
    element.releasePointerCapture(pointerId);
    element.classList.remove("dragging");
    pointerId = null;
  }
}

function randomScrapGradient() {
  const palettes = [
    ["#f6d365", "#fda085"],
    ["#a1c4fd", "#c2e9fb"],
    ["#84fab0", "#8fd3f4"],
    ["#fccb90", "#d57eeb"],
  ];

  const pair = palettes[Math.floor(Math.random() * palettes.length)];
  return `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`;
}

function enableResizing(scrap, handle) {
  if (!scrapCanvas) return;

  let pointerId = null;
  let startWidth = 0;
  let startHeight = 0;
  let startX = 0;
  let startY = 0;

  handle.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    pointerId = event.pointerId;
    handle.setPointerCapture(pointerId);
    scrap.classList.add("resizing");
    bringScrapToFront(scrap);
    startWidth = scrap.offsetWidth;
    startHeight = scrap.offsetHeight;
    startX = event.clientX;
    startY = event.clientY;
  });

  handle.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    let nextWidth = Math.max(SCRAP_MIN_SIZE, startWidth + deltaX);
    let nextHeight = Math.max(SCRAP_MIN_SIZE, startHeight + deltaY);

    if (scrap.dataset.aspectRatio) {
      const ratio = Number(scrap.dataset.aspectRatio);
      nextHeight = Math.max(SCRAP_MIN_SIZE, nextWidth / ratio);
    }

    const canvasRect = scrapCanvas.getBoundingClientRect();
    const currentLeft = parseFloat(scrap.style.left) || 0;
    const currentTop = parseFloat(scrap.style.top) || 0;

    nextWidth = Math.min(nextWidth, canvasRect.width - currentLeft);
    nextHeight = Math.min(nextHeight, canvasRect.height - currentTop);

    scrap.style.width = `${nextWidth}px`;
    scrap.style.height = `${nextHeight}px`;
  });

  const cleanup = (event) => {
    if (pointerId !== event.pointerId) return;
    handle.releasePointerCapture(pointerId);
    scrap.classList.remove("resizing");
    pointerId = null;
  };

  handle.addEventListener("pointerup", cleanup);
  handle.addEventListener("pointercancel", cleanup);
}

function lockScrapSize(scrap) {
  const width = scrap.offsetWidth || 220;
  const height = scrap.offsetHeight || 160;
  scrap.style.width = `${width}px`;
  scrap.style.height = `${height}px`;
}
