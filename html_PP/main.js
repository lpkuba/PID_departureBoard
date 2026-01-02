let connectionInterval, data, liveData, ipAddr, casovac, cas = {}, numpadPos=0, liveDataInterval;
let numpadEditing = false;

const socket = new WebSocket("ws://localhost:3001");

// Connection opened

data = {
    sluzbaFull: "912 51 01",
    slLinka: 912,
    slPoradi: 51,
    slTypDne: 1,
    sluzbaKnown: true,
    slIndex: 0,
    cil: "Palmovka <B>",
    stops: [],
    gtfsTripId: ""
}

liveData = {
    stopIndex: 0,
    vehInStop: false,
    linkaActive: false,
    timeStr: "init"
}

socket.addEventListener("open", (event) => {
  socket.send(JSON.stringify({
    "name": "pp",
    "type": "ois",
    "data": {},
    "dataType": "config"
  }))
})


function replaceCharAt(str, index, replacement) {
    return str.substring(0, index) +
         replacement +
    str.substring(index + 1);
}
async function init(){
    //alert("Initialised!");
    //await ... doplnit konfigurací !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    document.getElementById("sluzba").addEventListener("click", popupVisFunc, false);
    //numpad eventlistenery
    Array.from(document.getElementsByClassName("leftBtnTable")[0].children).forEach(nigga => {
        Array.from(nigga.children).forEach(child => {
            child.addEventListener("click", popupVisFunc, false);
        });
    });
    Array.from(document.getElementsByClassName("rightBtnTable")[0].children).forEach(nigga => {
        Array.from(nigga.children).forEach(child => {
            child.addEventListener("click", popupVisFunc, false);
        });
    });

    
    Array.from(document.getElementById("numpadMain").children).forEach(nigga => {
        Array.from(nigga.children).forEach(child => {
            child.addEventListener("click", popupBtnFunc, false);
        });
    });
    document.getElementById("homeSluzba").innerHTML = data.sluzbaFull;
    document.getElementById("popupCilOK").addEventListener("click", popupBtnFunc, false);
    
    
}

function popupVisFunc(event) {
    console.log(this.id);
    curMode = this.id;
    switch (this.id) {
        case "sluzba":
            document.getElementById("popupSluzba").hidden = false;    
            numpadHandler("","");
        break;
        case "cil":
            if(data.sluzbaKnown){
                document.getElementById("popupCil_known").hidden = false;
                setTimeout(() => {
                    document.getElementById("popupCil_known").hidden = true;
                }, 5000);
            }
            else{
                document.getElementById("popupCil_unknown").hidden = false;
            }
        break;
        case "vyhlasitZastavku":
            announceStop();
        break;
            
    }
}

setInterval( function () {
    const date = new Date();
    const [d, mo, y, h, mi, s] = [
        String(date.getDate()),
        String(date.getMonth()),
        String(date.getFullYear()),
        String(date.getHours()),
        String(date.getMinutes()),
        String(date.getSeconds())
    ];
    document.getElementById("homeDatum").innerHTML = `${d.padStart(2, "0")}.${mo.padStart(2, "0")}.${y.slice(2, 5)}`;
    document.getElementById("homeCas").innerHTML = `${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${s.padStart(2, "0")}`;
    cas.mi = date.getMinutes();
    cas.h = date.getHours();
    if(liveData.linkaActive){
        const timeInMinutes = cas.mi + (cas.h * 60);


        socket.send(JSON.stringify({
          "name": "pp",
          "type": "ois",
          "dataType": "liveData",
          "data": liveData
        }))
    }
}, 1000);

function popupBtnFunc(event) {
    console.log(event);
    console.log(this);
    if(this.id.startsWith("numpad")){
        numpadHandler(this.id,"");
    }
    else if(this.id == "popupCilOK"){
        document.getElementById("popupCil_known").hidden = true;
    }

}

function numpadHandler(key, loopback) {
    if(!numpadEditing){
    sluzbaShown = data.slLinka.toString().padStart(3, "0") + " " + data.slPoradi.toString().padStart(2, "0") + " " + data.slTypDne.toString().padStart(2, "0"); //prasarnicka ale funkcni
    numpadEditing = true;
    }

    let sluzbaToShow = "";
    let pismenka = sluzbaShown.split("");
    for (let i = 0; i < 9; i++) {
        const pismeno = pismenka[i];
        if(i == numpadPos){
            sluzbaToShow += `<span class="numSelected">${pismeno}</span>`
            
        }
        else{
            sluzbaToShow += `<span>${pismeno}</span>`
        }
    }
    document.getElementById("sluzbaField").innerHTML = sluzbaToShow;
    if(key == "refresh"){
        return;
    }

    switch (key) {
        case "numpadNo":
            document.getElementById("popupSluzba").hidden = true;
            numpadEditing = false;
            numpadPos = 0;
        break;
        case "numpadYes":
            data.slLinka = sluzbaShown.slice(0,3);
            data.slPoradi = sluzbaShown.slice(4,6);
            data.slTypDne = sluzbaShown.slice(7,9);
            document.getElementById("popupSluzba").hidden = true;
            loadRouteData();
            numpadEditing = false;
            numpadPos = 0;
        break;
        case "numpadLeft":
            if(curMode == "sluzba"){
                if(numpadPos === 0){
                    break;
                }
                else if(numpadPos == 4 || numpadPos === 7){
                    numpadPos -= 2;
                }
                else{
                    numpadPos--;
                }
            }
            else if(curMode == "cil"){
                
            }

        break;
        case "numpadRight":
            if(curMode == "sluzba"){
                if(numpadPos === 8){
                    break;
                }
                else if(numpadPos == 2 || numpadPos === 5){
                    numpadPos += 2;
                }
                else{
                    numpadPos++;
                }
            }
        break;
        case "numpad1":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "1");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad2":    
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "2");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad3":    
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "3");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad4":    
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "4");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad5":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "5");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }      
        break;
        case "numpad6":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "6");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }        
        break;
        case "numpad7":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "7");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }     
        break;
        case "numpad8":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "8");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }    
        break;
        case "numpad9":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "9");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }      
        break;
        case "numpad0":    
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "0");
            if(numpadPos === 8){}
            else if(numpadPos == 2 || numpadPos === 5){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
    }
    numpadHandler("refresh", sluzbaShown);
}

async function loadRouteData() {
    liveData.stopIndex = 0;
    let temp = {};
    data.sluzbaFull = `${data.slLinka.toString().padStart(3, "0")} ${data.slPoradi.toString().padStart(2, "0")} ${data.slTypDne.toString().padStart(2, "0")}`;
    document.getElementById("homeSluzba").innerHTML = data.sluzbaFull;
    try {
        result = await fetch(`../services/${data.slLinka}${data.slPoradi}${data.slTypDne}.json`);
        temp = await result.json();
        console.log(temp);
        const nowMinutes = cas.h * 60 + cas.mi;
        let nearestTime = {time: 99999};
        for (let i = 0; i < temp.trips.length; i++) {
            console.log("Forloop! " + i);
            const element = temp.trips[i];
            console.log(element);
            if((element.departure_minutes - nowMinutes) < nearestTime.time && (element.departure_minutes - nowMinutes) >= 0){
                nearestTime.time = element.departure_minutes - nowMinutes;
                nearestTime.index = i;
            }
            else{
                nearestTime.time = element.departure_minutes - nowMinutes;
                nearestTime.index = 0;
            }
        }
        next = temp.trips[nearestTime.index];
        console.log(nearestTime);
        data.slIndex = nearestTime.index;
        liveData.linkaActive = true;
        setTripData(next);
    } catch (error) {
        liveData.linkaActive = false;
        console.error(error);
    }
}


function setTripData(trip){
    data.sluzbaFull = `${trip.route.route_short_name.padStart(3, "0")} ${data.slPoradi.padStart(2, "0")} ${data.slTypDne.padStart(2, "0")}`;
    data.stops = trip.stop_times;
    data.cil = trip.trip_headsign;
    data.gtfsTripId = trip.trip_id;
    //Update textfield

    document.getElementById("cilText").innerHTML = data.cil;
    updateTextFields();
    sendTripData(trip);

}

function sendTripData(data){
    socket.send(JSON.stringify({
      "name": "pp",
      "type": "ois",
      "dataType": "routeData",
      "data": data
    }))
}

function announceStop() {
    if(liveData.vehInStop == true && liveData.stopIndex < data.stops.length){
        liveData.stopIndex++;
        liveData.vehInStop = false;
        updateTextFields();
    }
    else{
        liveData.vehInStop = true;
    }
}

function updateTextFields() {
    document.getElementById("homeJmenoZast").innerHTML = data.stops[liveData.stopIndex].stop.properties.stop_name;
    document.getElementById("homePasmo").innerHTML = data.stops[liveData.stopIndex].stop.properties.zone_id;
}