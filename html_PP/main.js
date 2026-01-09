let connectionInterval, data, liveData, ipAddr, casovac, cas = {}, numpadPos=0, liveDataInterval, prevLiveData, stops;
let numpadEditing = false;
let serverReady = false;
let announcement = new Audio();
let soundQueue = [];
let playing = false;
let soundIndex = 0;
announcement.preload = "auto";
const socket = new WebSocket("ws://localhost:3001");
const ppVersion = "0.0.5";

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
    serverReady = true;
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
    document.getElementById("homeSluzba").addEventListener("click", () => {hlaseniConstructor(null, "line");});

    
    const response = await fetch("../src/stops.json");
    stops = await response.json();

    //console.log(stops);

    
}

function popupVisFunc(event) {
    //console.log(this.id);
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
        String(date.getMonth()+1),
        String(date.getFullYear()),
        String(date.getHours()),
        String(date.getMinutes()),
        String(date.getSeconds())
    ];
    document.getElementById("homeDatum").innerHTML = `${d.padStart(2, "0")}.${mo.padStart(2, "0")}.${y.slice(2, 5)}`;
    document.getElementById("homeCas").innerHTML = `${h.padStart(2, "0")}:${mi.padStart(2, "0")}:${s.padStart(2, "0")}`;
    cas.mi = date.getMinutes();
    cas.h = date.getHours();
    cas.s = date.getSeconds();
    if(liveData.linkaActive){
        let timeInSeconds = cas.mi * 60 + cas.h * 3600 + cas.s;
        let depInSeconds = data.stops[liveData.stopIndex].departure_minutes * 60;
        if(cas.h < 8 && depInSeconds > 86400){
           timeInSeconds += 86400; //přičtení jednoho dne když je čas mezi 0-8 a čas odjezdu je přes 24h (pro noční linky s předchozím provozním dnem)
        }
        let odchylka = timeInSeconds - depInSeconds;
        if(odchylka > 5940){
            odchylka = 5940;
        }
        else if(odchylka < -5940){
            odchylka = -5940;
        }
        let odchylkaString = `${odchylka > 0 ? "+" : "-"}${String(Math.floor(Math.abs(odchylka)/60)).padStart(2,"0")}:${String(Math.abs(odchylka)%60).padStart(2,"0")}`
        document.getElementById("homeOdchylka").innerHTML = odchylkaString;
        document.getElementById("homeOdchylka").style.color = odchylka >= 0 ? "black" : "red";
        if((JSON.stringify(liveData) != prevLiveData) && serverReady){
            console.log("Odesílám rozdílný data");
            prevLiveData = JSON.stringify(liveData);
            sendLiveData(liveData);
        }
        else{
            console.log("Neodesílám totožný data");
        }
    }
}, 1000);

function popupBtnFunc(event) {
    //console.log(event);
    //console.log(this);
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
    //data.sluzbaFull = `${data.slLinka.toString().padStart(3, "0")} ${data.slPoradi.toString().padStart(2, "0")} ${data.slTypDne.toString().padStart(2, "0")}`;
    try {
        result = await fetch(`../services/${data.slLinka}${data.slPoradi}${data.slTypDne}.json`);
        temp = await result.json();
        if(temp.dataStructureVersion !== ppVersion){
            alert("Nekompatibilní pořadí s touto verzí PP! Očekávej problémy.");
        }
        //console.log(temp);
        const nowMinutes = cas.h * 60 + cas.mi;
        let nearestTime = {time: 99999};
        for (let i = 0; i < temp.trips.length; i++) {
            //console.log("Forloop! " + i);
            const element = temp.trips[i];
            //console.log(element);
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
        //console.log(nearestTime);
        data.slIndex = nearestTime.index;
        liveData.linkaActive = true;
        setTripData(next);
    } catch (error) {
        data.sluzbaFull = `${data.slLinka.toString().padStart(3, "0")} ${data.slPoradi.toString().padStart(2, "0")} ${data.slTypDne.toString().padStart(2, "0")}`;
        liveData.linkaActive = false;
        console.error(error);
        updateTextFields("erase");
    }
}


function setTripData(trip){
    data.sluzbaFull = `${trip.route.route_short_name.padStart(3, "0")} ${data.slPoradi.padStart(2, "0")} ${data.slTypDne.padStart(2, "0")}`;
    data.stops = trip.stop_times;
    data.cil = trip.trip_headsign;
    data.gtfsTripId = trip.trip_id;
    data.typVozidla = trip.route.route_type;
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

function sendLiveData(data){
    socket.send(JSON.stringify({
      "name": "pp",
      "type": "ois",
      "dataType": "liveData",
      "data": data
    }))
}

function announceStop() {
    if(liveData.vehInStop == true && liveData.stopIndex < data.stops.length-1){ //odjezd ze zast
        liveData.stopIndex++;
        liveData.vehInStop = false;
        updateTextFields();
        document.getElementById("homeStopName").classList.remove("active");
        hlaseniConstructor(data.stops[liveData.stopIndex].stop.properties.stop_id.split("Z")[0].slice(1), "next");
    }
    else{ //příjezd do zast
        liveData.vehInStop = true;
        document.getElementById("homeStopName").classList.add("active");
        hlaseniConstructor(data.stops[liveData.stopIndex].stop.properties.stop_id.split("Z")[0].slice(1), "curr");

    }
}

function updateTextFields(mode) {
    if(mode == undefined){
        document.getElementById("homeJmenoZast").innerHTML = shortenString(data.stops[liveData.stopIndex].stop.properties.stop_name);
        document.getElementById("homePasmo").innerHTML = data.stops[liveData.stopIndex].stop.properties.zone_id;
        document.getElementById("homeCasJR").innerHTML = minutesToTimeFormatted(data.stops[liveData.stopIndex].departure_minutes);
        document.getElementById("homeSluzba").innerHTML = data.sluzbaFull;
        console.log(data.stops[liveData.stopIndex]);
    }
    else if(mode == "erase"){
        document.getElementById("homeJmenoZast").innerHTML = "";
        document.getElementById("homePasmo").innerHTML = "";
        document.getElementById("homeCasJR").innerHTML = "";
    }
}
//Šestajovice, Balkán
function shortenString(str){
    //const str = "ABCDEFGH, IJKLMNOP";
    //console.log(str);
    let strLen = str.length+1;
    let splitStr = str.split(",");
    if(splitStr.length == 1 && strLen > 13){
        splitStr = str.split(" ");
    }
    //console.log(strLen);
    if(strLen > 12){
        for (let i = 0; i < splitStr.length; i++) {
            let temp = splitStr[i].trim();
            //console.log("DELKA: "+ temp.length);
            for (let x = temp.length; x > 0; x--) {
                //console.log("HODNOTA X: " +x);
                //console.log("DELKA KRACENE: " + strLen);
                strLen--;
                //console.log(strLen);
                if(strLen > 12){
                    temp = temp.slice(0,x) + ".";
                    
                }
                else{
                    break;
                }
            }
            strLen++;
            splitStr[i] = temp;
        }
        let result = "";
        splitStr.forEach(element => {
            result += element;
        })
        return result;
    }
    else{
        return str;
    }
}

function hlaseniConstructor(node, mode){
    console.log(mode);
    let transfers = [];
    switch (mode) {
        case "curr":
            soundQueue.push(hlaseni.gong);    
            transfers = getTransfers(node);     
            soundQueue.push(node);  
        break;
        case "next":
            soundQueue.push(hlaseni.pristiZastavka);  
            soundQueue.push(node);          
        break;
        case "line":
            soundQueue.push(hlaseni.gong);
            soundQueue.push(hlaseni.linka);
            let temp = data.sluzbaFull.split(" ");
            let dvojcislovka = Number(temp[0].slice(1));
            if(dvojcislovka > 10 && dvojcislovka < 20){
                soundQueue.push(`C${temp[0][0]}00`);
                soundQueue.push(`C${dvojcislovka}`);
            }
            else{
                soundQueue.push(`C${temp[0][0]}00`);
                soundQueue.push(`C${temp[0][1]}0`);
                soundQueue.push(`C${temp[0][2]}`);
            }
            soundQueue.push(hlaseni.smer);
            try {
                soundQueue.push(data.stops[data.stops.length-1].stop_id.split("Z")[0].slice(1));
            } catch (error) {
                
            }
        break;
    }
    


    
    for (let i = 0; i < transfers.length; i++) {
        const element = transfers[i];
            if(hlaseni[element] != undefined){
                soundQueue.push(hlaseni[element]);
            }
    }
        if(liveData.stopIndex == data.stops.length-1 && mode == "curr"){
            soundQueue.push(hlaseni.konecnaZastavka);
            soundQueue.push(hlaseni.prosimeVystupte);
            soundQueue.push(hlaseni.terminus);
            soundQueue.push(hlaseni.pleaseLeave);
        } 
    vyhlas();
}

function vyhlas() {
    if(soundQueue.length == 0){
        playing = false;
        return;
    }

    playing = true;


    announcement.src = "./HLASENI/" + soundQueue.shift() + ".ogg";
    announcement.play();



}
announcement.addEventListener("error", error => {
    console.error(error);
    vyhlas();
})

announcement.addEventListener("ended", vyhlas);

function getTransfers(node){
    let stopTransfers = [];
    let searchResult = stops.stopGroups.filter((elm) => elm.node == parseInt(data.stops[liveData.stopIndex].stop.properties.stop_id.split("Z")[0].slice(1)));
    for (let i = 0; i < searchResult.length; i++) {
        const zastavka = searchResult[i];
        let metro = [];
        for (let x = 0; x < zastavka.stops.length; x++) {
            const nastupiste = zastavka.stops[x];
            for (let y = 0; y < nastupiste.lines.length; y++) {
                const linka = nastupiste.lines[y];
                console.log(linka);
                if(linka.type == "metro"){
                    if(!metro.includes(linka.name)){
                        metro.push(linka.name);
                        //console.log(linka.name);
                    }
                }
                else{
                    if(!stopTransfers.includes(linka.type) && !linka.type.endsWith("tram") && !linka.type.endsWith("bus") && !compareTypes(linka.type, data.typVozidla)){
                        //console.log("Pushuju: " + linka.type);
                        stopTransfers.push(linka.type);
                    }
                }
            }
        }
            console.log(metro);
            if(metro.length > 0){
                metro.sort();
                let temp = "metro";
                stopTransfers.push("metro");

                for (let z = 0; z < metro.length; z++) {
                    const element = metro[z];
                    temp += element;
                }
                stopTransfers.push(temp);
            }
    }
    return stopTransfers;
}

function compareTypes(str, num){
    let temp = "";

    switch (num) {
        case 0:
            temp = "tram";
        break;
        case 1:
            temp = "metro";
        break;
        case 2:
            temp = "train";
        break;
        case 3:
            temp = "bus";
        break;
        case 4:
            temp = "ferry";
        break;
        case 7:
            temp = "funicular";
        break;
        case 11:
            temp = "tbus";
        break;
    }

    if(temp == str){
        return true;
    }
    else{
        return false;
    }
}

function minutesToTimeFormatted(mins){
    if(mins >= 1440){
        mins -= 1440;
    }
    let hour = String(Math.floor(mins / 60));
    let minute = String(mins % 60);
    return String(`${hour.padStart(2,"0")}:${minute.padStart(2,"0")}`);
}

