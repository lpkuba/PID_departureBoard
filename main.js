let stops = {};
let stopsMap, stopsMappedArray, fuseStops,  fetchOpt, fuse, selectedStop;
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

async function getDepartures(){
    const date = new Date();
    let hh = String(date.getHours()).padStart(2, "0");
    let mm = String(date.getMinutes()).padStart(2, "0");
    document.getElementById("departureBoard").innerHTML = 
    `   <div class="header">
            <span class="stopName">${selectedStop.uniqueName}</span>
            <span class="clock">${hh}:${mm}</span>
        </div>
        `;
    let response = await fetch(`https://api.golemio.cz/v2/pid/departureboards?cisIds=${selectedStop.cis}`, fetchOpt);
    let temp = await response.json();
    const departures = temp.departures;
    departures.forEach(dep => {
        let date = new Date(dep.arrival_timestamp.scheduled);
        let h = String(date.getHours()).padStart(2, "0");
        let m = String(date.getMinutes()).padStart(2, "0");
        let linka = dep.route.short_name;
        let smer = dep.trip.headsign;
        let zpozdeni = dep.delay.minutes;
        let zpozdeniText;
        if(zpozdeni < 0){
            zpozdeniText = `${zpozdeni}"`;
        }
        else{
            zpozdeniText = `+${zpozdeni}"`;
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
                typ += "trolleybus";
            break;
        }
        
        document.getElementById("departureBoard").innerHTML += `
                <div class="departure">
                    <div class="lineInfo">
                        <span class="line ${typ}">${linka}</span>
                        <img height="30px" src="./src/icons/arrow.svg">
                        <span class="heading">${smer}</span>
                    </div>
                    <div class="lineDepartures">
                        <span class="departureTime">${h}:${m}</span>
                        <span class="delayTime"></span>
                    </div>
                </div>
        `;
    });
    console.log(departures);

}

async function fetchDepartures(stopId){
    const response = await fetch(`https://api.golemio.cz/v2/pid/departureboards?ids=${stopId}&filter=routeOnce`, fetchOpt);
    console.log(await response.text());
}
