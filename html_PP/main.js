let connectionInterval, data, liveData, ipAddr, casovac, cas = {}, numpadPos=0, liveDataInterval, prevLiveData, stops, routes, polohaStopIndex, polohaSluzbaIndex;
let numpadEditing = false;
let serverReady = false;
let liveDataReady = false;
let announcement = new Audio();
let soundQueue = [];
let playing = false;
let soundIndex = 0;
announcement.preload = "auto";
const socket = new WebSocket("ws://localhost:3001");
const ppVersion = "0.0.5"; //verze se mění pouze při změně formátu dat
let turnusData = {};
data = {
    sluzbaFull: "912 51 01",
    slLinka: 912,
    slPoradi: 51,
    slTypDne: 1,
    sluzbaKnown: true,
    slIndex: 0,
    cil: "Palmovka <B>",
    cilId: 0,
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
    Array.from(document.getElementById("polohaButtons").children).forEach(nigga => {
        Array.from(nigga.children).forEach(child => {
            child.addEventListener("click", popupBtnFunc, false);
        });
    });
    Array.from(document.querySelectorAll("[data-value]")).forEach(nigga => {
            nigga.addEventListener("click", popupBtnFunc, false);
    });
    document.getElementById("homeSluzba").innerHTML = data.sluzbaFull;
    document.getElementById("popupCilOK").addEventListener("click", popupBtnFunc, false);
    document.getElementById("homeSluzba").addEventListener("click", () => {hlaseniConstructor(null, "line");});


    
    let response = await fetch("../src/stops.json");
    stops = await response.json();

    response = await fetch("../src/routes.json");
    routes = await response.json();

    //console.log(stops);

    
}

function popupVisFunc(event) {
    //console.log(this.id);
    curMode = this.id;
    switch (this.id) {
        case "sluzba":
            document.getElementById("popupSluzba").hidden = false;    
            numpadHandler("","sluzba",this);
        break;
        case "cil":
            if(liveData.linkaActive){
                document.getElementById("popupCil_known").hidden = false;
                setTimeout(() => {
                    document.getElementById("popupCil_known").hidden = true;
                }, 5000);
            }
            else{
                document.getElementById("popupCil_unknown").hidden = false;
                numpadHandler("","cil",this);
            }
        break;
        case "vyhlasitZastavku":
            announceStop();
        break;
        case "poloha":
            if(liveData.linkaActive){
                document.getElementById("popupPoloha").hidden = false;
                polohaSluzbaIndex = data.slIndex;
                polohaStopIndex = liveData.stopIndex;
                document.getElementById("polohaStop").innerHTML = dataSluzby.trips[polohaSluzbaIndex].stop_times[polohaStopIndex].stop.properties.stop_name;
                document.getElementById("polohaTime").innerHTML = minutesToTimeFormatted(dataSluzby.trips[polohaSluzbaIndex].stop_times[polohaStopIndex].departure_minutes);
            }
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
        if((JSON.stringify(liveData) != prevLiveData) && liveDataReady){
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
        numpadHandler(this.id,"sluzba",this);
    }
    if(this.dataset.value != undefined && this.parentElement.parentElement.id.endsWith("Cil")){
        numpadHandler(this.dataset.value,"cil",this);
    }
    if(this.id.startsWith("poloha")){
            console.log(this.id.toLowerCase().slice(6));

        switch (this.id.toLowerCase().slice(6)){
            //nahoru je jakejsi skip na konec, či další spoj
            case "up":
                //když ještě máme nějaký spoje
                if (polohaSluzbaIndex < dataSluzby.trips.length-1) {
                    //když je poslední zastávka danýho spoje
                    if(dataSluzby.trips[polohaSluzbaIndex].stop_times.length-1 == polohaStopIndex){
                        polohaSluzbaIndex++;
                    }
                    polohaStopIndex = dataSluzby.trips[polohaSluzbaIndex].stop_times.length-1;                   
                }                
            break;
            //dolu dělá to stejný co nahoru akorát že neřeší aktuální pozici 
            case "down":
                if(polohaSluzbaIndex > 0){
                    polohaSluzbaIndex--;
                    polohaStopIndex = dataSluzby.trips[polohaSluzbaIndex].stop_times.length-1;                   
                }
            break;
            case "left":
                if(polohaStopIndex > 0){
                    polohaStopIndex--;
                }
                else if(polohaSluzbaIndex > 0){
                    polohaSluzbaIndex--;
                    polohaStopIndex = dataSluzby.trips[polohaSluzbaIndex].stop_times.length-1;
                }
            break;
            case "right":
                if(polohaStopIndex < dataSluzby.trips[polohaSluzbaIndex].stop_times.length-1){
                    polohaStopIndex++;
                }
                else if(polohaSluzbaIndex < dataSluzby.trips.length-1){
                    polohaSluzbaIndex++;
                    polohaStopIndex = 0;
                }
            break;
            case "yes":
                liveData.stopIndex = polohaStopIndex;
                if(data.slIndex != polohaSluzbaIndex){
                    data.slIndex = polohaSluzbaIndex;
                    loadRouteData(true,true);
                }
                else{
                    liveData.vehInStop = false;
                    document.getElementById("homeStopName").style.backgroundColor ="white";
                    updateTextFields();
                }
            case "no":  
                document.getElementById("popupPoloha").hidden = true;
            break;
        }
        //let lastStopIndex = dataSluzby.trips[data.slIndex].stop_times.length-1;
        document.getElementById("polohaStop").innerHTML = dataSluzby.trips[polohaSluzbaIndex].stop_times[polohaStopIndex].stop.properties.stop_name;
        document.getElementById("polohaTime").innerHTML = minutesToTimeFormatted(dataSluzby.trips[polohaSluzbaIndex].stop_times[polohaStopIndex].departure_minutes);
    }


    switch (this.id) {
        case "popupCilOK":
            document.getElementById("popupCil_known").hidden = true;
        break;
    }

}

function numpadHandler(key, mode, element) {
    let len = 9;
    if(mode == "cil"){
        len = 4;
    }
    if(!numpadEditing){
        if(mode == "sluzba"){
            sluzbaShown = data.slLinka.toString().padStart(3, "0") + " " + data.slPoradi.toString().padStart(2, "0") + " " + data.slTypDne.toString().padStart(2, "0"); //prasarnicka ale funkcni
        }
        else if(mode == "cil"){
            sluzbaShown = "0000";
        }
        numpadEditing = true;
    }

    let sluzbaToShow = "";
    let pismenka = sluzbaShown.split("");
    for (let i = 0; i < len; i++) {
        const pismeno = pismenka[i];
        if(i == numpadPos){
            sluzbaToShow += `<span class="numSelected">${pismeno}</span>`
            
        }
        else{
            sluzbaToShow += `<span>${pismeno}</span>`
        }
    }
    document.getElementById("sluzbaField").innerHTML = sluzbaToShow;
    document.getElementById("cilField").innerHTML = sluzbaToShow;
    if(key == "refresh"){
        return;
    }

    switch (key) {
        case "numpadNo":
            console.log("Zavírám numpad");
            element.parentElement.parentElement.parentElement.hidden = true;
            numpadEditing = false;
            numpadPos = 0;
            return;
        break;

        case "numpadYes":
            if(mode == "sluzba"){
                data.slLinka = sluzbaShown.slice(0,3);
                data.slPoradi = sluzbaShown.slice(4,6);
                data.slTypDne = sluzbaShown.slice(7,9);
                element.parentElement.parentElement.parentElement.hidden = true;
                loadRouteData(false,false);
                numpadEditing = false;
                numpadPos = 0;
                return;
            }
            else if(mode == "cil"){
                data.cilId = Number(sluzbaShown);;
                element.parentElement.parentElement.parentElement.hidden = true;
                numpadEditing = false;
                numpadPos = 0;
                loadTerminusData();
                return;
            }
        break;
        case "numpadLeft":
            if(numpadPos === 0){
                break;
            }

            if(mode == "sluzba" && (numpadPos == 4 || numpadPos === 7)){
                    numpadPos -= 2;
            }
            else{
                numpadPos--;
            }
        break;
        case "numpadRight":
            if(numpadPos === len-1){
                break;
            }
            if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad1":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "1");
            if(numpadPos === len-1){}
            else if(((numpadPos == 2 || numpadPos === 5) && mode == "sluzba") && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad2":    
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "2");
            if(numpadPos === len-1){}
            else if(((numpadPos == 2 || numpadPos === 5) && mode == "sluzba") && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad3":    
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "3");
            if(numpadPos === len-1){}
            else if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad4":    
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "4");
            if(numpadPos === len-1){}
            else if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
        case "numpad5":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "5");
            if(numpadPos === len-1){}
            else if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }      
        break;
        case "numpad6":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "6");
            if(numpadPos === len-1){}
            else if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }        
        break;
        case "numpad7":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "7");
            if(numpadPos === len-1){}
            else if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }     
        break;
        case "numpad8":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "8");
            if(numpadPos === len-1){}
            else if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }    
        break;
        case "numpad9":
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "9");
            if(numpadPos === len-1){}
            else if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }      
        break;
        case "numpad0":    
            sluzbaShown = replaceCharAt(sluzbaShown,numpadPos, "0");
            if(numpadPos === len-1){}
            else if((numpadPos == 2 || numpadPos === 5) && mode == "sluzba"){
                numpadPos += 2;
            }
            else{
                numpadPos++;
            }
        break;
    }
    numpadHandler("refresh",mode, sluzbaShown);
}

async function loadRouteData(loadNext, loadByPoloha) {
    if(!loadByPoloha){
        liveData.stopIndex = 0; 
    }
    liveData.vehInStop = false;
    document.getElementById("homeStopName").style.backgroundColor ="white";
    //let temp = {};
    //data.sluzbaFull = `${data.slLinka.toString().padStart(3, "0")} ${data.slPoradi.toString().padStart(2, "0")} ${data.slTypDne.toString().padStart(2, "0")}`;
    try {
        if(!loadNext){
            result = await fetch(`../services/${data.slLinka}${data.slPoradi}${data.slTypDne}.json`);
            dataSluzby = await result.json();
        }
        if(dataSluzby.dataStructureVersion !== ppVersion){
            console.warn(`Nekompatibilní pořadí s touto verzí PP!\n local: \x1b[36m${ppVersion} \n \x1b[0mjson: \x1b[36m${dataSluzby.dataStructureVersion}`);
        }
        //console.log(temp);
        const nowMinutes = cas.h * 60 + cas.mi;
        let nearestTime = {time: 99999};
        if(!loadNext){
            for (let i = 0; i < dataSluzby.trips.length; i++) {
                //console.log("Forloop! " + i);
                const element = dataSluzby.trips[i];
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
            next = dataSluzby.trips[nearestTime.index];
            data.slIndex = nearestTime.index;
        }
        else{
            if(dataSluzby.trips.length-1 >= data.slIndex + 1 && !loadByPoloha){
                data.slIndex++;
            }
            next = dataSluzby.trips[data.slIndex];
        }
        //console.log(nearestTime);
        liveData.linkaActive = true;
        setTripData(next);
    } catch (error) {
        data.sluzbaFull = `${data.slLinka.toString().padStart(3, "0")} ${data.slPoradi.toString().padStart(2, "0")} ${data.slTypDne.toString().padStart(2, "0")}`;
        document.getElementById("homeSluzba").innerHTML = data.sluzbaFull;
        liveData.linkaActive = false;
        data.cil = "";
        data.cilId = 0;
        data.stops = [];
        console.error(error);
        updateTextFields("erase");
    }
}


function setTripData(trip){
    liveData.vehInStop = false;
    data.sluzbaFull = `${isNaN(Number(trip.route.route_short_name)) ? data.slLinka.toString().padStart(3, "0") : String(trip.route.route_short_name).padStart(3, "0")} ${data.slPoradi.padStart(2, "0")} ${data.slTypDne.padStart(2, "0")}`;
    data.stops = trip.stop_times;
    data.cil = trip.trip_headsign;
    data.cilId = gtfsToNodeID(data.stops[data.stops.length-1].stop_id);
    data.gtfsTripId = trip.trip_id;
    data.typVozidla = trip.route.route_type;
    //Update textfield

    document.getElementById("cilText").innerHTML = shortenString(data.cil, 18);
    updateTextFields();
    sendTripData(trip);
}

function sendTripData(data){
    if(serverReady){
        socket.send(JSON.stringify({
          "name": "pp",
          "type": "ois",
          "dataType": "routeData",
          "data": data
        }))
        if(liveData.linkaActive){
            setTimeout(() => {
                liveDataReady = true;
            }, 1000)
        }
    }
    else{
        console.error("Server není ve stavu ready!");
    }
}

function sendLiveData(data){
    if(serverReady){
        socket.send(JSON.stringify({
          "name": "pp",
          "type": "ois",
          "dataType": "liveData",
          "data": data
        }))
        }
    else{
        console.error("Server není ve stavu ready!");
    }
}

function sendAnnouncementData(data){
    if(serverReady){
        setTimeout(() => {
            socket.send(JSON.stringify({
              "name": "pp",
              "type": "ois",
              "dataType": "annData",
              "data": data
            }))
        }, 1500)
        }
    else{
        console.error("Server není ve stavu ready!");
    }
}

function announceStop() {
    if(!liveData.linkaActive){return;}
    if(data.stops.length - 1 == liveData.stopIndex && liveData.vehInStop == true){
        document.getElementById("homeStopName").style.backgroundColor ="white";
        loadRouteData(true,false);
        return;
    }
    if(liveData.vehInStop == true && liveData.stopIndex < data.stops.length-1){ //odjezd ze zast
        liveData.stopIndex++;
        liveData.vehInStop = false;
        updateTextFields();
        document.getElementById("homeStopName").style.backgroundColor ="white";
        hlaseniConstructor(gtfsToNodeID(data.stops[liveData.stopIndex].stop.properties.stop_id), "next");
    }
    else{ //příjezd do zast
        liveData.vehInStop = true;
        document.getElementById("homeStopName").style.backgroundColor ="yellow";
        hlaseniConstructor(gtfsToNodeID(data.stops[liveData.stopIndex].stop.properties.stop_id), "curr");

    }
}

function updateTextFields(mode) {
    if(mode == undefined){
        document.getElementById("homeJmenoZast").innerHTML = shortenString(data.stops[liveData.stopIndex].stop.properties.stop_name, 13);
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
function shortenString(str,maxLen){
    //const str = "ABCDEFGH, IJKLMNOP";
    //console.log(str);
    let strLen = str.length+1;
    let splitStr = str.split(",");
    if(splitStr.length == 1 && strLen > maxLen){
        splitStr = str.split(" ");
    }
    //console.log(strLen);
    if(strLen > maxLen-1){
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
            console.log(temp[0]);
            switch (temp[0]) {
                case "834":
                    soundQueue.push(hlaseni.xA);
                break;
                case "835":
                    soundQueue.push(hlaseni.xB);
                break;
                case "836":
                    soundQueue.push(hlaseni.xC);
                break;

                default:
                    let dvojcislovka = Number(temp[0].slice(1));
                    if(dvojcislovka > 10 && dvojcislovka < 20){
                        soundQueue.push(`C${temp[0][0]}00`);
                        soundQueue.push(`C${dvojcislovka}`);
                    }
                    else{
                        soundQueue.push(`C${temp[0][0]}00`);
                        soundQueue.push(`C${temp[0][1]}0`);
                        if(temp[0][2]>0){soundQueue.push(`C${temp[0][2]}`);}
                    }
                break;
            }

            soundQueue.push(hlaseni.smer);
            try {
                if(liveData.linkaActive){
                    soundQueue.push(gtfsToNodeID(data.stops[data.stops.length-1].stop_id));
                }
                else{
                    soundQueue.push(data.cilId);
                }
            } catch (error) {
                console.error(error);
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
            sendAnnouncementData(hlaseniDefinice.konecnaZastavka);
        } 
    vyhlas();
}

function vyhlas() {
    if(soundQueue.length == 0){
        playing = false;
        return;
    }

    playing = true;


    //announcement.src = "./HLASENI_haz/" + soundQueue.shift() + ".mp3";
    announcement.src = "./HLASENI_von/" + soundQueue.shift() + ".ogg";

    announcement.play();



}
announcement.addEventListener("error", error => {
    console.error(error);
    vyhlas();
})

announcement.addEventListener("ended", vyhlas);

function getTransfers(node){
    let stopTransfers = [];
    let searchResult = stops.stopGroups.filter((elm) => elm.node == gtfsToNodeID(data.stops[liveData.stopIndex].stop.properties.stop_id));
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
    console.log("Minuty: " + mins);
    while(mins >= 1440){
        mins -= 1440;
    }
    let hour = String(Math.floor(mins / 60));
    let minute = String(mins % 60);
    return String(`${hour.padStart(2,"0")}:${minute.padStart(2,"0")}`);
}

function gtfsToNodeID(gtfs){
    return Number(gtfs.split("Z")[0].slice(1));
}

function loadTerminusData(){
    console.log("Načítám data pro konečnou s NodeID = " + data.cilId);
    let stop = stops.stopGroups.filter((elm) => elm.node == data.cilId)[0];
    let route = routes.filter((elm) => elm.route_id == ("L" + Number(data.slLinka)))[0];
    let send = {};
    document.getElementById("homeJmenoZast").innerHTML = shortenString(stop.name, 12);
    
    send.type = "";
    send.stops = [];
    send.dest = stop.name;
    send.destZone = stop.stops[0].zone;
    if(route == undefined){
        send.type = "regbus";
        send.line = Number(data.slLinka);
    }
    else{
        send.line = route.route_short_name;
        if(route.is_night == true){
            send.type += "night ";
        }
        if(route.is_regional == true){
            send.type += "reg";
        }
        switch (route.route_type) {
            case "0":
                send.type += "tram";
            break;
            case "1":
                send.type = "metro";
                send.type += route.route_short_name;
            break;
            case "2":
                send.type = "train";
            break;
            case "3":
                send.type += "bus";
            break;
            case "4":
                send.type += "ferry";
            break;
            case "7":
                send.type += "funicular";
            break;
            case "11":
                send.type += "tbus";
            break;
        }
        if(route.is_substitute_transport == true){
            send.type += " replacement";
        }
    }

    console.log(send);

    sendTripData(send);
}