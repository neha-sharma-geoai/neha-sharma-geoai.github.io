const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const currentYear = document.querySelector("#current-year");
const paletteSelect = document.querySelector("#theme-select");
const themeColor = document.querySelector('meta[name="theme-color"]');

if (paletteSelect) {
  const palettes = new Map([
    ["earth", "#f7f1e5"],
    ["ocean", "#e6eef1"],
    ["canopy", "#e9eee4"],
    ["lavender", "#ece9f3"],
  ]);
  let savedPalette = null;

  try {
    savedPalette = window.localStorage.getItem("geoai-palette");
  } catch (error) {
    console.warn("Could not read the saved color palette.", error);
  }

  if (palettes.has(savedPalette)) {
    document.documentElement.dataset.theme = savedPalette;
    paletteSelect.value = savedPalette;
    if (themeColor) {
      themeColor.content = palettes.get(savedPalette);
    }
  }

  paletteSelect.addEventListener("change", () => {
    const palette = paletteSelect.value;
    if (!palettes.has(palette)) {
      return;
    }

    document.documentElement.dataset.theme = palette;
    if (themeColor) {
      themeColor.content = palettes.get(palette);
    }
    try {
      window.localStorage.setItem("geoai-palette", palette);
    } catch (error) {
      console.warn("Could not save the selected color palette.", error);
    }
  });
}

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

if (menuToggle && navigation) {
  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    navigation.classList.remove("is-open");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation menu" : "Close navigation menu",
    );
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

const journeyMapCanvases = document.querySelectorAll(".journey-map-canvas");

// The world-map mask uses a Robinson projection; interpolate its standard 5° coefficients.
const robinsonX = [
  1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216,
  0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213,
  0.5722, 0.5322,
];
const robinsonY = [
  0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571,
  0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1,
];
// Calibrate projected coordinates to the continent placement in this map mask.
const worldMapArtworkOffset = { x: -1.5, y: 13.5 };

const interpolateRobinsonCoefficient = (coefficients, latitude) => {
  const absoluteLatitude = Math.abs(latitude);
  const lowerIndex = Math.min(Math.floor(absoluteLatitude / 5), coefficients.length - 2);
  const fraction = (absoluteLatitude - lowerIndex * 5) / 5;
  return coefficients[lowerIndex] + (coefficients[lowerIndex + 1] - coefficients[lowerIndex]) * fraction;
};

const positionJourneyMarker = (marker) => {
  const { latitude, longitude } = marker.dataset;
  if (latitude === undefined && longitude === undefined) {
    return true;
  }

  const lat = Number(latitude);
  const lon = Number(longitude);
  if (
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    console.error("A journey map marker has invalid geographic coordinates.", marker);
    return false;
  }

  const xScale = interpolateRobinsonCoefficient(robinsonX, lat);
  const yScale = interpolateRobinsonCoefficient(robinsonY, lat);
  const x = 50 + (lon / 360) * xScale * 100 + worldMapArtworkOffset.x;
  const y = 50 - Math.sign(lat) * yScale * 50 + worldMapArtworkOffset.y;
  marker.style.setProperty("--point-x", `${x}%`);
  marker.style.setProperty("--point-y", `${y}%`);
  return true;
};

journeyMapCanvases.forEach((canvas) => {
  const journeyMarkers = canvas.querySelectorAll(".journey-marker");
  const journeyPopup = canvas.querySelector(".journey-popup");
  const journeyPopupTitle = journeyPopup?.querySelector(".journey-popup-title");
  const journeyPopupDetail = journeyPopup?.querySelector(".journey-popup-detail");
  const journeyPopupClose = journeyPopup?.querySelector(".journey-popup-close");

  if (
    journeyMarkers.length === 0 ||
    !(journeyPopup instanceof HTMLElement) ||
    !(journeyPopupTitle instanceof HTMLElement) ||
    !(journeyPopupDetail instanceof HTMLElement) ||
    !(journeyPopupClose instanceof HTMLButtonElement)
  ) {
    console.error("A journey map is missing its location details or popup controls.", canvas);
    return;
  }

  let activeJourneyMarker = null;

  const closeJourneyPopup = (returnFocus = false) => {
    journeyPopup.hidden = true;
    journeyMarkers.forEach((marker) => {
      marker.setAttribute("aria-expanded", "false");
    });
    const markerToFocus = activeJourneyMarker;
    activeJourneyMarker = null;
    if (returnFocus && markerToFocus instanceof HTMLButtonElement) {
      markerToFocus.focus();
    }
  };

  journeyMarkers.forEach((marker) => {
    if (!(marker instanceof HTMLButtonElement)) {
      console.error("A journey map marker must be a button.", marker);
      return;
    }

    if (!positionJourneyMarker(marker)) {
      return;
    }

    marker.addEventListener("click", () => {
      const title = marker.dataset.popupTitle;
      const detail = marker.dataset.popupDetail;
      if (!title || !detail) {
        console.error("A journey map marker is missing its location details.", marker);
        return;
      }

      if (activeJourneyMarker === marker && !journeyPopup.hidden) {
        closeJourneyPopup(true);
        return;
      }

      closeJourneyPopup();
      activeJourneyMarker = marker;
      journeyPopupTitle.textContent = title;
      journeyPopupDetail.textContent = detail;
      journeyPopup.hidden = false;
      marker.setAttribute("aria-expanded", "true");
      journeyPopupClose.focus();
    });
  });

  journeyPopupClose.addEventListener("click", () => {
    closeJourneyPopup(true);
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const clickedMarker = event.target.closest(".journey-marker");
    if (!canvas.contains(event.target) || (!journeyPopup.contains(event.target) && !clickedMarker)) {
      closeJourneyPopup();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !journeyPopup.hidden) {
      closeJourneyPopup(true);
    }
  });
});
