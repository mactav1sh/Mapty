"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// WORKOUT CLASSES
class Workout {
  date = new Date();
  id = +(Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// Refactored code - App class
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

//********************** APP**************************//

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    this._getLocalStorage();

    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Couldn't get your position");
        }
      );
    }
  }
  _loadMap(position) {
    // current position
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    // displaying map with current position using leaflet
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // adding marker on click
    this.#map.on("click", this._showForm.bind(this));

    // async js at work
    this.#workouts.forEach((work) => {
      this.renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest("div").classList.toggle("form__row--hidden");
    inputElevation.closest("div").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    // helper functions to validate numbers
    const isValid = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));

    const isPositive = (...inputs) => inputs.every((input) => input > 0);

    //getting inputs from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if Running - create a running instance
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !isValid(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert("insert a positive number");
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if Cycling - create a running cyycling
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !isValid(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return alert("insert a positive number");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //Hiding Form and clearing inputs
    this._hideForm();

    // adding workout to the array
    this.#workouts.push(workout);

    //rendering workout marker on map
    this.renderWorkoutMarker(workout);
    //rendering workout on list
    this.renderWorkoutOnList(workout);
    //set local storage
    this._setLocalStorage();
  }

  renderWorkoutMarker(work_out) {
    L.marker(work_out.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          maxHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${work_out.type}-popup`,
        })
      )
      .setPopupContent(
        `${work_out.type === "cycling" ? "🚴‍♀️" : "🏃‍♂️"} ${work_out.description}`
      )
      .openPopup();
  }

  renderWorkoutOnList(work_out) {
    let html = `
    <li class="workout workout--${work_out.type} " data-id="${work_out.id} ">
    <h2 class="workout__title">${work_out.description} </h2>
    <div class="workout__details">
      <span class="workout__icon">${
        work_out.type === "cycling" ? "🚴‍♀️" : "🏃‍♂️"
      } </span>
      <span class="workout__value">${work_out.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${work_out.duration} </span>
      <span class="workout__unit">min</span>
    </div>
   
   `;
    if (work_out.type === "running") {
      html += `<div class="workout__details">
     <span class="workout__icon">⚡️</span>
     <span class="workout__value">${work_out.pace.toFixed(1)}</span>
     <span class="workout__unit">min/km</span>
   </div>
   <div class="workout__details">
     <span class="workout__icon">🦶🏼</span>
     <span class="workout__value">${work_out.cadence}</span>
     <span class="workout__unit">spm</span>
   </div> </li>`;
    }
    if (work_out.type === "cycling") {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${work_out.speed.toFixed(1)} </span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${work_out.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workoutFromArray = this.#workouts.find(
      (work) => work.id === +workoutEl.dataset.id
    );
    this.#map.setView(workoutFromArray.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach((work) => {
      this.renderWorkoutOnList(work);
    });
  }
  // testing public interface
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}
const app = new App();
