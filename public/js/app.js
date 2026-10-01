/* StormCast front end. Plain browser JS, no build step. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ---------------------------------------------------------------------------
  // Icons (paths from Lucide, ISC licensed)
  // ---------------------------------------------------------------------------

  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-15.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    "cloud-sun":
      '<path d="M12 2v2m-7.07.93 1.41 1.41M20 12h2m-2.93-7.07-1.41 1.41M15.947 12.65a4 4 0 0 0-5.925-4.128M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
    "cloud-moon":
      '<path d="M13 16a3 3 0 1 1 0 6H7a5 5 0 1 1 4.9-6Z"/><path d="M10.1 9A6 6 0 0 1 16 4a4.24 4.24 0 0 0 6 6 6 6 0 0 1-3 5.197"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    cloudy:
      '<path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M22 10a3 3 0 0 0-3-3h-2.207a5.502 5.502 0 0 0-10.702.5"/>',
    "cloud-drizzle":
      '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v1M8 14v1M16 19v1M16 14v1M12 21v1M12 16v1"/>',
    "cloud-rain":
      '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6M8 14v6M12 16v6"/>',
    "cloud-lightning":
      '<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/>',
    "cloud-snow":
      '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01M8 19h.01M12 17h.01M12 21h.01M16 15h.01M16 19h.01"/>',
    "cloud-fog":
      '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 17H7M17 21H9"/>',
    "cloud-off":
      '<path d="m2 2 20 20"/><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"/><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"/>',
    thermometer: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    droplets:
      '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
    wind: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    sunrise:
      '<path d="M12 2v8m-7.07.93 1.41 1.41M2 18h2m16 0h2m-2.93-7.07-1.41 1.41M22 22H2m6-16 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>',
    sunset:
      '<path d="M12 10V2m-7.07 8.93 1.41 1.41M2 18h2m16 0h2m-2.93-7.07-1.41 1.41M22 22H2m14-16-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  };

  const OWM_ICON = {
    "01d": "sun",
    "01n": "moon",
    "02d": "cloud-sun",
    "02n": "cloud-moon",
    "03d": "cloud",
    "03n": "cloud",
    "04d": "cloudy",
    "04n": "cloudy",
    "09d": "cloud-drizzle",
    "09n": "cloud-drizzle",
    "10d": "cloud-rain",
    "10n": "cloud-rain",
    "11d": "cloud-lightning",
    "11n": "cloud-lightning",
    "13d": "cloud-snow",
    "13n": "cloud-snow",
    "50d": "cloud-fog",
    "50n": "cloud-fog",
  };

  function icon(name, cls = "icon") {
    const body = ICONS[name] || ICONS.cloud;
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  const weatherIcon = (code) => icon(OWM_ICON[code] || "cloud");

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------

  const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const compass = (deg) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

  const fmt = {
    temp: (t) => `${Math.round(t)}°`,
    speed: (v, units) => (units === "metric" ? `${Math.round(v * 3.6)} km/h` : `${Math.round(v)} mph`),
    pressure: (hPa, units) => (units === "metric" ? `${Math.round(hPa)} hPa` : `${(hPa * 0.02953).toFixed(2)} inHg`),
    distance: (m, units) => (units === "metric" ? `${(m / 1000).toFixed(m < 5000 ? 1 : 0)} km` : `${(m / 1609.34).toFixed(m < 8000 ? 1 : 0)} mi`),
    time: (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    relative(iso) {
      const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      if (minutes < 1) return "just now";
      if (minutes < 60) return `${minutes} min ago`;
      return `${Math.round(minutes / 60)} h ago`;
    },
  };

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  async function getJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        message = (await response.json()).error || message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return response.json();
  }

  // ---------------------------------------------------------------------------
  // App
  // ---------------------------------------------------------------------------

  class StormCast {
    constructor() {
      this.config = {
        slideshowIntervalMs: 10000,
        radarEvery: 5,
        units: "imperial",
        emailAddress: null,
        requiredSubject: "slideshow",
        radarStation: "",
        slideshowOrder: "smart",
        radarDurationMs: 15000,
      };
      this.images = [];
      this.current = null;
      this.queue = [];
      this.queuePos = -1;
      this.alerts = [];
      this.alertIndex = 0;
      this.alertTimer = null;
      this.sinceRadar = 0;
      this.showingRadar = false;
      this.playing = true;
      this.started = false;
      this.advanceTimer = null;
      this.uiTimer = null;
      this.idleTimer = null;
      this.loadToken = 0;
      this.activeLayer = -1;
      this.radar = { available: false, url: null, updatedAt: null };
      this.pendingRadarUrl = null;
      this.radarImageReady = false;
      this.pointer = null;
      this.swallowClick = false;

      this.stage = $("stage");
      this.layers = [...this.stage.querySelectorAll(".slide")];
      this.progressFill = $("progressFill");
    }

    async init() {
      this.bindEvents();
      this.tickClock();
      setInterval(() => this.tickClock(), 1000);
      this.touch();

      try {
        Object.assign(this.config, await getJson("/api/config"));
      } catch (error) {
        console.warn("Could not load config, using defaults:", error);
      }
      $("radarStation").textContent = this.config.radarStation ? `NWS ${this.config.radarStation}` : "";

      await Promise.all([this.loadImages(), this.loadWeather(), this.loadRadar(), this.loadAlerts(), this.loadStatus()]);

      this.started = true;
      if (this.images.length) this.showImage(this.nextEntry());
      this.renderEmptyState();

      setInterval(() => this.loadImages(), 30 * 1000);
      setInterval(() => this.loadWeather(), 5 * 60 * 1000);
      setInterval(() => this.loadAlerts(), 60 * 1000);
      setInterval(() => this.loadRadar(), 60 * 1000);
      setInterval(() => this.loadStatus(), 15 * 1000);
    }

    // ---- Events -------------------------------------------------------------

    bindEvents() {
      const button = (id, action) =>
        $(id).addEventListener("click", () => {
          action();
          this.revealUi();
        });
      button("prevBtn", () => this.previous());
      button("nextBtn", () => this.next());
      button("playBtn", () => this.togglePlay());
      button("radarBtn", () => this.showRadar(true));

      // After a touch, the browser fires a synthetic click and hit-tests again.
      // If that tap just revealed the controls, the click would land on a button
      // that was invisible when the finger went down. Swallow that one click.
      this.stage.addEventListener(
        "click",
        (e) => {
          if (!this.swallowClick) return;
          this.swallowClick = false;
          e.stopPropagation();
          e.preventDefault();
        },
        true
      );

      const radarImage = $("radarImage");
      radarImage.addEventListener("load", () => {
        this.radarImageReady = true;
        $("radarEmpty").classList.add("hidden");
      });
      radarImage.addEventListener("error", () => {
        this.radarImageReady = false;
        if (this.radar.available) this.setRadarMessage("Radar failed to load");
      });

      this.stage.addEventListener("pointerdown", (e) => {
        this.swallowClick = false;
        if (e.target.closest("button")) {
          this.pointer = null;
          return;
        }
        this.pointer = { x: e.clientX, y: e.clientY, t: Date.now() };
      });
      this.stage.addEventListener("pointerup", (e) => {
        const start = this.pointer;
        this.pointer = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const dt = Date.now() - start.t;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          dx < 0 ? this.next() : this.previous();
          this.revealUi();
        } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 500) {
          if (this.stage.classList.contains("show-ui")) {
            this.hideUi();
          } else {
            this.revealUi();
            this.swallowClick = true;
          }
        }
      });
      this.stage.addEventListener("pointercancel", () => (this.pointer = null));
      this.stage.addEventListener("contextmenu", (e) => e.preventDefault());

      document.addEventListener("keydown", (e) => {
        if (e.target.closest("input, textarea")) return;
        switch (e.key) {
          case "ArrowLeft":
            this.previous();
            this.revealUi();
            break;
          case "ArrowRight":
            this.next();
            this.revealUi();
            break;
          case " ":
            e.preventDefault();
            this.togglePlay();
            this.revealUi();
            break;
          case "r":
          case "R":
            this.showRadar(true);
            break;
        }
      });

      for (const type of ["pointermove", "pointerdown", "keydown"]) {
        document.addEventListener(type, () => this.touch(), { passive: true });
      }
    }

    /** Hide the mouse cursor after a few seconds of inactivity (kiosk mode). */
    touch() {
      document.body.classList.remove("idle");
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => document.body.classList.add("idle"), 4000);
    }

    revealUi() {
      this.stage.classList.add("show-ui");
      clearTimeout(this.uiTimer);
      this.uiTimer = setTimeout(() => this.hideUi(), 4000);
    }

    hideUi() {
      clearTimeout(this.uiTimer);
      this.stage.classList.remove("show-ui");
    }

    // ---- Playback order -----------------------------------------------------

    /**
     * Build the next pass through the photos.
     *  - newest:  newest first, in order
     *  - shuffle: uniform random
     *  - smart:   random, but photos from the last few weeks are weighted to
     *             appear several times more often than old ones
     */
    buildQueue() {
      const lastShown = this.current?.name;
      let order;
      if (this.config.slideshowOrder === "newest") {
        order = this.images.map((img) => img.name);
      } else if (this.config.slideshowOrder === "shuffle") {
        order = this.images.map((img) => ({ name: img.name, key: Math.random() }));
      } else {
        const now = Date.now();
        order = this.images.map((img) => {
          const ageDays = Math.max(0, (now - new Date(img.addedAt).getTime()) / 86400000);
          const weight = 1 + 4 * Math.exp(-ageDays / 14);
          // Weighted sampling without replacement (Efraimidis-Spirakis).
          return { name: img.name, key: Math.pow(Math.random(), 1 / weight) };
        });
      }
      if (typeof order[0] === "object") {
        order = order.sort((a, b) => b.key - a.key).map((item) => item.name);
      }
      if (order.length > 1 && order[0] === lastShown) order.push(order.shift());
      this.queue = order;
      this.queuePos = -1;
    }

    entryByName(name) {
      return this.images.find((img) => img.name === name) || null;
    }

    nextEntry() {
      if (!this.images.length) return null;
      if (this.queuePos + 1 >= this.queue.length) this.buildQueue();
      this.queuePos += 1;
      return this.entryByName(this.queue[this.queuePos]) || this.images[0];
    }

    prevEntry() {
      if (!this.images.length) return null;
      if (this.queuePos > 0) this.queuePos -= 1;
      return this.entryByName(this.queue[this.queuePos]) || this.current || this.images[0];
    }

    /** Drop photos that no longer exist from the queue, keeping our position. */
    syncQueue() {
      const names = new Set(this.images.map((img) => img.name));
      const currentName = this.current?.name;
      this.queue = this.queue.filter((name) => names.has(name));
      this.queuePos = currentName ? this.queue.indexOf(currentName) : Math.min(this.queuePos, this.queue.length - 1);
    }

    // ---- Slideshow ----------------------------------------------------------

    get radarReady() {
      return this.radar.available && this.config.radarEvery > 0;
    }

    showImage(entry) {
      if (!entry) return;

      const token = ++this.loadToken;
      const preload = new Image();
      preload.onload = () => {
        if (token !== this.loadToken) return;
        const nextLayer = this.layers[(this.activeLayer + 1) % this.layers.length] || this.layers[0];
        nextLayer.querySelector(".slide-img").src = entry.url;
        nextLayer.querySelector(".slide-bg").src = entry.url;
        this.layers.forEach((layer) => layer.classList.toggle("active", layer === nextLayer));
        this.activeLayer = this.layers.indexOf(nextLayer);
        this.current = entry;
        this.hideRadarSlide();
        this.updateCounter();
        this.scheduleAdvance();
      };
      preload.onerror = () => {
        if (token !== this.loadToken) return;
        console.warn("Could not load image, skipping:", entry.url);
        this.images = this.images.filter((img) => img !== entry);
        this.syncQueue();
        this.renderEmptyState();
        if (this.images.length) this.showImage(this.nextEntry());
      };
      preload.src = entry.url;
    }

    showRadar(manual = false) {
      if (!this.radar.available) {
        if (manual) this.revealUi();
        return;
      }
      this.loadToken++;
      this.showingRadar = true;
      this.sinceRadar = 0;
      $("radarSlide").classList.add("active");
      $("radarSlide").setAttribute("aria-hidden", "false");
      $("radarUpdated").textContent = this.radar.updatedAt ? `Updated ${fmt.relative(this.radar.updatedAt)}` : "";
      $("counter").textContent = "Radar";
      this.stage.classList.toggle("radar-only", this.images.length === 0);
      if (!this.radarImageReady) this.setRadarMessage("Loading radar…");
      this.scheduleAdvance();
    }

    setRadarMessage(text) {
      const el = $("radarEmpty");
      el.textContent = text;
      el.classList.remove("hidden");
    }

    hideRadarSlide() {
      this.showingRadar = false;
      this.stage.classList.remove("radar-only");
      if (this.pendingRadarUrl) {
        // A newer radar frame arrived while the radar was on screen; swap it in now.
        $("radarImage").src = this.pendingRadarUrl;
        this.pendingRadarUrl = null;
      }
      $("radarSlide").classList.remove("active");
      $("radarSlide").setAttribute("aria-hidden", "true");
    }

    next() {
      if (!this.images.length) {
        if (this.radar.available && !this.showingRadar) this.showRadar();
        return;
      }
      if (this.showingRadar) {
        this.showImage(this.nextEntry());
        return;
      }
      this.sinceRadar += 1;
      if (this.radarReady && this.sinceRadar >= this.config.radarEvery) {
        this.showRadar();
        return;
      }
      this.showImage(this.nextEntry());
    }

    previous() {
      if (!this.images.length) return;
      if (this.showingRadar) {
        this.showImage(this.current || this.nextEntry());
        return;
      }
      this.sinceRadar = Math.max(0, this.sinceRadar - 1);
      this.showImage(this.prevEntry());
    }

    scheduleAdvance() {
      clearTimeout(this.advanceTimer);
      this.resetProgress();
      if (!this.playing || !this.images.length) return;
      const ms = this.showingRadar ? this.config.radarDurationMs : this.config.slideshowIntervalMs;
      this.animateProgress(ms);
      this.advanceTimer = setTimeout(() => this.next(), ms);
    }

    resetProgress() {
      this.progressFill.style.transition = "none";
      this.progressFill.style.width = "0%";
      // Force a reflow so the next transition starts from zero.
      void this.progressFill.offsetWidth;
    }

    animateProgress(ms) {
      this.progressFill.style.transition = `width ${ms}ms linear`;
      this.progressFill.style.width = "100%";
    }

    togglePlay() {
      this.playing = !this.playing;
      $("playIcon").classList.toggle("hidden", this.playing);
      $("pauseIcon").classList.toggle("hidden", !this.playing);
      $("playBtn").setAttribute("aria-label", this.playing ? "Pause slideshow" : "Resume slideshow");
      if (this.playing) {
        this.scheduleAdvance();
      } else {
        clearTimeout(this.advanceTimer);
        this.advanceTimer = null;
        const width = getComputedStyle(this.progressFill).width;
        this.progressFill.style.transition = "none";
        this.progressFill.style.width = width;
      }
    }

    updateCounter() {
      $("counter").textContent = this.images.length ? `${this.queuePos + 1} / ${this.queue.length}` : "";
    }

    renderEmptyState() {
      const empty = this.images.length === 0;
      $("emptyState").classList.toggle("hidden", !empty);
      $("photoCount").textContent = `${this.images.length} photo${this.images.length === 1 ? "" : "s"}`;
      if (!empty) return;

      const hint = $("emptyHint");
      if (this.config.emailAddress) {
        hint.innerHTML =
          `Email photos to <code>${escapeHtml(this.config.emailAddress)}</code> ` +
          `with <code>${escapeHtml(this.config.requiredSubject)}</code> in the subject line.`;
      } else {
        hint.innerHTML =
          "Add <code>EMAIL_USER</code> and <code>EMAIL_PASSWORD</code> to <code>.env</code> to receive photos by email, " +
          "or copy images into the <code>uploads/images</code> folder.";
      }
      this.layers.forEach((layer) => layer.classList.remove("active"));
      clearTimeout(this.advanceTimer);
      this.resetProgress();
      this.updateCounter();
      if (this.started && this.radar.available && !this.showingRadar) this.showRadar();
    }

    // ---- Data loading ---------------------------------------------------------

    async loadImages() {
      let list;
      try {
        list = await getJson("/api/images");
      } catch (error) {
        console.error("Failed to load images:", error);
        return;
      }

      const known = new Set(this.images.map((img) => img.name));
      const added = list.filter((img) => !known.has(img.name));
      const changed = added.length > 0 || list.length !== this.images.length;
      this.images = list;
      if (!changed) return;

      this.syncQueue();
      this.renderEmptyState();
      if (!this.started || !list.length) return;

      if (added.length && known.size > 0) {
        // Queue the new arrivals next (newest first) and jump straight to them.
        this.queue.splice(this.queuePos + 1, 0, ...added.map((img) => img.name));
        this.sinceRadar = 0;
        this.showImage(this.nextEntry());
        return;
      }
      if (added.length || (this.current && !known.has(this.current.name))) {
        this.showImage(this.nextEntry());
      } else if (!this.current && !this.showingRadar) {
        this.showImage(this.nextEntry());
      } else {
        this.updateCounter();
      }
    }

    async loadAlerts() {
      try {
        this.renderAlerts(await getJson("/api/alerts"));
      } catch (error) {
        console.error("Failed to load alerts:", error);
      }
    }

    async loadRadar() {
      try {
        const info = await getJson("/api/radar");
        const changed = info.url && info.url !== this.radar.url;
        this.radar = info;
        if (!info.available) {
          this.radarImageReady = false;
          this.setRadarMessage("Radar unavailable");
        }
        if (changed) {
          if (!this.radarImageReady) {
            $("radarImage").src = info.url;
          } else {
            // Fetch the new frame in the background, then swap it in when the
            // radar is not on screen so it never blanks out mid-view.
            const preload = new Image();
            preload.onload = () => {
              if (this.radar.url !== info.url) return;
              if (this.showingRadar) this.pendingRadarUrl = info.url;
              else $("radarImage").src = info.url;
            };
            preload.src = info.url;
          }
        }
        if (this.showingRadar && info.updatedAt) {
          $("radarUpdated").textContent = `Updated ${fmt.relative(info.updatedAt)}`;
        }
      } catch (error) {
        console.error("Failed to load radar info:", error);
      }
    }

    async loadWeather() {
      try {
        this.renderWeather(await getJson("/api/weather"));
      } catch (error) {
        this.renderWeatherUnavailable(error.message);
      }
    }

    async loadStatus() {
      try {
        const status = await getJson("/api/status");
        this.setDot("dotEmail", status.email);
        this.setDot("dotWeather", status.weather);
        this.setDot("dotRadar", status.radar);
        if (!this.images.length && status.images.count) this.loadImages();
      } catch (error) {
        console.error("Failed to load status:", error);
      }
    }

    setDot(id, service) {
      const dot = $(id);
      let state = "ok";
      if (service.configured === false) state = "off";
      else if (service.error) state = service.connected ? "warn" : "bad";
      else if (!service.connected) state = "warn";
      dot.className = `dot ${state}`;
      dot.parentElement.title = service.error || (state === "ok" ? "Connected" : "Waiting…");
    }

    // ---- Rendering ----------------------------------------------------------

    tickClock() {
      const now = new Date();
      const [time, ampm] = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).split(" ");
      $("clockTime").textContent = time;
      $("clockAmPm").textContent = ampm || "";
      $("clockDate").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    }

    renderWeather(data) {
      const { current: c, forecast, units } = data;
      const hero = document.querySelector(".hero");
      hero.classList.remove("unavailable");
      $("details").classList.remove("hidden");

      $("heroIcon").innerHTML = weatherIcon(c.icon);
      $("heroTemp").textContent = Math.round(c.temperature);
      $("heroDesc").textContent = c.description || "—";
      $("heroLocation").textContent = c.location;
      const today = forecast.find((d) => d.date === this.localDateKey(new Date()));
      const high = today ? Math.max(today.high, c.tempMax) : c.tempMax;
      const low = today ? Math.min(today.low, c.tempMin) : c.tempMin;
      $("heroRange").textContent = `H ${fmt.temp(high)}  L ${fmt.temp(low)}`;

      const now = Date.now();
      const sunrise = new Date(c.sunrise).getTime();
      const sunset = new Date(c.sunset).getTime();
      const nextIsSunrise = now < sunrise || now > sunset;

      this.setDetail("feels", "thermometer", "Feels like", fmt.temp(c.feelsLike));
      this.setDetail("humidity", "droplets", "Humidity", `${c.humidity}%`);
      this.setDetail("wind", "wind", "Wind", `${fmt.speed(c.windSpeed, units)} ${compass(c.windDirection)}`);
      this.setDetail("pressure", "gauge", "Pressure", fmt.pressure(c.pressure, units));
      this.setDetail(
        "sun",
        nextIsSunrise ? "sunrise" : "sunset",
        nextIsSunrise ? "Sunrise" : "Sunset",
        fmt.time(nextIsSunrise ? c.sunrise : c.sunset)
      );
      this.setDetail("visibility", "eye", "Visibility", c.visibility != null ? fmt.distance(c.visibility, units) : "—");

      this.renderHourly(data.hourly || []);
      this.renderForecast(forecast);
    }

    renderWeatherUnavailable(message) {
      const hero = document.querySelector(".hero");
      hero.classList.add("unavailable");
      $("details").classList.add("hidden");
      $("heroIcon").innerHTML = icon("cloud-off");
      $("heroTemp").textContent = "--";
      $("heroDesc").textContent = "Weather unavailable";
      $("heroLocation").textContent = message || "";
      $("heroRange").textContent = "";
      $("forecast").innerHTML = "";
      $("hourly").innerHTML = "";
      for (const el of document.querySelectorAll(".detail")) el.innerHTML = "";
    }

    setDetail(key, iconName, label, value) {
      const el = document.querySelector(`.detail[data-detail="${key}"]`);
      if (!el) return;
      el.innerHTML = `${icon(iconName)}<div><div class="detail-label">${label}</div><div class="detail-value">${escapeHtml(value)}</div></div>`;
    }

    renderForecast(forecast) {
      const todayKey = this.localDateKey(new Date());
      const days = forecast.filter((d) => d.date >= todayKey).slice(0, 4);
      $("forecast").innerHTML = days
        .map((d) => {
          const date = new Date(`${d.date}T12:00:00`);
          const label = d.date === todayKey ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
          const pop = Math.round(d.precipitationChance * 100);
          return (
            `<div class="fc" title="${escapeHtml(d.description)}">` +
            `<div class="fc-day">${label}</div>` +
            `<div class="fc-icon">${weatherIcon(d.icon)}</div>` +
            `<div class="fc-temps">${fmt.temp(d.high)} <span class="fc-lo">${fmt.temp(d.low)}</span></div>` +
            `<div class="fc-pop">${pop >= 5 ? `${pop}%` : "&nbsp;"}</div>` +
            `</div>`
          );
        })
        .join("");
    }

    renderHourly(hourly) {
      const slots = hourly.slice(0, 6);
      $("hourly").innerHTML = slots
        .map((h) => {
          const pop = Math.round(h.precipitationChance * 100);
          const label = new Date(h.time).toLocaleTimeString("en-US", { hour: "numeric" }).replace(" ", "");
          return (
            `<div class="hr" title="${escapeHtml(h.description)}">` +
            `<div class="hr-time">${label}</div>` +
            `<div class="hr-icon">${weatherIcon(h.icon)}</div>` +
            `<div class="hr-temp">${fmt.temp(h.temperature)}</div>` +
            `<div class="hr-pop">${pop >= 5 ? `${pop}%` : "&nbsp;"}</div>` +
            `</div>`
          );
        })
        .join("");
    }

    renderAlerts(alerts) {
      const previousIds = this.alerts.map((a) => a.id).join("|");
      this.alerts = alerts;
      const banner = $("alertBanner");
      clearInterval(this.alertTimer);

      if (!alerts.length) {
        banner.classList.add("hidden");
        this.stage.classList.remove("has-alert");
        return;
      }
      if (alerts.map((a) => a.id).join("|") !== previousIds) this.alertIndex = 0;
      this.stage.classList.add("has-alert");
      banner.classList.remove("hidden");
      this.showAlert();
      if (alerts.length > 1) {
        this.alertTimer = setInterval(() => {
          this.alertIndex = (this.alertIndex + 1) % this.alerts.length;
          this.showAlert();
        }, 8000);
      }
    }

    showAlert() {
      const alert = this.alerts[this.alertIndex];
      if (!alert) return;
      const banner = $("alertBanner");
      banner.className = `alert-banner alert-${alert.severity.toLowerCase()}`;
      $("alertEvent").textContent = alert.event;

      const parts = [];
      if (alert.ends) {
        const ends = new Date(alert.ends);
        const sameDay = this.localDateKey(ends) === this.localDateKey(new Date());
        const when = sameDay
          ? ends.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
          : ends.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
        parts.push(`until ${when}`);
      }
      if (alert.areas) parts.push(alert.areas);
      $("alertDetail").textContent = parts.join("  ·  ");
      $("alertDetail").title = alert.headline || alert.description || "";
      $("alertCount").textContent = this.alerts.length > 1 ? `${this.alertIndex + 1}/${this.alerts.length}` : "";
    }

    localDateKey(date) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const app = new StormCast();
    window.stormcast = app; // handy for debugging from the console
    app.init().catch((error) => console.error("StormCast failed to start:", error));
  });
})();
