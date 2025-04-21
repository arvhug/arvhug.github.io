/* jshint esversion: 9 */
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
  const statsContainer = document.getElementById("stats-container");
  const conflictsSection = document.getElementById("conflicts-section");
  const conflictsList = document.getElementById("conflicts-list");

  let artists = [];
  let conflicts = [];

  // Initialize with one empty artist entry
  addArtistEntry();

  // Add artist input fields
  addArtistBtn.addEventListener("click", addArtistEntry);

  // View toggle
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
      artistEntries.innerHTML = "";
      parsedArtists.forEach((artist) => {
        addArtistToForm(artist);
      });
    }
  });

  // Calculate optimal schedule
  calculateBtn.addEventListener("click", async function() {
    const warningMessage = document.getElementById("warning-message");
    warningMessage.style.display = "none";
    warningMessage.textContent = "";

    // Validate inputs
    const entries = document.querySelectorAll(".artist-entry");
    let invalidFields = false;

    entries.forEach((artistDiv) => {
        const inputs = [
            artistDiv.querySelector(".artist-name"),
            artistDiv.querySelector(".stage"),
            artistDiv.querySelector(".start-time"),
            artistDiv.querySelector(".end-time")
        ];

        inputs.forEach(input => {
            input.classList.remove("invalid");
            if (!input.value) {
                input.classList.add("invalid");
                invalidFields = true;
            }
        });
    });

    if (invalidFields) {
        warningMessage.style.display = "block";
        warningMessage.textContent = "Please fill in all artist details!";
        document.querySelector(".invalid").scrollIntoView({ behavior: "smooth" });
        return;
    }

    // Collect artist data
    artists = Array.from(entries).map(entry => ({
        name: entry.querySelector(".artist-name").value,
        stage: entry.querySelector(".stage").value,
        start: entry.querySelector(".start-time").value,
        end: entry.querySelector(".end-time").value,
        priority: parseInt(entry.querySelector(".priority").value)
    }));

    // Get optimization settings
    const options = {
        travelTime: parseInt(travelTimeInput.value) || 0,
        missTime: parseInt(missTimeInput.value) || 0,
        minAttendance: parseInt(document.getElementById('min-attendance').value) || 30,
        conflictResolution: document.getElementById('conflict-resolution').value,
        allowPartial: document.getElementById('allow-partial').checked
    };

    try {
        const result = await findOptimalSchedule(artists, options.travelTime, options);
        displayResults(result.schedule, result.conflicts, options.travelTime);
    } catch (error) {
        console.error("Error generating schedule:", error);
        warningMessage.style.display = "block";
        warningMessage.textContent = "Error generating schedule. Please check your inputs.";
    }
  });

  function addArtistEntry() {
    const artistDiv = document.createElement("div");
    artistDiv.className = "artist-entry";
    artistDiv.innerHTML = `
        <input type="text" placeholder="Artist name" class="artist-name">
        <input type="text" placeholder="Stage" class="stage">
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

    // Populate time selects
    const interval = 15;
    const startSelect = artistDiv.querySelector(".start-time");
    const endSelect = artistDiv.querySelector(".end-time");
    
    startSelect.innerHTML = '';
    endSelect.innerHTML = '';
    
    for (let hour = 6; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
            const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
            if (!(hour === 23 && minute === 45)) {
                startSelect.add(new Option(time, time));
            }
            endSelect.add(new Option(time, time));
        }
    }

    startSelect.value = "12:00";
    endSelect.value = "13:00";

    function updateEndTimeOptions() {
        const startTime = startSelect.value;
        Array.from(endSelect.options).forEach((option) => {
            option.disabled = option.value <= startTime;
        });

        if (endSelect.value <= startTime) {
            const availableOptions = Array.from(endSelect.options)
                .filter(opt => !opt.disabled);
            if (availableOptions.length > 0) {
                endSelect.value = availableOptions[0].value;
            }
        }
    }

    startSelect.addEventListener("change", updateEndTimeOptions);
    updateEndTimeOptions();

    artistEntries.appendChild(artistDiv);

    artistDiv.querySelector(".remove-artist").addEventListener("click", function() {
        artistDiv.remove();
    });
  }

  function addArtistToForm(artist) {
    const artistDiv = document.createElement("div");
    artistDiv.className = "artist-entry";
    artistDiv.innerHTML = `
        <input type="text" placeholder="Artist name" class="artist-name" value="${artist.name || ""}">
        <input type="text" placeholder="Stage" class="stage" value="${artist.stage || ""}">
        <div class="time-select-container">
            <select class="start-time"></select>
            <select class="end-time"></select>
        </div>
        <select class="priority">
            <option value="1" ${artist.priority == 1 ? "selected" : ""}>Must see</option>
            <option value="2" ${artist.priority == 2 ? "selected" : ""}>High priority</option>
            <option value="3" ${artist.priority == 3 || !artist.priority ? "selected" : ""}>Medium priority</option>
            <option value="4" ${artist.priority == 4 ? "selected" : ""}>Low priority</option>
        </select>
        <button class="remove-artist"><i class="fas fa-times"></i></button>
    `;

    const startSelect = artistDiv.querySelector(".start-time");
    const endSelect = artistDiv.querySelector(".end-time");
    
    const interval = 15;
    for (let hour = 6; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += interval) {
            const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
            if (!(hour === 23 && minute === 45)) {
                startSelect.add(new Option(time, time));
            }
            endSelect.add(new Option(time, time));
        }
    }

    startSelect.value = artist.start || "12:00";
    endSelect.value = artist.end || "13:00";

    function updateEndTimeOptions() {
        Array.from(endSelect.options).forEach((option) => {
            option.disabled = option.value <= startSelect.value;
        });
    }
    startSelect.addEventListener("change", updateEndTimeOptions);
    updateEndTimeOptions();

    artistEntries.appendChild(artistDiv);

    artistDiv.querySelector(".remove-artist").addEventListener("click", function() {
        artistDiv.remove();
    });
  }

  function parsePastedData(text) {
    if (!text.trim()) return [];

    const lines = text.split("\n").filter((line) => line.trim());
    const artists = [];

    lines.forEach((line) => {
      const parts = line.split(/\||\t|,/).map((part) => part.trim()).filter((part) => part);

      if (parts.length >= 3) {
        const artist = {
          name: parts[0],
          stage: parts[1],
          start: formatTimeInput(parts[2]),
          end: formatTimeInput(parts[3]),
          priority: parseInt(parts[4]) || 3,
        };

        if (artist.start && artist.end) {
          artists.push(artist);
        }
      }
    });

    return artists;
  }

  function formatTimeInput(timeStr) {
    if (!timeStr) return "";

    const time = timeStr.replace(/[^0-9:]/g, "");
    const [hours, mins] = time.split(":");

    if (!hours) return "";

    let formattedHours = parseInt(hours);
    let formattedMins = mins ? parseInt(mins) : 0;

    if (timeStr.toLowerCase().includes("pm") && formattedHours < 12) {
      formattedHours += 12;
    }
    if (timeStr.toLowerCase().includes("am") && formattedHours === 12) {
      formattedHours = 0;
    }

    return `${formattedHours.toString().padStart(2, "0")}:${formattedMins.toString().padStart(2, "0")}`;
  }

  async function findOptimalSchedule(artists, travelTime, options = {}) {
    const {
        missTime = 0,
        minAttendance = parseInt(document.getElementById('min-attendance').value) || 30,
        conflictResolution = document.getElementById('conflict-resolution').value,
        allowPartial = document.getElementById('allow-partial').checked
    } = options;

    const weightedArtists = artists
        .map((artist) => ({
            ...artist,
            startMinutes: timeToMinutes(artist.start),
            endMinutes: timeToMinutes(artist.end),
            duration: timeToMinutes(artist.end) - timeToMinutes(artist.start),
            weight: calculatePriorityWeight(artist.priority),
            valuePerMinute: calculatePriorityWeight(artist.priority) / 
                          (timeToMinutes(artist.end) - timeToMinutes(artist.start))
        }))
        .filter((a) => !isNaN(a.startMinutes) && !isNaN(a.endMinutes));

    let sortedByStart = [...weightedArtists].sort((a, b) => a.startMinutes - b.startMinutes);

    const schedule = [];
    const conflicts = [];
    let currentTime = 0;
    let currentStage = null;
    
    while (sortedByStart.length > 0) {
        const candidates = sortedByStart.filter(artist => 
            artist.endMinutes > currentTime && 
            (artist.startMinutes < (currentTime + (artist.stage !== currentStage ? travelTime : 0) || 
             artist.startMinutes >= currentTime)
        ));
        
        if (candidates.length === 0) {
            const nextEvent = sortedByStart.shift();
            currentTime = nextEvent.startMinutes;
            currentStage = nextEvent.stage;
            continue;
        }
        
        let bestCandidate = null;
        let bestValue = 0;
        let bestLeaveTime = 0;
        let bestArrivalTime = 0;
        let bestMissedStart = 0;
        
        for (const candidate of candidates) {
            const arrivalTime = currentStage === candidate.stage ? 
                currentTime : 
                Math.max(currentTime + travelTime, candidate.startMinutes);
            
            const availableTime = candidate.endMinutes - arrivalTime;
            
            if (availableTime < minAttendance) continue;
            
            const missedStart = arrivalTime - candidate.startMinutes;
            const value = candidate.valuePerMinute * availableTime;
            
            if (value > bestValue) {
                bestValue = value;
                bestCandidate = candidate;
                bestLeaveTime = candidate.endMinutes;
                bestArrivalTime = arrivalTime;
                bestMissedStart = missedStart;
            }
        }
        
        if (bestCandidate) {
            const conflictingEvent = schedule.find(event => 
                bestArrivalTime < event.actualEndMinutes && 
                bestLeaveTime > event.actualStartMinutes
            );
            
            if (conflictingEvent) {
                if (conflictResolution === 'interactive') {
                    const userChoice = await showConflictDialog(conflictingEvent, {
                        ...bestCandidate,
                        actualStartMinutes: bestArrivalTime,
                        actualEndMinutes: bestLeaveTime
                    });
                    
                    if (userChoice === 'keep-existing') {
                        sortedByStart = sortedByStart.filter(a => a !== bestCandidate);
                        conflicts.push(bestCandidate);
                        continue;
                    } else if (userChoice === 'partial-existing') {
                        conflictingEvent.actualEndMinutes = bestArrivalTime;
                        conflictingEvent.duration = conflictingEvent.actualEndMinutes - conflictingEvent.actualStartMinutes;
                        conflictingEvent.isPartial = true;
                        conflictingEvent.partialReason = 'left-early';
                    } else if (userChoice === 'partial-new') {
                        bestLeaveTime = conflictingEvent.actualStartMinutes;
                        bestArrivalTime = Math.min(bestArrivalTime, bestLeaveTime - minAttendance);
                    }
                } else {
                    if (bestCandidate.weight > conflictingEvent.weight) {
                        conflictingEvent.actualEndMinutes = bestArrivalTime;
                        conflictingEvent.duration = conflictingEvent.actualEndMinutes - conflictingEvent.actualStartMinutes;
                        conflictingEvent.isPartial = true;
                        conflictingEvent.partialReason = 'left-early';
                    } else {
                        sortedByStart = sortedByStart.filter(a => a !== bestCandidate);
                        conflicts.push(bestCandidate);
                        continue;
                    }
                }
            }
            
            const attendedDuration = bestLeaveTime - bestArrivalTime;
            schedule.push({
                ...bestCandidate,
                actualStartMinutes: bestArrivalTime,
                actualEndMinutes: bestLeaveTime,
                attendedDuration: attendedDuration,
                missedStart: bestMissedStart,
                isPartial: attendedDuration < bestCandidate.duration,
                partialReason: attendedDuration < bestCandidate.duration ? 
                    (bestMissedStart > 0 ? 'arrived-late' : 'left-early') : null
            });
            
            currentTime = bestLeaveTime;
            currentStage = bestCandidate.stage;
            sortedByStart = sortedByStart.filter(a => a !== bestCandidate);
        } else {
            const nextEvent = sortedByStart.shift();
            currentTime = nextEvent.startMinutes;
            currentStage = nextEvent.stage;
        }
    }
    
    return { schedule, conflicts };
  }

  function calculatePriorityWeight(priority) {
    return Math.pow(2, 5 - priority);
  }

  async function showConflictDialog(existingEvent, newEvent) {
    const modal = document.getElementById('conflict-modal');
    const existingEl = modal.querySelector('.existing-event');
    const newEl = modal.querySelector('.new-event');
    
    existingEl.querySelector('.event-name').textContent = existingEvent.name;
    existingEl.querySelector('.event-time').textContent = 
        `${minutesToTime(existingEvent.actualStartMinutes)} - ${minutesToTime(existingEvent.actualEndMinutes)}`;
    existingEl.querySelector('.event-priority').textContent = 
        `Priority: ${getPriorityName(existingEvent.priority)}`;
    
    newEl.querySelector('.event-name').textContent = newEvent.name;
    newEl.querySelector('.event-time').textContent = 
        `${minutesToTime(newEvent.actualStartMinutes)} - ${minutesToTime(newEvent.actualEndMinutes)}`;
    newEl.querySelector('.event-priority').textContent = 
        `Priority: ${getPriorityName(newEvent.priority)}`;
    
    modal.style.display = 'flex';
    
    return new Promise(resolve => {
        modal.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', function handler() {
                const choice = this.dataset.choice;
                modal.style.display = 'none';
                resolve(choice);
                modal.querySelectorAll('.option-btn').forEach(b => {
                    b.removeEventListener('click', handler);
                });
            });
        });
    });
  }

  function displayResults(schedule, conflicts, travelTime) {
    // Clear previous results
    calendarView.innerHTML = '<div id="timeline-header" class="timeline-header"></div><div id="timeline-grid" class="timeline-grid"></div>';
    listView.innerHTML = '<div id="schedule-list"></div>';
    statsContainer.innerHTML = '';
    conflictsList.innerHTML = '';

    if (schedule.length === 0) {
      document.getElementById('schedule-list').innerHTML = `
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

    // Get timeline elements after recreating them
    const timelineHeader = document.getElementById('timeline-header');
    const timelineGrid = document.getElementById('timeline-grid');
    const scheduleList = document.getElementById('schedule-list');

    // Get min and max times
    const minHour = Math.floor(Math.min(...schedule.map(a => a.actualStartMinutes - (a.travelTimeBefore || 0)) / 60));
    const maxHour = Math.ceil(Math.max(...schedule.map(a => a.actualEndMinutes)) / 60);

    // Create time column
    for (let hour = Math.max(0, Math.floor(minHour)); hour <= Math.min(23, Math.ceil(maxHour)); hour++) {
      const hourSlot = document.createElement("div");
      hourSlot.className = "time-slot";
      hourSlot.textContent = `${hour.toString().padStart(2, "0")}:00`;
      hourSlot.style.height = "60px";
      timelineHeader.appendChild(hourSlot);
    }

    // Create stages
    const stages = [...new Set(schedule.map(item => item.stage || "Main Stage"))];
    const stagesRow = document.createElement("div");
    stagesRow.className = "stages-row";

    stages.forEach((stage) => {
      const stageColumn = document.createElement("div");
      stageColumn.className = "stage-column";

      const stageHeader = document.createElement("div");
      stageHeader.className = "stage-header";
      stageHeader.textContent = stage;
      stageColumn.appendChild(stageHeader);

      const stageEvents = document.createElement("div");
      stageEvents.className = "stage-events";
      stageEvents.style.height = `${(Math.ceil(maxHour) - Math.max(0, Math.floor(minHour))) * 60}px`;

      // Add hour markers
      for (let hour = Math.max(0, Math.floor(minHour)); hour <= Math.ceil(maxHour); hour++) {
        const hourMarker = document.createElement("div");
        hourMarker.className = "hour-marker";
        hourMarker.style.top = `${(hour - Math.max(0, Math.floor(minHour))) * 60}px`;
        stageEvents.appendChild(hourMarker);
      }

      // Add artist events
      schedule.filter(artist => (artist.stage || "Main Stage") === stage).forEach((artist) => {
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

    timelineGrid.appendChild(stagesRow);

    // Create list view
    stages.forEach((stage) => {
      const stageHeader = document.createElement("h3");
      stageHeader.className = "stage-header-list";
      stageHeader.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${stage}`;
      scheduleList.appendChild(stageHeader);

      schedule.filter(a => (a.stage || "Main Stage") === stage).forEach((artist) => {
        const artistBlock = document.createElement("div");
        artistBlock.className = "artist-block";

        artistBlock.innerHTML = `
          <div class="artist-time">
              ${minutesToTime(artist.actualStartMinutes)} - ${minutesToTime(artist.actualEndMinutes)}
              <span class="duration">(${artist.duration} min)</span>
          </div>
          <div class="artist-info ${getPriorityClass(artist.priority)}">
              <div class="artist-name">${artist.name}</div>
              <div class="artist-priority">${getPriorityName(artist.priority)}</div>
              ${artist.missedMinutes > 0 ? `<div class="missed-time">(Misses first ${artist.missedMinutes} min)</div>` : ""}
          </div>
        `;

        scheduleList.appendChild(artistBlock);

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

    // Display conflicts
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
      const firstStart = Math.min(...schedule.map(a => a.actualStartMinutes - (a.travelTimeBefore || 0)));
      const lastEnd = Math.max(...schedule.map(a => a.actualEndMinutes));
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
      efficiency: totalAvailableTime > 0 ? Math.round((totalDuration / totalAvailableTime) * 100) : 0,
    };
  }

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