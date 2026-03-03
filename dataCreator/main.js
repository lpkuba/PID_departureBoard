let stops = []; //zastávky
let lines = []; //linky
let trips = []; //spoje
let services = []; //turnusy
let stopTimes = []; //propojení zastávek

let currentlyEditing = {};
let currentElement;

function init(){
    autoload();
    renderList();
}


function autoload(){
    let saved = JSON.parse(localStorage.lpkubaDataCreatorAutoSave);
    if(saved == undefined){
        return;
    }
    stops = saved.stops;
    lines = saved.lines;
    trips = saved.trips;
    services = saved.services;
    stopTimes = saved.stopTimes;
    console.warn(saved.timestamp);
    
    /*let els = document.getElementsByClassName("content");
    console.log(els);
    for (const element of els) {
        element.style = "display: none";
    }*/

    renderList();
    setInterval(autosave, 30000)
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
    try {
        localStorage.lpkubaDataCreatorAutoSave = JSON.stringify(data);
        console.log("Attempted autosave!");        
    } catch (error) {
        console.error(error); 
    }

}

function selectStop(selEl){
    let id = selEl.children[0].innerHTML;
    if(currentElement != undefined){
        currentElement.style = "";
        currentElement = selEl;
        currentElement.style = "background-color: pink;";
    }
    currentElement = selEl;
    reload(id);
}

function reload(id){
    currentlyEditing = stops[id];
    document.getElementById("stopIdProperty").value = id;
    document.getElementById("stopNameProperty").value = currentlyEditing.name;
    document.getElementById("stopAswIdProperty").value = currentlyEditing.aswId;
    let transfers = currentlyEditing.transfers.split(" ");
    let transferMEl = document.getElementsByName("transfersM");
    let transferEl = Array.from(document.getElementsByName("transfers"));
    if(transfers.length > 0){
        for (let i = 0; i < transfers.length; i++) {
            const element = transfers[i];
            if(element.startsWith("metro")){
                transferMEl[0].checked = element.contains("A") ? true : false;
                transferMEl[1].checked = element.contains("B") ? true : false;
                transferMEl[2].checked = element.contains("C") ? true : false;
                transferMEl[3].checked = element.contains("D") ? true : false;
            }
            else{
                transferEl.filter((el) => element == el.value)[0].checked = true;
            }
        }
    }
}

function createStop(){
    stops.push({
        id: stops.length,
        name: "",
        aswId: "",
        transfers: "",
        announcement: ""
    })
    renderList();
}

function save(){

    let transfers = "";
    let trEl = Array.from(document.getElementsByName("transfers")).filter((element) => element.checked == true);
    let trmEl = Array.from(document.getElementsByName("transfersM")).filter((element) => element.checked == true);
    
    if(trmEl.length > 0){
        transfers += "metro";
        for (const element of trmEl) {
            transfers += element.value;
        }
    }

    if(trEl.length > 0){
        for (const element of trEl) {
            transfers += " " + element.value;
        }
    }
    alert("Transfers: " + transfers);
    currentlyEditing = {
        id: document.getElementById("stopIdProperty").value,
        name: document.getElementById("stopNameProperty").value,
        aswId: document.getElementById("stopAswIdProperty").value,
        transfers: transfers,
        announcement: document.getElementById("stopAnnFilenameProperty").value,
    }
    stops[currentlyEditing.id] = currentlyEditing;
    renderList();
}

function renderList(){
    let toAdd = "";
    let i = 0;
    for (const stop of stops) {
        toAdd += `
        <div class="row" onclick='selectStop(this)' ${i == currentlyEditing.id ? 'style="background-color: pink;"' : ""}>
            <span>${stop.id}</span>
            <span>${stop.name}</span>
            <span>${stop.transfers != "" ? "ano" : "ne"}</span>
        </div>`;
        i++;
    }
    document.getElementsByClassName("list")[0].innerHTML = toAdd;
}