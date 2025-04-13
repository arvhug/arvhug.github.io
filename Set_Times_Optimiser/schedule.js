document.addEventListener("DOMContentLoaded", function () {
  const artistEntries = document.getElementById("artist-entries");
  const addArtistBtn = document.getElementById("add-artist");
  const calculateBtn = document.getElementById("calculate");
  const parseBtn = document.getElementById("parse-btn");
  const pasteData = document.getElementById("paste-data");
  const travelTimeInput = document.getElementById("travel-time");
  const missTimeInput = document.getElementById("miss-time");
  const viewBtns = document.querySelectorAll(".view-btn");
  const calendarView = document.getElementById("calendar-view");
  const listView = document.getElementById("list-view");
  const timelineHeader = document.getElementById("timeline-header");
  const timelineGrid = document.getElementById("timeline-grid");
  const scheduleList = document.getElementById("schedule-list");
  const statsContainer = document.getElementById("stats-container");
  const conflictsSection = document.getElementById("conflicts-section");
  const conflictsList = document.getElementById("conflicts-list");

  let artists = [];
  let conflicts = [];

  // Initialize with one empty artist entry
  addArtistEntry();

  // Add artist input fields
  addArtistBtn.addEventListener("click", addArtistEntry);

  // View toggle - list view is now default
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      viewBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const view = this.dataset.view;
      calendarView.classList.toggle("active", view === "calendar");
      listView.classList.toggle("active", view === "list");
    });
  });

  // Parse pasted data
  parseBtn.addEventListener("click", function () {
    const parsedArtists = parsePastedData(pasteData.value);
    if (parsedArtists.length > 0) {
      // Clear existing entries
      artistEntries.innerHTML = "";

      // Add parsed artists to the form
      parsedArtists.forEach((artist) => {
        addArtistToForm(artist);
      });
    }
  });

  // Calculate optimal schedule
  calculateBtn.addEventListener("click", function () {
    // Reset warning message
    const warningMessage = document.getElementById("warning-message");
    warningMessage.style.display = "none";
    warningMessage.textContent = "";

    // Collect all artist data
    const entries = document.querySelectorAll(".artist-entry");

    // Validate inputs
    let invalidFields = false;

    entries.forEach((artistDiv) => {
      const nameInput = artistDiv.querySelector(".artist-name");
      const stageInput = artistDiv.querySelector(".stage");
      const startTimeInput = artistDiv.querySelector(".start-time");
      const endTimeInput = artistDiv.querySelector(".end-time");

      // Reset highlights
      nameInput.classList.remove("invalid");
      startTimeInput.classList.remove("invalid");
      endTimeInput.classList.remove("invalid");

      // Check for missing values
      let isInvalid = false;
      if (!nameInput.value) {
        nameInput.classList.add("invalid");
        isInvalid = true;
      }

      if (!stageInput.value) {
        stageInput.classList.add("invalid");
        isInvalid = true;
      }

      if (!startTimeInput.value) {
        startTimeInput.classList.add("invalid");
        isInvalid = true;
      }

      if (!endTimeInput.value) {
        endTimeInput.classList.add("invalid");
        isInvalid = true;
      }
      if (!startTimeInput.value) {
        startTimeInput.classList.add("invalid");
        isInvalid = true;
      }

      // Show warning message if any invalid fields
      if (isInvalid) {
        invalidFields = true;
      }
    });

    if (invalidFields) {
      warningMessage.style.display = "block";
      warningMessage.textContent = "Please fill in all artist details!";
      return false;
    }

    // Scheduling
    artists = [];
    const travelTime = parseInt(travelTimeInput.value) || 0;
    const missTime = parseInt(missTimeInput.value) || 0;
    entries.forEach((entry) => {
      artists.push({
        name: entry.querySelector(".artist-name").value,
        stage: entry.querySelector(".stage").value,
        start: entry.querySelector(".start-time").value,
        end: entry.querySelector(".end-time").value,
        priority: parseInt(entry.querySelector(".priority").value),
      });
    });

    // Validate inputs
    // if (
    //   artists.some((artist) => !artist.name || !artist.start || !artist.end)
    // ) {
    //   alert("Please fill in all artist details");
    //   return;
    // }

    // Calculate optimal schedule with travel time and miss time
    const result = findOptimalSchedule(artists, travelTime, missTime);
    const optimalSchedule = result.schedule;
    conflicts = result.conflicts;

    // Display results
    displayResults(optimalSchedule, conflicts, travelTime);
  });

  function addArtistEntry() {
    const artistDiv = document.createElement("div");
    artistDiv.className = "artist-entry";
    artistDiv.innerHTML = `
            <input type="text" placeholder="Artist name" class="artist-name">
            <input type="text" placeholder="Stage" class="stage">
            <!-- <input type="time" class="start-time"> -->
            <!-- <input type="time" class="end-time"> -->
            <div class="time-select-container">
              <select class="start-time"></select>
              <select class="end-time"></select>
            </div>
            <select class="priority">
                <option value="1">Must see</option>
                <option value="2">High priority</option>
                <option value="3" selected>Medium priority</option>
                <option value="4">Low priority</option>
            </select>
            <button class="remove-artist"><i class="fas fa-times"></i></button>
        `;
    // Populate time select in intervals
    const interval = 15; // in minutes
    const startSelect = artistDiv.querySelector(".start-time");
    const endSelect = artistDiv.querySelector(".end-time");
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        if (!(hour === 23 && minute === 45)) {
          startSelect.add(new Option(time, time));
        }
        endSelect.add(new Option(time, time));
      }
    }

    // Disable end time options based on start time
    function updateEndTimeOptions() {
      Array.from(endSelect.options).forEach((option) => {
        option.disabled = option.value < startSelect.value;
      });

      if (endSelect.value < startSelect.value) {
        endSelect.value = startSelect.value;
      }
    }

    startSelect.addEventListener("change", updateEndTimeOptions);
    updateEndTimeOptions();

    artistEntries.appendChild(artistDiv);

    // Add remove functionality
    artistDiv
      .querySelector(".remove-artist")
      .addEventListener("click", function () {
        artistEntries.removeChild(artistDiv);
      });
  }

  function addArtistToForm(artist) {
    const artistDiv = document.createElement("div");
    artistDiv.className = "artist-entry";
    artistDiv.innerHTML = `
            <input type="text" placeholder="Artist name" class="artist-name" value="${artist.name || ""}">
            <input type="text" placeholder="Stage" class="stage" value="${artist.stage || ""}">
            <input type="time" class="start-time" value="${artist.start || ""}">
            <input type="time" class="end-time" value="${artist.end || ""}">
            <select class="priority">
                <option value="1" ${artist.priority == 1 ? "selected" : ""}>Must see</option>
                <option value="2" ${artist.priority == 2 ? "selected" : ""}>High priority</option>
                <option value="3" ${artist.priority == 3 || !artist.priority ? "selected" : ""}>Medium priority</option>
                <option value="4" ${artist.priority == 4 ? "selected" : ""}>Low priority</option>
            </select>
            <button class="remove-artist"><i class="fas fa-times"></i></button>
        `;
    artistEntries.appendChild(artistDiv);

    // Add remove functionality
    artistDiv
      .querySelector(".remove-artist")
      .addEventListener("click", function () {
        artistEntries.removeChild(artistDiv);
      });
  }

  function parsePastedData(text) {
    if (!text.trim()) return [];

    const lines = text.split("\n").filter((line) => line.trim());
    const artists = [];

    lines.forEach((line) => {
      // Try different delimiters (pipe, comma, tab)
      const parts = line
        .split(/\||\t|,/)
        .map((part) => part.trim())
        .filter((part) => part);

      if (parts.length >= 3) {
        const artist = {
          name: parts[0],
          stage: parts[1],
          start: formatTimeInput(parts[2]),
          end: formatTimeInput(parts[3]),
          priority: parseInt(parts[4]) || 3,
        };

        // Basic validation
        if (artist.start && artist.end) {
          artists.push(artist);
        }
      }
    });

    return artists;
  }

  function formatTimeInput(timeStr) {
    if (!timeStr) return "";

    // Handle various time formats
    const time = timeStr.replace(/[^0-9:]/g, "");
    const [hours, mins] = time.split(":");

    if (!hours) return "";

    let formattedHours = parseInt(hours);
    let formattedMins = mins ? parseInt(mins) : 0;

    // Handle PM times without colon (e.g. "800pm")
    if (timeStr.toLowerCase().includes("pm") && formattedHours < 12) {
      formattedHours += 12;
    }
    // Handle AM times (e.g. "12am" should be 00:00)
    if (timeStr.toLowerCase().includes("am") && formattedHours === 12) {
      formattedHours = 0;
    }

    return `${formattedHours.toString().padStart(2, "0")}:${formattedMins.toString().padStart(2, "0")}`;
  }

  function findOptimalSchedule(artists, travelTime, missTime = 0) {
    // Convert to minutes and add priority weights
    const weightedArtists = artists
      .map((artist) => ({
        ...artist,
        startMinutes: timeToMinutes(artist.start),
        endMinutes: timeToMinutes(artist.end),
        duration: timeToMinutes(artist.end) - timeToMinutes(artist.start),
        weight: calculatePriorityWeight(artist.priority),
      }))
      .filter((a) => !isNaN(a.startMinutes) && !isNaN(a.endMinutes));

    // Sort by end time for interval scheduling
    const sortedByEnd = [...weightedArtists].sort(
      (a, b) => a.endMinutes - b.endMinutes,
    );

    // Greedy algorithm with priority consideration and miss time
    const schedule = [];
    const conflicts = [];
    let lastEndTime = 0;
    let lastStage = null;

    while (sortedByEnd.length > 0) {
      // Find next compatible artist with highest weight considering miss time
      let bestIndex = -1;
      let bestScore = -1;
      let bestGap = 0;

      for (let i = 0; i < sortedByEnd.length; i++) {
        const artist = sortedByEnd[i];
        const requiredGap =
          lastStage && artist.stage !== lastStage ? travelTime : 0;

        // Calculate how much we'd need to miss (if any)
        const missAmount = Math.max(
          0,
          lastEndTime + requiredGap - artist.startMinutes,
        );

        // Only consider if we're willing to miss this much time
        if (missAmount <= missTime) {
          const adjustedStart = artist.startMinutes + missAmount;
          const score = artist.weight * (1 + artist.duration / 240); // 4hr max duration

          if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
            bestGap = requiredGap;
          }
        }
      }

      if (bestIndex === -1) {
        // No compatible artists found - add remaining to conflicts
        sortedByEnd.forEach((artist) => {
          conflicts.push({
            ...artist,
            start: minutesToTime(artist.startMinutes),
            end: minutesToTime(artist.endMinutes),
          });
        });
        break;
      }

      const selectedArtist = sortedByEnd[bestIndex];
      const actualStart = Math.max(
        selectedArtist.startMinutes,
        lastEndTime + bestGap,
      );
      const missedMinutes = Math.max(
        0,
        lastEndTime + bestGap - selectedArtist.startMinutes,
      );

      schedule.push({
        ...selectedArtist,
        travelTimeBefore: bestGap,
        actualStartMinutes: actualStart,
        actualEndMinutes: actualStart + selectedArtist.duration,
        missedMinutes: missedMinutes,
      });

      lastEndTime = actualStart + selectedArtist.duration;
      lastStage = selectedArtist.stage;
      sortedByEnd.splice(bestIndex, 1);
    }

    return { schedule, conflicts };
  }

  function calculatePriorityWeight(priority) {
    // Exponential weighting for higher priority items
    return Math.pow(2, 5 - priority); // 16 for must-see, 8 for high, etc.
  }

  function displayResults(schedule, conflicts, travelTime) {
    timelineHeader.innerHTML = "";
    timelineGrid.innerHTML = "";
    scheduleList.innerHTML = "";
    statsContainer.innerHTML = "";
    conflictsList.innerHTML = "";

    if (schedule.length === 0) {
      scheduleList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Valid Schedule Found</h3>
                    <p>Try adjusting your priorities or reducing travel time constraints.</p>
                </div>
            `;
      return;
    }

    // Calculate statistics
    const stats = calculateStats(schedule, travelTime);

    // Display statistics
    statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${schedule.length}</div>
                <div class="stat-label">Artists</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalDuration} min</div>
                <div class="stat-label">Music Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.travelTime} min</div>
                <div class="stat-label">Travel Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.efficiency}%</div>
                <div class="stat-label">Schedule Efficiency</div>
            </div>
        `;

    // Create vertical timeline view
    const container = document.createElement("div");
    container.className = "timeline-container";

    // Create time column
    const timeColumn = document.createElement("div");
    timeColumn.className = "time-column";

    // Get min and max times to determine our time range
    const minHour = Math.floor(
      Math.min(
        ...schedule.map(
          (a) => a.actualStartMinutes - (a.travelTimeBefore || 0),
        ),
      ) / 60,
    );
    const maxHour = Math.ceil(
      Math.max(...schedule.map((a) => a.actualEndMinutes)) / 60,
    );

    // Add time slots for our actual time range
    for (
      let hour = Math.max(0, Math.floor(minHour));
      hour <= Math.min(23, Math.ceil(maxHour));
      hour++
    ) {
      const hourSlot = document.createElement("div");
      hourSlot.className = "time-slot";
      hourSlot.textContent = `${hour.toString().padStart(2, "0")}:00`;
      hourSlot.style.height = "60px";
      timeColumn.appendChild(hourSlot);
    }
    container.appendChild(timeColumn);

    // Create stages container
    const stagesContainer = document.createElement("div");
    stagesContainer.className = "stages-container";
    const stagesRow = document.createElement("div");
    stagesRow.className = "stages-row";

    const stages = [
      ...new Set(schedule.map((item) => item.stage || "Main Stage")),
    ];

    stages.forEach((stage) => {
      const stageColumn = document.createElement("div");
      stageColumn.className = "stage-column";

      // Stage header
      const stageHeader = document.createElement("div");
      stageHeader.className = "stage-header";
      stageHeader.textContent = stage;
      stageColumn.appendChild(stageHeader);

      // Stage events container
      const stageEvents = document.createElement("div");
      stageEvents.className = "stage-events";
      stageEvents.style.height = `${(Math.ceil(maxHour) - Math.max(0, Math.floor(minHour))) * 60}px`;

      // Add hour markers
      for (
        let hour = Math.max(0, Math.floor(minHour));
        hour <= Math.ceil(maxHour);
        hour++
      ) {
        const hourMarker = document.createElement("div");
        hourMarker.className = "hour-marker";
        hourMarker.style.top = `${(hour - Math.max(0, Math.floor(minHour))) * 60}px`;
        stageEvents.appendChild(hourMarker);

        if (hour > Math.max(0, Math.floor(minHour))) {
          const hourLabel = document.createElement("div");
          hourLabel.className = "hour-label";
          hourLabel.textContent = `${hour.toString().padStart(2, "0")}:00`;
          hourLabel.style.top = `${(hour - Math.max(0, Math.floor(minHour))) * 60}px`;
          stageEvents.appendChild(hourLabel);
        }
      }

      // Add artist events for this stage
      schedule
        .filter((artist) => (artist.stage || "Main Stage") === stage)
        .forEach((artist) => {
          const event = document.createElement("div");
          event.className = `calendar-event ${getPriorityClass(artist.priority)}`;
          event.style.top = `${artist.actualStartMinutes - Math.max(0, Math.floor(minHour)) * 60}px`;
          event.style.height = `${artist.duration}px`;
          event.innerHTML = `
                        <div class="event-time">${minutesToTime(artist.actualStartMinutes)} - ${minutesToTime(artist.actualEndMinutes)}</div>
                        <div class="event-name">${artist.name}</div>
                        ${artist.missedMinutes > 0 ? `<div class="missed-indicator">Missed first ${artist.missedMinutes}min</div>` : ""}
                    `;
          stageEvents.appendChild(event);

          // Add travel time if needed
          const nextArtist = schedule[schedule.indexOf(artist) + 1];
          if (nextArtist && nextArtist.travelTimeBefore > 0) {
            const travel = document.createElement("div");
            travel.className = "travel-event";
            travel.innerHTML = `<i class="fas fa-walking"></i> ${nextArtist.travelTimeBefore} min`;
            travel.style.top = `${artist.actualEndMinutes - Math.max(0, Math.floor(minHour)) * 60}px`;
            stageEvents.appendChild(travel);
          }
        });

      stageColumn.appendChild(stageEvents);
      stagesRow.appendChild(stageColumn);
    });

    stagesContainer.appendChild(stagesRow);
    container.appendChild(stagesContainer);
    calendarView.appendChild(container);

    // Create list view
    stages.forEach((stage) => {
      const stageHeader = document.createElement("h3");
      stageHeader.className = "stage-header-list";
      stageHeader.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${stage}`;
      scheduleList.appendChild(stageHeader);

      const stageArtists = schedule.filter(
        (a) => (a.stage || "Main Stage") === stage,
      );

      stageArtists.forEach((artist) => {
        const artistBlock = document.createElement("div");
        artistBlock.className = "artist-block";

        let missedTimeHtml = "";
        if (artist.missedMinutes > 0) {
          missedTimeHtml = `<div class="missed-time">(Misses first ${artist.missedMinutes} min)</div>`;
        }

        artistBlock.innerHTML = `
                    <div class="artist-time">
                        ${minutesToTime(artist.actualStartMinutes)} - ${minutesToTime(artist.actualEndMinutes)}
                        <span class="duration">(${artist.duration} min)</span>
                    </div>
                    <div class="artist-info ${getPriorityClass(artist.priority)}">
                        <div class="artist-name">${artist.name}</div>
                        <div class="artist-priority">${getPriorityName(artist.priority)}</div>
                        ${missedTimeHtml}
                    </div>
                `;

        scheduleList.appendChild(artistBlock);

        // Add travel time if needed
        const nextArtist = schedule[schedule.indexOf(artist) + 1];
        if (nextArtist && nextArtist.travelTimeBefore > 0) {
          const travelBlock = document.createElement("div");
          travelBlock.className = "travel-block";
          travelBlock.innerHTML = `
                        <i class="fas fa-walking"></i>
                        ${nextArtist.travelTimeBefore} min travel to ${nextArtist.stage || "Main Stage"}
                    `;
          scheduleList.appendChild(travelBlock);
        }
      });
    });

    // Display conflicts if any
    if (conflicts.length > 0) {
      conflictsSection.style.display = "block";

      conflicts.forEach((conflict) => {
        const conflictItem = document.createElement("div");
        conflictItem.className = "conflict-item";
        conflictItem.innerHTML = `
                    <strong>${conflict.name}</strong> @ ${conflict.stage || "Main Stage"} 
                    (${conflict.start} - ${conflict.end}, ${getPriorityName(conflict.priority)})
                `;
        conflictsList.appendChild(conflictItem);
      });
    } else {
      conflictsSection.style.display = "none";
    }
  }

  function calculateStats(schedule) {
    let totalDuration = 0;
    let travelTime = 0;
    let missedTime = 0;
    let totalAvailableTime = 0;

    if (schedule.length > 0) {
      const firstStart = Math.min(
        ...schedule.map(
          (a) => a.actualStartMinutes - (a.travelTimeBefore || 0),
        ),
      );
      const lastEnd = Math.max(...schedule.map((a) => a.actualEndMinutes));
      totalAvailableTime = lastEnd - firstStart;

      schedule.forEach((artist) => {
        totalDuration += artist.duration;
        travelTime += artist.travelTimeBefore || 0;
        missedTime += artist.missedMinutes || 0;
      });
    }

    return {
      totalDuration,
      travelTime,
      missedTime,
      efficiency:
        totalAvailableTime > 0
          ? Math.round((totalDuration / totalAvailableTime) * 100)
          : 0,
    };
  }

  // Helper functions
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function minutesToTime(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }

  function getPriorityName(level) {
    const names = {
      1: "Must see",
      2: "High priority",
      3: "Medium priority",
      4: "Low priority",
    };
    return names[level] || "Medium priority";
  }

  function getPriorityClass(level) {
    const classes = {
      1: "must-see",
      2: "high-priority",
      3: "medium-priority",
      4: "low-priority",
    };
    return classes[level] || "medium-priority";
  }
});
