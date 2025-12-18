let stops = {};
let stopsMap, stopsMappedArray;
const fetchOpt = require("options.json");
async function init(){
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
}
async function fetchDepartures(stopId){
    const response = await fetch(`https://api.golemio.cz/v2/pid/departureboards?ids=${stopId}&filter=routeOnce`, fetchOpt);
    console.log(await response.text());
}
