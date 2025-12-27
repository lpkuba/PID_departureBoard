let stops = {};
let stopsMap, stopsMappedArray, fuseStops,  fetchOpt, fuse, selectedStop, updateIntervalId;
selectedStop = {};
selectedStop.uniqueName = "Vyber zastávku!";

async function init(){
    let response = await fetch("options.json");
    fetchOpt = await response.json();

    response = await fetch("./src/stops.json");
    stops = await response.json();

    console.log(stops);
    fuse = new Fuse(stops.stopGroups,{
        keys: [{name:'uniqueName', weight: 3}, {name:'stops.altIdosName', weight: 1}],
        threshold: 0.3,
        limit: 10
    });
    setInterval(() => {
        hodiny();
    }, 1000);
}

function saveAsPNG() {
  snapdom.download(document.getElementById("departureBoard"), {
    format: 'png',
    filename: 'odjezdy',
  }).catch(function(err) {
    console.error('Save failed:', err);
  });
}

function searchChanged(){
    console.log("search changed");
    let searchInput = document.getElementById("stopInput").value;
    if(searchInput != ""){
        document.getElementById("searchDropdown").hidden = false;
    }
    else{
        document.getElementById("searchDropdown").hidden = true;
    }
    let searchResult = fuse.search(searchInput).slice(0,10);
    console.log(searchResult);
    updateSearchList(searchResult);
}

function updateSearchList(list){
    document.getElementById("searchDropdown").textContent = "";
    selectedStop = list[0].item;
    document.getElementById("stopResult").innerHTML = selectedStop.cis;
    for (let i = 0; i < list.length; i++) {
        let linky = [];
        const element = list[i].item;
        let newStopElement = document.createElement("div");
        newStopElement.classList.add("stops");
        newStopElement.onclick = function() {updateSearchValue(element.uniqueName)};
        let stopName = document.createElement("span");
        stopName.innerHTML = element.uniqueName;
        let stopLines = document.createElement("span");
        stopLines.classList.add("lines");
        //nested foreache <3
        element.stops.forEach(nastupiste => {
            nastupiste.lines.forEach(linka => {
                if(!linky.includes(linka.name)){
                    linky.push(linka.name);
                }
            });
        });
        linky.forEach(text => {
            stopLines.innerHTML += `${text} `;
        })
        newStopElement.appendChild(stopName);
        newStopElement.appendChild(document.createElement("br"));
        newStopElement.appendChild(stopLines);
        document.getElementById("searchDropdown").appendChild(newStopElement);
    }
}

function updateSearchValue(value){
    document.getElementById("stopInput").value = value;
    searchChanged();
}

function hodiny(){
    const date = new Date();
    let hh = String(date.getHours()).padStart(2, "0");
    let mm = String(date.getMinutes()).padStart(2, "0");
    let ss = String(date.getSeconds()).padStart(2, "0");
    document.getElementById("clock").innerHTML = `${hh}:${mm}:${ss}`;
}

async function getDepartures(){
    clearInterval(updateIntervalId);
    /*const date = new Date();
    let hh = String(date.getHours()).padStart(2, "0");
    let mm = String(date.getMinutes()).padStart(2, "0");
    let ss = String(date.getSeconds()).padStart(2, "0");
    let toAdd = 
    `   <div class="header">
            <span class="stopName">${selectedStop.uniqueName}</span>
            <span class="clock">${hh}:${mm}:${ss}</span>
        </div>
        `;*/
    let response = await fetch(`https://api.golemio.cz/v2/pid/departureboards?cisIds=${selectedStop.cis}`, fetchOpt);
    let temp = await response.json();
    const departures = temp.departures;
    console.log(departures);
    let toAdd = "";
    departures.forEach(dep => {
        let date = new Date(dep.departure_timestamp.scheduled);
        let h = String(date.getHours()).padStart(2, "0");
        let m = String(date.getMinutes()).padStart(2, "0");
        let linka = dep.route.short_name;
        let smer = dep.trip.headsign;
        let zpozdeni = dep.delay.minutes;
        let sekundy = dep.delay.seconds - dep.delay.minutes*60;
        let zpozdeniText, zpozdeniColor;
        let idSpoje = dep.trip.id;
        if(!dep.delay.is_available){
            zpozdeniText = `+??`;
            zpozdeniColor = "gray";
        }
        else if(dep.delay.seconds < 0){
            zpozdeniText = `-${zpozdeni}"${sekundy*-1}'`;
            zpozdeniColor = "orange";
        }
        else if(dep.delay.seconds > 360){
            zpozdeniText = `+${zpozdeni}"${sekundy}'`;
            zpozdeniColor = "lightcoral";
        }
        else if(dep.delay.seconds > 180){
            zpozdeniText = `+${zpozdeni}"${sekundy}'`;
            zpozdeniColor = "rgb(255, 187, 0)";
        }
        else{
            zpozdeniText = `+${zpozdeni}"${sekundy}'`;
            zpozdeniColor = "lightgreen";
        }
        
        let typ = "";
        if(dep.route.is_night){
            typ += "night";
        }
        if(dep.route.is_regional){
            typ += "reg";
        }
        switch (dep.route.type) {
            case 0:
                typ += "tram";
            break;
            case 1:
                typ = "";
                linka = `<img height="64px" src="./src/icons/metro${linka}.svg">`;
            break;
            case 2:
                typ += "train";
            break;
            case 3:
                typ += "bus";
            break;
            case 4:
                typ += "ferry";
            break;
            case 7:
                typ += "funicular";
            break;
            case 11:
                typ += "tbus";
            break;
        }
        console.log("LINKA: " + linka);
        console.log(`${h}:${m}`);
        document.getElementById("stopName").innerHTML = selectedStop.uniqueName;
        toAdd += `
                <div class="departure" onclick='setBustecTrip("${idSpoje}")'>
                    <div class="lineInfo">
                        <span class="line ${typ}">${linka}</span>
                        <img height="30px" src="./src/icons/arrow.svg">
                        <span class="heading">${smer}</span>
                    </div>
                    <div class="lineDepartures">
                        <span class="departureTime">${h}:${m}</span>
                        <span class="delayTime" style="color:${zpozdeniColor}">${zpozdeniText}</span>
                    </div>
                </div>
        `;

    });
    document.getElementById("departure").innerHTML = toAdd;
    console.log(departures);
    updateIntervalId = setInterval(() => {
            updateDepartures();
    }, 5000);
}

async function updateDepartures() {
        let response = await fetch(`https://api.golemio.cz/v2/pid/departureboards?cisIds=${selectedStop.cis}`, fetchOpt);
        let temp = await response.json();
        const departures = temp.departures;
        let lineInfoElements = document.getElementsByClassName("line");
        let destInfoElements = document.getElementsByClassName("heading");
        let depTimeElements = document.getElementsByClassName("departureTime");
        let delayTimeElements = document.getElementsByClassName("delayTime");

        for (let i = 0; i < lineInfoElements.length; i++) {
            let lineEl = lineInfoElements[i];
            let destEl = destInfoElements[i];
            let depTimeEl = depTimeElements[i];
            let delayEl = delayTimeElements[i];
            
            
        }
}

async function fetchDepartures(stopId){
    const response = await fetch(`https://api.golemio.cz/v2/pid/departureboards?ids=${stopId}&filter=routeOnce`, fetchOpt);
    console.log(await response.text());
}

async function setBustecTrip(tripId) {
    console.log(tripId);
    const response = await fetch(`https://api.golemio.cz/v2/gtfs/trips/${tripId}?includeShapes=false&includeStops=true&includeStopTimes=true&includeService=false&includeRoute=true`, fetchOpt);
    const tripInfo = await response.json();
    //zde dodělat aktuální pozici podle času
    console.log(tripInfo);
    let trip = {
        type: ""
    };
    
        if(tripInfo.route.is_night){
            trip.type += "night";
        }
        if(tripInfo.route.is_regional){
            trip.type += "reg";
        }
        switch (tripInfo.route.route_type) {
            case 0:
                trip.type += "tram";
            break;
            case 1:
                trip.type = "metro";
                trip.type += tripInfo.route.route_short_name;
            break;
            case 2:
                trip.type = "train";
            break;
            case 3:
                trip.type += "bus";
            break;
            case 4:
                trip.type += "ferry";
            break;
            case 7:
                trip.type += "funicular";
            break;
            case 11:
                trip.type += "tbus";
            break;
        }
    trip.line = tripInfo.route.route_short_name;
    if(tripInfo.trip_headsign.startsWith("Praha,")){
        trip.dest = tripInfo.trip_headsign.slice(6);
    }
    else{
        trip.dest = tripInfo.trip_headsign;
    }
    
    trip.stops = [];
    tripInfo.stop_times.forEach(element => {
        const stop = element.stop.properties;
        trip.stops.push({name: stop.stop_name, zone: stop.zone_id, platform: stop.platform_code});
    });
    await fetch(`http://127.0.0.1:3000/bustec`, {
        method: "POST",
        body: JSON.stringify(trip),
        headers: {
           "Content-Type": "application/json",
        }
    });
}