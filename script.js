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

  const githubActivitySection = document.querySelector("#github-activity");

  if (githubActivitySection) {
    const githubUsername = "neha-sharma-geoai";
    const githubProfileUrl = `https://api.github.com/users/${githubUsername}`;
    const githubEventsUrl = `https://api.github.com/users/${githubUsername}/events/public?per_page=30`;
    const githubProfileStatus = document.querySelector("#github-profile-status");
    const githubEventList = document.querySelector("#github-event-list");
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
        const profile = await fetchGithubJson(githubProfileUrl);
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
          profile.public_repos.toLocaleString();
        document.querySelector("#github-followers").textContent =
          profile.followers.toLocaleString();
        document.querySelector("#github-member-since").textContent =
          String(joinedDate.getFullYear());
        githubProfileStatus.textContent = "Public profile details loaded from GitHub.";
      } catch (error) {
        console.error("Unable to load public GitHub profile details.", error);
        githubProfileStatus.textContent =
          "Profile details are temporarily unavailable. Visit GitHub for the latest information.";
      }
    };

    const parseGithubEvent = (event) => {
      if (
        !event ||
        event.public !== true ||
        typeof event.type !== "string" ||
        typeof event.created_at !== "string" ||
        !event.repo ||
        typeof event.repo.name !== "string"
      ) {
        return null;
      }

      const repositoryParts = event.repo.name.split("/");
      if (
        repositoryParts.length !== 2 ||
        repositoryParts.some(
          (part) => !/^[A-Za-z0-9_.-]+$/.test(part) || part === "." || part === "..",
        )
      ) {
        return null;
      }

      const eventDate = new Date(event.created_at);
      if (!Number.isFinite(eventDate.getTime())) {
        return null;
      }

      const repositoryUrl = `https://github.com/${repositoryParts
        .map((part) => encodeURIComponent(part))
        .join("/")}`;
      const payload =
        event.payload && typeof event.payload === "object" ? event.payload : {};
      let summary;
      let kind;
      let actionUrl = repositoryUrl;
      let actionLabel = "View repository";

      switch (event.type) {
        case "PushEvent": {
          summary = "Pushed commits to";
          kind = "PUSH";
          if (typeof payload.head === "string" && /^[a-f0-9]{7,40}$/i.test(payload.head)) {
            actionUrl = `${repositoryUrl}/commit/${payload.head}`;
            actionLabel = "View commit";
          }
          break;
        }
        case "PullRequestEvent": {
          const pullNumber =
            payload.pull_request && Number(payload.pull_request.number);
          if (!Number.isInteger(pullNumber) || pullNumber < 1) {
            return null;
          }
          summary = payload.action === "opened"
            ? "Opened a pull request in"
            : "Updated a pull request in";
          kind = "PULL REQUEST";
          actionUrl = `${repositoryUrl}/pull/${pullNumber}`;
          actionLabel = "View pull request";
          break;
        }
        case "PullRequestReviewEvent": {
          const pullNumber =
            payload.pull_request && Number(payload.pull_request.number);
          if (!Number.isInteger(pullNumber) || pullNumber < 1) {
            return null;
          }
          summary = "Reviewed a pull request in";
          kind = "REVIEW";
          actionUrl = `${repositoryUrl}/pull/${pullNumber}`;
          actionLabel = "View pull request";
          break;
        }
        case "IssuesEvent": {
          const issueNumber = payload.issue && Number(payload.issue.number);
          if (!Number.isInteger(issueNumber) || issueNumber < 1) {
            return null;
          }
          summary = payload.action === "opened"
            ? "Opened an issue in"
            : payload.action === "closed"
              ? "Closed an issue in"
              : "Updated an issue in";
          kind = "ISSUE";
          actionUrl = `${repositoryUrl}/issues/${issueNumber}`;
          actionLabel = "View issue";
          break;
        }
        case "CreateEvent": {
          if (typeof payload.ref_type !== "string") {
            return null;
          }
          summary = payload.ref_type === "repository"
            ? "Created a repository"
            : `Created ${payload.ref_type} in`;
          kind = "CREATE";
          break;
        }
        case "ReleaseEvent": {
          summary = "Published a release in";
          kind = "RELEASE";
          actionUrl = `${repositoryUrl}/releases`;
          actionLabel = "View releases";
          break;
        }
        default:
          return null;
      }

      return {
        actionLabel,
        actionUrl,
        date: eventDate,
        kind,
        repositoryName: event.repo.name,
        repositoryUrl,
        summary,
      };
    };

    const showGithubEventMessage = (message) => {
      const item = document.createElement("li");
      item.className = "github-event-state";
      item.textContent = message;
      githubEventList.replaceChildren(item);
      githubEventList.setAttribute("aria-busy", "false");
    };

    const renderGithubEvents = (events) => {
      const entries = events
        .map(parseGithubEvent)
        .filter(Boolean)
        .slice(0, 5);

      if (entries.length === 0) {
        showGithubEventMessage("No recent public code events are available to display.");
        return;
      }

      const fragment = document.createDocumentFragment();
      const dateFormatter = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      entries.forEach((entry) => {
        const item = document.createElement("li");
        item.className = "github-event";

        const kind = document.createElement("span");
        kind.className = "github-event-kind";
        kind.textContent = entry.kind;

        const content = document.createElement("div");
        content.className = "github-event-content";

        const summary = document.createElement("p");
        summary.append(`${entry.summary} `);
        const repositoryLink = document.createElement("a");
        repositoryLink.href = entry.repositoryUrl;
        repositoryLink.target = "_blank";
        repositoryLink.rel = "noreferrer";
        repositoryLink.textContent = entry.repositoryName;
        summary.append(repositoryLink);

        const date = document.createElement("time");
        date.dateTime = entry.date.toISOString();
        date.textContent = dateFormatter.format(entry.date);

        content.append(summary, date);

        const actionLink = document.createElement("a");
        actionLink.className = "github-event-action";
        actionLink.href = entry.actionUrl;
        actionLink.target = "_blank";
        actionLink.rel = "noreferrer";
        actionLink.textContent = entry.actionLabel;
        actionLink.setAttribute(
          "aria-label",
          `${entry.actionLabel} for ${entry.repositoryName}`,
        );

        item.append(kind, content, actionLink);
        fragment.append(item);
      });

      githubEventList.replaceChildren(fragment);
      githubEventList.setAttribute("aria-busy", "false");
    };

    const loadGithubEvents = async () => {
      try {
        const events = await fetchGithubJson(githubEventsUrl);
        if (!Array.isArray(events)) {
          throw new Error("GitHub returned an invalid public activity response.");
        }
        renderGithubEvents(events);
      } catch (error) {
        console.error("Unable to load recent public GitHub activity.", error);
        showGithubEventMessage(
          "Recent public activity is temporarily unavailable. Visit GitHub for the latest updates.",
        );
      }
    };

    const requestGithubData = () => {
      if (githubDataRequested) {
        return;
      }
      githubDataRequested = true;
      void loadGithubProfile();
      void loadGithubEvents();
    };

    if ("IntersectionObserver" in window) {
      const githubObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            githubObserver.disconnect();
            requestGithubData();
          }
        },
        { rootMargin: "180px 0px" },
      );
      githubObserver.observe(githubActivitySection);
    } else {
      requestGithubData();
    }
  }
