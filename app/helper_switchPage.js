// Asynchronously fetch city data and filter based on the presence of tracks or stations
async function getCities(filter = '') {
    // Fetch the required data for cities, tracks, and stations
    const { cities, tracks, stations } = await getData(['cities', 'tracks', 'stations']);

    // Clear the cities list in the HTML
    const citiesList = document.getElementById('cities-list');
    citiesList.innerHTML = '';

    // Merge cities data with tracks and stations data
    const mergedDataCitiesTracks = mergeDataByCity(cities, tracks, 'tracks', true);
    const mergedDataCitiesStations = mergeDataByCity(cities, stations, 'stations', true);

    // Filter cities that have tracks or stations
    let citiesNew = cities.filter(city => {
        const hasTracks = mergedDataCitiesTracks.some(d => d.id === city.id && d.tracks.length > 0);
        const hasStations = mergedDataCitiesStations.some(d => d.id === city.id && d.stations.length > 0);
        return hasTracks || hasStations;
    });

    // Sort the filtered cities by name
    citiesNew = sortByAttribute(citiesNew, 'name', true);

    // Create list items for each city that matches the filter and append them to the cities list
    citiesNew.forEach(d => {
        if (d.name.toLowerCase().includes(filter.toLowerCase()) || d.country.toLowerCase().includes(filter.toLowerCase())) {
            const listItem = document.createElement('button');
            listItem.className = 'list-group-item';
            listItem.textContent = `${d.name}, ${d.country}`;
            listItem.id = `grad-${d.id}`;
            listItem.addEventListener('click', () => chooseCity(d));
            citiesList.appendChild(listItem);
        }
    });
}

// Read the input value from the search form and fetch cities based on that input
async function readInput() {
    const form = document.querySelector('form');
    const input = form.querySelector('input[type="search"]').value;
    await getCities(input);
}

// Add event listener to the search form to handle the submit event
document.querySelector('form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission
    readInput(); // Read the input and fetch cities
});

// Fetch cities when the script is initially loaded
getCities();

// Save the selected city to session storage and navigate to the city page
async function chooseCity(city) {
    sessionStorage.setItem('selectedCity', JSON.stringify(city));
    window.location.href = "city.html"; // Navigate to the city page
}

// Extract coordinates from the city object and add them as separate properties
async function getCoordinates(city) {
    let coordinates = city.coords.replace("POINT(", "").replace(")", "");
    let parts = coordinates.split(" ");
    let longitude = parseFloat(parts[0]);
    let latitude = parseFloat(parts[1]);
    city.long = longitude;
    city.lat = latitude;
}

// Handle the dark mode toggle and apply the corresponding styles
document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    let navbar = document.querySelector('.navbar');
    let offcanvas = document.querySelector('.offcanvas');
    let input = document.querySelector('input[type="search"]');

    // Check the saved dark mode preference and apply it
    if (localStorage.getItem('darkMode') === 'enabled') {
        enableDarkMode();
        darkModeToggle.checked = true;
    } else {
        disableDarkMode();
        darkModeToggle.checked = false;
    }

    // Add event listener to the dark mode toggle switch
    darkModeToggle.addEventListener('change', function () {
        if (darkModeToggle.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });

    // Enable dark mode and update styles
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        navbar.classList.add('bg-dark', 'navbar-dark');
        navbar.classList.remove('bg-body-tertiary', 'navbar-light');
        offcanvas.classList.add('bg-dark');
        offcanvas.classList.remove('bg-body-tertiary');
        input.classList.add('bg-dark', 'text-light');
        input.classList.remove('bg-body-tertiary', 'text-dark');
        localStorage.setItem('darkMode', 'enabled'); // Save the dark mode preference
    }

    // Disable dark mode and update styles
    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        navbar.classList.remove('bg-dark', 'navbar-dark');
        navbar.classList.add('bg-body-tertiary', 'navbar-light');
        offcanvas.classList.remove('bg-dark');
        offcanvas.classList.add('bg-body-tertiary');
        input.classList.remove('bg-dark', 'text-light');
        input.classList.add('bg-body-tertiary', 'text-dark');
        localStorage.setItem('darkMode', 'disabled'); // Save the dark mode preference
    }
});
