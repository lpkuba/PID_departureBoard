let stops = []; //zastávky
let lines = []; //linky
let trips = []; //spoje
let services = []; //turnusy
let stopTimes = []; //propojení zastávek


function init(){
    autoload();
}


function autoload(){
    let autosave = JSON.parse(localStorage.lpkubaDataCreatorAutoSave);
    if(autosave == undefined){
        return;
    }
    stops = autosave.stops;
    lines = autosave.lines;
    trips = autosave.trips;
    services = autosave.services;
    stopTimes = autosave.stopTimes;
    console.warn(autosave.timestamp);
}

function autosave(){
    let timestamp = new Date();
    let data = {
        stops: stops,
        lines: lines,
        trips: trips,
        services: services,
        stopTimes: stopTimes,
        timestamp: timestamp
    }
    localStorage.lpkubaDataCreatorAutoSave = JSON.stringify(data);
    console.log("Attempted autosave!");
}