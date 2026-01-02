let lines, lineAcr, result, stopTimes, currentLineTrips, stops, fetchOpt, currentService;


function setMode(modeID){
    alert(modeID);
}

async function init(){
    result = await fetch("../GTFS/PID_GTFS_JSON/routes_ex.json");
    lines = await result.json();

    result = await fetch("../GTFS/PID_GTFS_JSON/stop_times_ex.json");
    stopTimes = await result.json();

    result = await fetch("../GTFS/PID_GTFS_JSON/trips_ex.json");
    trips = await result.json();

    result = await fetch("../GTFS/PID_GTFS_JSON/stops_ex.json");
    stops = await result.json();

    result = await fetch("../options.json");
    fetchOpt = await result.json();

    let seznam = "";
    for (let i = 0; i < lines.length; i++) {
        const element = lines[i];
        seznam += `<option value='{"id": "${element.id}", "name": "${element.name}"}'>${element.name}</option>`;
    }

    document.getElementById("tripList").innerHTML = seznam;
}

function getRouteTrips(object){
    object = JSON.parse(object)
    let routeId = object.id;
    console.log(object);
    currentLineTrips = trips.filter((element) => element.routeId == routeId);
    let toAdd = "";
    let startStops = [];
    for (let i = 0; i < currentLineTrips.length; i++) {
        const trip = currentLineTrips[i];
        startStops.push(stopTimes.filter((element) => element.tripId == trip.tripId)[0]);
    }
    for (let i = 0; i < startStops.length; i++) {
        const start = startStops[i];
        let stop = stops.filter((stop) => stop.id == start.stopId)[0];
        console.log(stop.name + " " + start.time);
        toAdd += `
            <div class="trip" data-tripid="${start.tripId}">
                <span class="line">${object.name}</span>
                <span class="startStop">${stop.name}</span>
                <span class="time">${start.time}</span>
                <button onclick='addTrip(this.parentElement)'>Přidej!</button>
            </div>`;
    }
    document.getElementsByClassName("toSelect")[0].innerHTML = toAdd;
}

function addTrip(htmlEl, tripId){
    let toAdd = `<div class="trip" data-tripId="${htmlEl.dataset.tripid}">`;
    for (let i = 0; i < 3; i++) {
        const element = htmlEl.children[i];
        toAdd += element.outerHTML;
    }
    toAdd += "<button onclick='removeTrip(this.parentElement)'>Odeber!</button></div>";
    document.getElementsByClassName("toSelect")[1].innerHTML += toAdd;
    htmlEl.remove();
}

function removeTrip(htmlEl, tripId){
    let toAdd = `<div class="trip" data-tripId="${htmlEl.dataset.tripid}">`;
    for (let i = 0; i < 3; i++) {
        const element = htmlEl.children[i];
        toAdd += element.outerHTML;
    }
    toAdd += "<button onclick='addTrip(this.parentElement)'>Přidej!</button></div>";
    document.getElementsByClassName("toSelect")[0].innerHTML += toAdd;
    htmlEl.remove();
}

async function generateJSON(){
    let childElements = document.getElementsByClassName("toSelect")[1].children;
    const tripsInService = [];
    for (let i = 0; i < childElements.length; i++) {
        const element = childElements[i];
        result = await fetch(`https://api.golemio.cz/v2/gtfs/trips/${element.dataset.tripid}?includeShapes=false&includeStops=true&includeStopTimes=true&includeService=false&includeRoute=true`, fetchOpt);
        tripInfo = await result.json();
        //console.log(tripInfo);
        tripInfo.departure_minutes = toMinutes(tripInfo.stop_times[0].departure_time);
        for (let x = 0; x < tripInfo.stop_times.length; x++) {
            const element = tripInfo.stop_times[x];
            tripInfo.stop_times[x].departure_minutes = toMinutes(tripInfo.stop_times[x].departure_time);
        }
        tripsInService.push(tripInfo);
    }
    tripsInService.sort((a, b) => a.stop_times[0].departure_time < b.stop_times[0].departure_time ? -1 : 1);
    console.log(tripsInService);
    currentService = {
        line: document.getElementById("linka").value.padStart(3, "0"),
        service: document.getElementById("poradi").value.padStart(2, "0"),
        day: document.getElementById("typDne").value.padStart(2, "0"),
        trips: tripsInService
    };
    document.getElementById("result").value = JSON.stringify(currentService);
}

function downloadJSON(){
    const blob = new Blob([JSON.stringify(currentService)], {
      type: "application/json",
    });
    // Create an invisible A element
    const a = document.createElement("a");
    a.style.display = "none";
    document.body.appendChild(a);
      
    // Set the HREF to a Blob representation of the data to be downloaded
    a.href = window.URL.createObjectURL(blob);

    // Use download attribute to set set desired file name
    a.setAttribute("download", `${currentService.line}${currentService.service}${currentService.day}.json`);

    // Trigger the download by simulating click
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
        
}

const toMinutes = time => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};