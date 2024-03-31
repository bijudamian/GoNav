// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
 apiKey: "AIzaSyCEJDriMEXoMhSQZs7-EPJK4Fz4Sau62aE",
 authDomain: "gonav-ef869.firebaseapp.com",
 databaseURL: "https://gonav-ef869-default-rtdb.firebaseio.com",
 projectId: "gonav-ef869",
 storageBucket: "gonav-ef869.appspot.com",
 messagingSenderId: "334594844004",
 appId: "1:334594844004:web:70eaf6c75118d7e0f38671",
 measurementId: "G-033VR0EGQC"
};

// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13); // Set the initial view to a specific location

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app); // Use firestore instead of db

//----------------------------------------------------------------------------------------
// Initialize a marker for the user
var userMarker = null;

// Function to update the map with the user's location
function updateUserLocation(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Remove the existing user marker if it exists
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    // Add a new marker at the user's current location
    userMarker = L.marker([lat, lon]).addTo(map);

    // Optionally, you can also update the map view to center on the user's location
    map.setView([lat, lon], 8); // Adjust the zoom level as needed
}

// Request the user's location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(updateUserLocation, showError);
} else {
    console.log("Geolocation is not supported by this browser.");
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            break;
    }
}
//---------------------------added a default user location marker-------------------------------------------------------

// Add event listener to the form
const trackForm = document.getElementById('trackForm');
const busIdInput = document.getElementById('bus-id');

trackForm.addEventListener('submit', async (e) => {
 e.preventDefault();
 const busNumber = busIdInput.value.trim(); // Capture the bus number from the input
 if (busNumber !== '') {
    // Query Firestore for the bus location
    const docRef = doc(firestore, 'locations', busNumber); // Reference the specific document using busNumber
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        // Extract latitude and longitude from the document
        const data = docSnap.data();
        const latitude = data.latitude;
        const longitude = data.longitude;
        // Update the map with the new location
        updateMap(latitude, longitude);
      } else {
        alert('No such document!');
      }
    }).catch((error) => {
      console.log("Error getting document:", error);
    });
 }
});

//---------------------------Function to update the map with the new location-------------------------------------------------------
async function updateBusLocation() {
 const busNumber = busIdInput.value.trim(); // Use the bus number from the input
 if (busNumber !== '') {
      // Query Firestore for the bus location
      const docRef = doc(firestore, 'locations', busNumber); // Reference the specific document using busNumber
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const latitude = data.latitude;
          const longitude = data.longitude;
          updateMap(latitude, longitude);
        } else {
          alert('Bus has not started yet!');
        }
      }).catch((error) => {
        console.log("Error getting document:", error);
      });
 }
}

// Call updateBusLocation every 10 seconds
setInterval(updateBusLocation, 20000); // 1000 milliseconds = 1 seconds

//------------------------------------Drawing line and two markers in a map--------------------------------------------------------
// Placeholder for the route line
let routeLine = null;
let routeControl = null;
// Initialize a marker for the bus
var busMarker = L.marker([51.5, -0.09]).addTo(map);

// Function to update the map
function updateMap(latitude, longitude) {
 busMarker.setLatLng([latitude, longitude]);

 const bounds = new L.LatLngBounds([
      [userMarker.getLatLng().lat, userMarker.getLatLng().lng],
      [busMarker.getLatLng().lat, busMarker.getLatLng().lng]
 ]);

 // Adjust the map view to include both markers with an ease-in transition
 map.flyToBounds(bounds, {
      padding: [50, 50], // Optional: Adds padding around the bounds
      duration: 2 // Duration of the animation in seconds
 });

 // Draw the route between the user and the bus
 drawRoute(userMarker.getLatLng(), busMarker.getLatLng());
}

// Function to update the ETA and bus number displayed on the map
function updateBusDetails(busIdInput, eta) {
    document.getElementById('bus-id').textContent = `Bus Number: ${busIdInput}`;
    document.getElementById('etaDisplay').textContent = `ETA: ${eta.toFixed(2)} minutes`;
}

// Function to draw the route between the user and the bus
function drawRoute(userLocation, busLocation) {
 // Remove existing route line if it exists
 if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null; // Reset the routeLine variable
 }

 // Remove existing route control if it exists
 if (routeControl) {
      map.removeControl(routeControl);
      routeControl = null; // Reset the routeControl variable
 }

 // Initialize a new route control with the updated waypoints
 routeControl = L.Routing.control({
      waypoints: [userLocation, busLocation],
      routeWhileDragging: true,
      show: false, // Do not show the control
      createMarker: function() { return null; } // Do not create markers
 }).addTo(map);

 // Fetch the route and add it to the map
 routeControl.on('routeselected', function(e) {
      routeLine = L.polyline(e.route.coordinates, {color: 'black'}).addTo(map);
 });
}