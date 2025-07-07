class SlideshowWeatherApp {
  constructor() {
    this.images = [];
    this.currentImageIndex = 0;
    this.currentSlideIndex = 0;
    this.isPlaying = true;
    this.slideshowInterval = null;
    this.weatherUpdateInterval = null;
    this.statusUpdateInterval = null;
    this.progressInterval = null;
    this.progressStartTime = null;
    this.radarEnabled = true;
    this.radarFrequency = 5;

    // Touch handling
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.minSwipeDistance = 25;
    this.maxVerticalDistance = 60;
    this.tapTimeout = 300;

    this.initializeElements();
    this.setupEventListeners();
    this.startApp();
  }

  initializeElements() {
    this.slideshowContainer = document.getElementById("slideshow");
    this.noImagesDiv = document.getElementById("no-images");
    this.prevBtn = document.getElementById("prevBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.playPauseBtn = document.getElementById("playPauseBtn");
    this.playIcon = document.getElementById("playIcon");
    this.pauseIcon = document.getElementById("pauseIcon");
    this.progressBar = document.getElementById("progressBar");
    this.progressFill = document.getElementById("progressFill");
    this.touchIndicatorLeft = document.getElementById("touchIndicatorLeft");
    this.touchIndicatorRight = document.getElementById("touchIndicatorRight");

    // Create radar display if it doesn't exist
    this.radarDisplay = document.getElementById("radarDisplay");
    if (!this.radarDisplay) {
      this.createRadarDisplay();
    }

    // Radar elements (optional)
    this.radarImage = document.getElementById("radarImage");
    this.radarLoader = document.getElementById("radarLoader");
    this.radarLocationEl = document.getElementById("radarLocation");
    this.radarTimeEl = document.getElementById("radarTime");

    // Weather elements
    this.temperatureEl = document.getElementById("temperature");
    this.descriptionEl = document.getElementById("weatherDescription");
    this.locationEl = document.getElementById("location");
    this.feelsLikeEl = document.getElementById("feelsLike");
    this.humidityEl = document.getElementById("humidity");
    this.windSpeedEl = document.getElementById("windSpeed");
    this.pressureEl = document.getElementById("pressure");
    this.weatherIconEl = document.getElementById("weatherIcon");

    this.currentTimeEl = document.getElementById("currentTime");
    this.currentDateEl = document.getElementById("currentDate");

    this.emailStatusEl = document.getElementById("emailStatus");
    this.emailStatusTextEl = document.getElementById("emailStatusText");
    this.weatherStatusEl = document.getElementById("weatherStatus");
    this.weatherStatusTextEl = document.getElementById("weatherStatusText");
    this.imageCountEl = document.getElementById("imageCount");

    // Check if radar elements exist
    if (!this.radarDisplay) {
      this.radarEnabled = false;
      console.log("Radar display not found, disabling radar feature");
    }
  }

  createRadarDisplay() {
    const radarHtml = `
      <div id="radarDisplay" class="hidden h-full w-full bg-gray-900/80 backdrop-blur-sm">
        <div class="flex flex-col h-full">
          <div class="text-center py-2 bg-black/30">
            <h3 class="text-white text-lg font-semibold">Weather Radar</h3>
            <p class="text-white/70 text-sm" id="radarLocation">Central Florida</p>
            <p class="text-white/60 text-xs" id="radarTime">Loading...</p>
          </div>
          <div class="flex-1 relative">
            <img 
              id="radarImage" 
              class="w-full h-full object-contain bg-gray-900"
              src=""
              alt="Weather Radar"
              style="display: none;"
            />
            <div id="radarLoader" class="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <div class="text-center text-white">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p class="text-sm">Loading radar...</p>
              </div>
            </div>
          </div>
          <div class="text-center py-1 bg-black/30">
            <p class="text-white/60 text-xs">Powered by NOAA</p>
          </div>
        </div>
      </div>
    `;

    this.slideshowContainer.insertAdjacentHTML("beforeend", radarHtml);
    this.radarDisplay = document.getElementById("radarDisplay");
  }

  setupEventListeners() {
    this.prevBtn.addEventListener("click", () => this.previousImage());
    this.nextBtn.addEventListener("click", () => this.nextImage());
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());

    // Touch events
    this.slideshowContainer.addEventListener(
      "touchstart",
      (e) => this.handleTouchStart(e),
      { passive: false }
    );
    this.slideshowContainer.addEventListener(
      "touchmove",
      (e) => this.handleTouchMove(e),
      { passive: false }
    );
    this.slideshowContainer.addEventListener(
      "touchend",
      (e) => this.handleTouchEnd(e),
      { passive: false }
    );

    this.slideshowContainer.addEventListener("contextmenu", (e) =>
      e.preventDefault()
    );
  }

  async startApp() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    await this.loadImages();
    await this.updateWeather();
    this.updateStatus();

    this.startSlideshow();

    // Update intervals
    this.weatherUpdateInterval = setInterval(
      () => this.updateWeather(),
      10 * 60 * 1000
    );
    setInterval(() => this.loadImages(), 30 * 1000);
    this.statusUpdateInterval = setInterval(
      () => this.updateStatus(),
      5 * 1000
    );
  }

  async loadImages() {
    try {
      const response = await fetch("/api/images");
      const newImages = await response.json();

      if (JSON.stringify(newImages) !== JSON.stringify(this.images)) {
        this.images = newImages;
        this.updateImageDisplay();
        this.imageCountEl.textContent = `${this.images.length} photos`;
      }
    } catch (error) {
      console.error("Failed to load images:", error);
    }
  }

  updateImageDisplay() {
    if (this.images.length === 0) {
      this.noImagesDiv.style.display = "flex";
      this.clearSlideshow();
      return;
    }

    this.noImagesDiv.style.display = "none";
    this.showCurrentSlide();
  }

  shouldShowRadar() {
    return (
      this.radarEnabled &&
      this.images.length > 0 &&
      (this.currentSlideIndex + 1) % this.radarFrequency === 0
    );
  }

  async showRadar() {
    if (!this.radarEnabled) {
      this.showCurrentImage();
      return;
    }

    // Ensure radar display exists
    if (!this.radarDisplay) {
      this.createRadarDisplay();
    }

    this.clearSlideshow();
    this.radarDisplay.classList.remove("hidden");

    // Re-get elements after creating the display
    this.radarImage = document.getElementById("radarImage");
    this.radarLoader = document.getElementById("radarLoader");
    this.radarLocationEl = document.getElementById("radarLocation");
    this.radarTimeEl = document.getElementById("radarTime");

    if (this.radarLoader) this.radarLoader.style.display = "flex";
    if (this.radarImage) this.radarImage.style.display = "none";

    try {
      const response = await fetch("/api/radar");
      if (!response.ok) throw new Error("Radar not available");

      const radarData = await response.json();

      if (radarData.radarUrl && this.radarImage) {
        // Clear any existing image source to force reload
        this.radarImage.src = "";

        // Add cache-busting and load new image
        this.radarImage.src = radarData.radarUrl;
        if (this.radarLocationEl)
          this.radarLocationEl.textContent = radarData.location;

        const radarTime = new Date(radarData.timestamp);
        if (this.radarTimeEl)
          this.radarTimeEl.textContent = `Updated: ${radarTime.toLocaleTimeString()}`;

        this.radarImage.onload = () => {
          if (this.radarLoader) this.radarLoader.style.display = "none";
          if (this.radarImage) this.radarImage.style.display = "block";
          console.log("📡 Radar image loaded successfully");
        };

        this.radarImage.onerror = () => {
          console.error("📡 Radar image failed to load");
          this.showRadarError("Radar image failed to load");
        };

        // Set a timeout in case the image never loads
        setTimeout(() => {
          if (this.radarLoader && this.radarLoader.style.display !== "none") {
            this.showRadarError("Radar loading timeout");
          }
        }, 10000);
      } else {
        this.showRadarError("No radar data available");
      }
    } catch (error) {
      console.error("Failed to load radar:", error);
      this.showRadarError("Failed to load radar");
    }
  }

  showRadarError(message) {
    if (this.radarLoader) {
      this.radarLoader.innerHTML = `
                <div class="text-center text-white">
                    <p class="text-sm">${message}</p>
                </div>
            `;
    }
  }

  showCurrentSlide() {
    if (this.shouldShowRadar()) {
      this.showRadar();
    } else {
      this.showCurrentImage();
    }
  }

  showCurrentImage() {
    if (this.images.length === 0) return;

    this.clearSlideshow();

    const img = document.createElement("img");
    img.src = this.images[this.currentImageIndex];
    img.className = "slide-image";
    img.style.opacity = "0";
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.transition = "opacity 0.3s ease-in-out";

    img.onload = () => {
      this.fitImageToContainer(img);
      img.style.opacity = "1";
    };

    this.slideshowContainer.appendChild(img);
  }

  fitImageToContainer(img) {
    const container = this.slideshowContainer;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    const imageAspectRatio = img.naturalWidth / img.naturalHeight;

    // Determine if image is portrait, landscape, or square
    const isPortrait = imageAspectRatio < 1;
    const isLandscape = imageAspectRatio > 1;
    const isSquare = Math.abs(imageAspectRatio - 1) < 0.1;

    // Smart fitting based on image orientation and container
    if (isPortrait) {
      // Portrait images: fit to height, center horizontally
      if (imageAspectRatio > containerAspectRatio) {
        // Image is taller relative to container - fit to width
        img.style.objectFit = "cover";
        img.style.objectPosition = "center center";
      } else {
        // Image fits better by height - contain it
        img.style.objectFit = "contain";
        img.style.objectPosition = "center center";
      }
    } else if (isLandscape) {
      // Landscape images: smart cropping based on aspect ratio difference
      const aspectRatioDifference = Math.abs(
        imageAspectRatio - containerAspectRatio
      );

      if (aspectRatioDifference < 0.5) {
        // Similar aspect ratios - use cover for better fill
        img.style.objectFit = "cover";
        img.style.objectPosition = "center center";
      } else {
        // Very different aspect ratios - use contain to show full image
        img.style.objectFit = "contain";
        img.style.objectPosition = "center center";
      }
    } else {
      // Square images: always contain to preserve the square
      img.style.objectFit = "contain";
      img.style.objectPosition = "center center";
    }

    // Add background color to fill any gaps
    img.style.backgroundColor = "transparent";
  }

  clearSlideshow() {
    const images = this.slideshowContainer.querySelectorAll("img");
    images.forEach((img) => {
      if (img.id === "radarImage") {
        img.src = "";
        return;
      } // Skip radar image

      img.remove();
    });
    if (this.radarDisplay) this.radarDisplay.classList.add("hidden");
  }

  nextImage() {
    this.currentSlideIndex++;

    if (this.shouldShowRadar()) {
      this.showRadar();
    } else {
      if (this.images.length === 0) return;
      this.currentImageIndex =
        (this.currentImageIndex + 1) % this.images.length;
      this.showCurrentImage();
    }

    this.resetProgress();
  }

  previousImage() {
    this.currentSlideIndex = Math.max(0, this.currentSlideIndex - 1);

    if (this.shouldShowRadar()) {
      this.showRadar();
    } else {
      if (this.images.length === 0) return;
      this.currentImageIndex =
        this.currentImageIndex === 0
          ? this.images.length - 1
          : this.currentImageIndex - 1;
      this.showCurrentImage();
    }

    this.resetProgress();
  }

  // Touch handling methods
  handleTouchStart(e) {
    if (e.touches.length > 1) return;

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();

    this.showTouchFeedback(touch.clientX);
  }

  handleTouchMove(e) {
    if (e.touches.length > 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = Math.abs(touch.clientY - this.touchStartY);

    if (
      Math.abs(deltaX) > this.minSwipeDistance &&
      deltaY < this.maxVerticalDistance
    ) {
      e.preventDefault();
    }

    this.updateTouchIndicators(deltaX);
  }

  handleTouchEnd(e) {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    const deltaTime = Date.now() - this.touchStartTime;

    this.hideTouchIndicators();

    if (Math.abs(deltaX) < 10 && deltaY < 10 && deltaTime < this.tapTimeout) {
      this.togglePlayPause();
      return;
    }

    if (
      Math.abs(deltaX) > this.minSwipeDistance &&
      deltaY < this.maxVerticalDistance
    ) {
      if (deltaX > 0) {
        this.previousImage();
      } else {
        this.nextImage();
      }
    }
  }

  showTouchFeedback(x) {
    if (!this.touchIndicatorLeft || !this.touchIndicatorRight) return;

    const containerRect = this.slideshowContainer.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;

    if (x < centerX) {
      this.touchIndicatorLeft.style.opacity = "0.7";
    } else {
      this.touchIndicatorRight.style.opacity = "0.7";
    }
  }

  updateTouchIndicators(deltaX) {
    if (!this.touchIndicatorLeft || !this.touchIndicatorRight) return;

    const opacity = Math.min(Math.abs(deltaX) / this.minSwipeDistance, 1) * 0.7;

    if (deltaX > 0) {
      this.touchIndicatorLeft.style.opacity = opacity.toString();
      this.touchIndicatorRight.style.opacity = "0";
    } else {
      this.touchIndicatorRight.style.opacity = opacity.toString();
      this.touchIndicatorLeft.style.opacity = "0";
    }
  }

  hideTouchIndicators() {
    if (this.touchIndicatorLeft) this.touchIndicatorLeft.style.opacity = "0";
    if (this.touchIndicatorRight) this.touchIndicatorRight.style.opacity = "0";
  }

  startSlideshow() {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
    }

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    const intervalTime = 5000; // 5 seconds
    this.progressStartTime = Date.now();

    this.slideshowInterval = setInterval(() => {
      if (this.isPlaying && this.images.length > 0) {
        this.nextImage();
      }
    }, intervalTime);

    this.progressInterval = setInterval(() => {
      if (this.isPlaying && this.images.length > 0) {
        const elapsed = Date.now() - this.progressStartTime;
        const progress = Math.min((elapsed / intervalTime) * 100, 100);
        if (this.progressFill) this.progressFill.style.width = `${progress}%`;

        if (progress >= 100) {
          this.progressStartTime = Date.now();
        }
      }
    }, 50);
  }

  resetProgress() {
    this.progressStartTime = Date.now();
    if (this.progressFill) this.progressFill.style.width = "0%";
  }

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.startSlideshow();
      if (this.playIcon) this.playIcon.classList.add("hidden");
      if (this.pauseIcon) this.pauseIcon.classList.remove("hidden");
    } else {
      this.stopSlideshow();
      if (this.playIcon) this.playIcon.classList.remove("hidden");
      if (this.pauseIcon) this.pauseIcon.classList.add("hidden");
      if (this.progressFill) this.progressFill.style.width = "0%";
    }
  }

  stopSlideshow() {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = null;
    }

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  async updateWeather() {
    try {
      const response = await fetch("/api/weather");
      const weather = await response.json();

      if (this.temperatureEl)
        this.temperatureEl.textContent = `${Math.round(weather.temperature)}°F`;
      if (this.descriptionEl)
        this.descriptionEl.textContent = weather.description;
      if (this.locationEl) this.locationEl.textContent = weather.location;
      if (this.feelsLikeEl)
        this.feelsLikeEl.textContent = `${Math.round(weather.feelsLike)}°F`;
      if (this.humidityEl) this.humidityEl.textContent = `${weather.humidity}%`;
      if (this.windSpeedEl)
        this.windSpeedEl.textContent = `${Math.round(weather.windSpeed)} mph`;
      if (this.pressureEl)
        this.pressureEl.textContent = `${(weather.pressure * 0.02953).toFixed(
          2
        )} inHg`;

      if (weather.icon && this.weatherIconEl) {
        this.weatherIconEl.src = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
        this.weatherIconEl.style.display = "block";
      }

      if (this.weatherStatusEl)
        this.weatherStatusEl.className =
          "w-2 h-2 rounded-full bg-green-500 mr-2";
      if (this.weatherStatusTextEl)
        this.weatherStatusTextEl.textContent = "Connected";
    } catch (error) {
      console.error("Failed to update weather:", error);
      if (this.weatherStatusEl)
        this.weatherStatusEl.className = "w-2 h-2 rounded-full bg-red-500 mr-2";
      if (this.weatherStatusTextEl)
        this.weatherStatusTextEl.textContent = "Error";
    }
  }

  async updateStatus() {
    try {
      const response = await fetch("/api/status");
      const status = await response.json();

      if (status.email.connected) {
        if (this.emailStatusEl)
          this.emailStatusEl.className =
            "w-2 h-2 rounded-full bg-green-500 mr-2";
        if (this.emailStatusTextEl)
          this.emailStatusTextEl.textContent = "Connected";
      } else {
        if (this.emailStatusEl)
          this.emailStatusEl.className = "w-2 h-2 rounded-full bg-red-500 mr-2";
        if (this.emailStatusTextEl)
          this.emailStatusTextEl.textContent = "Disconnected";
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  updateClock() {
    const now = new Date();

    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    const dateOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    if (this.currentTimeEl)
      this.currentTimeEl.textContent = now.toLocaleTimeString(
        "en-US",
        timeOptions
      );
    if (this.currentDateEl)
      this.currentDateEl.textContent = now.toLocaleDateString(
        "en-US",
        dateOptions
      );
  }
}

// Start the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new SlideshowWeatherApp();
});
