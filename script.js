const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");
const currentYear = document.querySelector("#current-year");
const paletteSelect = document.querySelector("#theme-select");
const themeColor = document.querySelector('meta[name="theme-color"]');

if (paletteSelect) {
  const palettes = new Map([
    ["orbit", "#050a14"],
    ["aurora", "#060f0d"],
    ["glacier", "#f4f8fc"],
    ["terra", "#f6efe2"],
  ]);
  let savedPalette = null;

  try {
    savedPalette = window.localStorage.getItem("geoai-palette-v2");
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
      window.localStorage.setItem("geoai-palette-v2", palette);
    } catch (error) {
      console.warn("Could not save the selected color palette.", error);
    }
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealItems.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

const namasteTrigger = document.querySelector(".namaste-trigger");
const namasteMessage = document.querySelector("#namaste-message");

if (namasteTrigger instanceof HTMLButtonElement && namasteMessage instanceof HTMLElement) {
  namasteTrigger.addEventListener("click", () => {
    const isExpanded = namasteTrigger.getAttribute("aria-expanded") === "true";
    namasteTrigger.setAttribute("aria-expanded", String(!isExpanded));
    namasteMessage.hidden = isExpanded;
  });
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

const githubActivitySection = document.querySelector("#github-activity");

if (githubActivitySection) {
  const githubUsername = "neha-sharma-geoai";
  const githubApiRoot = "https://api.github.com";
  const githubDashboard = document.querySelector("#github-dashboard");
  const githubProfileStatus = document.querySelector("#github-profile-status");
  let githubDataRequested = false;

  const fetchGithubJson = async (url) => {
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
      throw new Error(`GitHub API request failed with status ${response.status}.`);
    }
    return response.json();
  };

  const loadGithubProfile = async () => {
    try {
      const profile = await fetchGithubJson(
        `${githubApiRoot}/users/${githubUsername}`,
      );
      if (
        !Number.isInteger(profile.public_repos) ||
        !Number.isInteger(profile.followers) ||
        typeof profile.created_at !== "string"
      ) {
        throw new Error("GitHub returned incomplete public profile details.");
      }

      const joinedDate = new Date(profile.created_at);
      if (!Number.isFinite(joinedDate.getTime())) {
        throw new Error("GitHub returned an invalid account creation date.");
      }

      document.querySelector("#github-bio").textContent =
        typeof profile.bio === "string" && profile.bio.trim()
          ? profile.bio
          : "No public bio provided.";
      document.querySelector("#github-repositories").textContent =
        `${profile.public_repos.toLocaleString()}+`;
      document.querySelector("#github-followers").textContent =
        `${profile.followers.toLocaleString()}+`;
      document.querySelector("#github-member-since").textContent =
        String(joinedDate.getFullYear());
      return true;
    } catch (error) {
      console.error("Unable to load public GitHub profile details.", error);
      return false;
    }
  };

  const loadGithubTotal = async (selector, label, endpoint, qualifier = "") => {
    try {
      const query = `author:${githubUsername}${qualifier ? ` ${qualifier}` : ""}`;
      const params = new URLSearchParams({ q: query, per_page: "1" });
      const result = await fetchGithubJson(
        `${githubApiRoot}/${endpoint}?${params.toString()}`,
      );
      if (
        !Number.isSafeInteger(result.total_count) ||
        result.total_count < 0 ||
        result.incomplete_results !== false
      ) {
        throw new Error(`GitHub returned an incomplete ${label} total.`);
      }

      document.querySelector(selector).textContent =
        `${result.total_count.toLocaleString()}+`;
      return true;
    } catch (error) {
      console.error(`Unable to load public GitHub ${label}.`, error);
      document.querySelector(selector).textContent = "—";
      return false;
    }
  };

  const requestGithubData = async () => {
    if (githubDataRequested) {
      return;
    }
    githubDataRequested = true;

    const results = await Promise.all([
      loadGithubProfile(),
      loadGithubTotal("#github-commits", "commit total", "search/commits"),
      loadGithubTotal(
        "#github-issues",
        "issue total",
        "search/issues",
        "type:issue",
      ),
      loadGithubTotal(
        "#github-pull-requests",
        "pull request total",
        "search/issues",
        "type:pr",
      ),
    ]);

    githubDashboard.setAttribute("aria-busy", "false");
    githubProfileStatus.textContent = results.every(Boolean)
      ? "Public profile totals loaded from GitHub."
      : "Some public totals are unavailable. Visit GitHub for the latest information.";
  };

  if ("IntersectionObserver" in window) {
    const githubObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          githubObserver.disconnect();
          void requestGithubData();
        }
      },
      { rootMargin: "180px 0px" },
    );
    githubObserver.observe(githubActivitySection);
  } else {
    void requestGithubData();
  }
}

    const contributionGraph = document.querySelector("#contrib-graph");

    if (contributionGraph && githubActivitySection) {
      const svgNamespace = "http://www.w3.org/2000/svg";
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const cellSize = 11;
      const cellStep = 14;
      const labelHeight = 18;
      const contribStatus = document.querySelector("#contrib-status");
      const contribTotal = document.querySelector("#contrib-total");

      const drawContributionGraph = (days) => {
        const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
        const weekCount = Math.ceil((days.length + firstWeekday) / 7);
        const width = weekCount * cellStep;
        const height = labelHeight + 7 * cellStep;
        contributionGraph.setAttribute("viewBox", `0 0 ${width} ${height}`);
        contributionGraph.setAttribute("width", String(width));
        contributionGraph.setAttribute("height", String(height));
        contributionGraph.replaceChildren();

        let lastMonth = -1;
        days.forEach((day, index) => {
          const slot = index + firstWeekday;
          const week = Math.floor(slot / 7);
          const weekday = slot % 7;
          const x = week * cellStep;
          const y = labelHeight + weekday * cellStep;
          const month = Number(day.date.slice(5, 7)) - 1;

          if (weekday === 0 && month !== lastMonth && x < width - 3 * cellStep) {
            const label = document.createElementNS(svgNamespace, "text");
            label.setAttribute("x", String(x));
            label.setAttribute("y", "11");
            label.setAttribute("class", "contrib-month");
            label.textContent = monthNames[month];
            contributionGraph.append(label);
            lastMonth = month;
          }

          const cell = document.createElementNS(svgNamespace, "rect");
          cell.setAttribute("x", String(x));
          cell.setAttribute("y", String(y));
          cell.setAttribute("width", String(cellSize));
          cell.setAttribute("height", String(cellSize));
          cell.setAttribute("rx", "2");
          cell.setAttribute("class", `contrib-cell lv-${Math.min(4, Math.max(0, day.level))}`);
          const title = document.createElementNS(svgNamespace, "title");
          title.textContent = `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`;
          cell.append(title);
          contributionGraph.append(cell);
        });
      };

      const loadContributions = async () => {
        try {
          const response = await fetch(
            "https://github-contributions-api.jogruber.de/v4/neha-sharma-geoai?y=last",
          );
          if (!response.ok) {
            throw new Error(`Contribution request failed with status ${response.status}.`);
          }
          const data = await response.json();
          const days = Array.isArray(data.contributions)
            ? data.contributions.filter((day) => typeof day.date === "string" && Number.isFinite(day.count))
            : [];
          if (days.length === 0) {
            throw new Error("The contribution response contained no days.");
          }

          // Keep a full 53-week window ending today, like the GitHub profile graph.
          const visibleDays = days.slice(-371);
          drawContributionGraph(visibleDays);
          const total = visibleDays.reduce((sum, day) => sum + day.count, 0);
          contribTotal.textContent = `${total.toLocaleString()}+ contributions`;
          contribStatus.textContent = "";
          const scroller = contributionGraph.parentElement;
          scroller.scrollLeft = scroller.scrollWidth;
        } catch (error) {
          console.error("Unable to load the GitHub contribution graph.", error);
          contribStatus.textContent =
            "The contribution graph is unavailable right now. Visit GitHub for the latest activity.";
        }
      };

      if ("IntersectionObserver" in window) {
        const contributionObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              contributionObserver.disconnect();
              void loadContributions();
            }
          },
          { rootMargin: "180px 0px" },
        );
        contributionObserver.observe(githubActivitySection);
      } else {
        void loadContributions();
      }
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("svg").forEach((svg) => {
        if (typeof svg.pauseAnimations === "function") {
          svg.pauseAnimations();
        }
      });
    }
