let stops = {};
let stopsMap, stopsMappedArray, fuseStops,  fetchOpt, fuse;
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

    for (let i = 0; i < list.length; i++) {
        const element = list[i].item;
        let newStopElement = document.createElement("div");
        newStopElement.classList.add("stops");
        newStopElement.onclick = function() {updateSearchValue(element.uniqueName)};
        let stopName = document.createElement("span");
        stopName.innerHTML = element.uniqueName;
        let stopLines = document.createElement("span");
        stopLines.classList.add("lines");
        stopLines.innerHTML = "placeholder";
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
/*async function init(){
    console.log("Probíhá inicializace...");
    const response = await fetch("https://api.golemio.cz/v2/gtfs/stops", fetchOpt);
    stops = await response.text();
    stops = JSON.parse(stops);
    console.log(stops);
    stopsMap = new Map();
    stops.features.forEach((stop, index) => {
        //console.log(stop);
        if(stop.properties.zone_id != null){
            let nigga = stop.properties.stop_name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") 
                .replace(/[.,]/g, "")
                .toLowerCase();
            stopsMap.set(nigga, index);  
            //console.log(`Zakládám entry pro zastávku s norm. jm.: ${nigga} s ID: ${stop.properties.stop_id}`);
        }
    });
    console.log("Zkompletována mapa zastávek!");
    stopsMappedArray = [...stopsMap].map(([name, id]) => ({ name, id }));
}
async function searchStop(){
    let input = document.getElementById("stopInput").value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[.,]/g, "")
        .toLowerCase();
    const fuse = new Fuse(stopsMappedArray, {
      keys: ["name"],
      threshold: 0.3
    });
    //console.log(stopsMappedArray);
    const result = await fuse.search(input);
    if(result.length > 0){
        const index = result[0].item.id;
        let stop = stops.features[result[0].item.id].properties;
        console.log(stop.stop_name);
        document.getElementById("stopResult").innerHTML = stop.stop_name;
        document.getElementById("stopResult").innerHTML += "<br>";
        document.getElementById("stopResult").innerHTML += stop.stop_id;
        fetchDepartures(stop.stop_id);
    }
    else{
        console.log("Nenalezena zastávka!");
        document.getElementById("stopResult").innerHTML = "Nenalezena zastávka!";
    }
}*/

async function fetchDepartures(stopId){
    const response = await fetch(`https://api.golemio.cz/v2/pid/departureboards?ids=${stopId}&filter=routeOnce`, fetchOpt);
    console.log(await response.text());
}
