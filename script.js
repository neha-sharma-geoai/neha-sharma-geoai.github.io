const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const currentYear = document.querySelector("#current-year");
const paletteSelect = document.querySelector("#theme-select");
const themeColor = document.querySelector('meta[name="theme-color"]');

if (paletteSelect) {
  const palettes = new Map([
    ["earth", "#f8faef"],
    ["ocean", "#effbfc"],
    ["canopy", "#fff9eb"],
    ["lavender", "#f8f5ff"],
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
