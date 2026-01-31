let connectionInterval, stopIndex = 0, data, clockInterval, ipAddr, casovac, vehInStop, wsData, announcement = false, announcementTimeout, linkaActive = false;
let connectionReady = false;

const socket = new WebSocket("ws://192.168.2.67:3001");


// Connection opened
socket.addEventListener("open", (event) => {
    console.log("BUSTEC CLIENT WS LOADED");
    socket.send(JSON.stringify({
      "name": "bustec",
      "type": "ois",
      "data": "placeholder"
    }))
})


// Listen for messages
socket.addEventListener("message", (msg) => {  
    wsData = JSON.parse(msg.data);
    console.log(wsData);
    if(wsData.dataType == "routeData"){
        if(announcement){
            announcement = false;
            document.getElementsByClassName("upcomingStopsContainer")[0].hidden = false;
            document.getElementById("announcementContainer").hidden = true;
        }

        updateData(wsData.data, false);
        console.log(wsData);

    }
    else if(wsData.dataType == "liveData"){
        stopIndex = wsData.data.stopIndex;
        linkaActive = wsData.data.linkaActive;
        vehicleInStop(wsData.data.vehInStop);
        updateTextFields();
    }
    else if(wsData.dataType == "annData"){
        announcement = true;
        for (const element of document.getElementsByClassName("upcomingStopsContainer")) {
            element.hidden = true;
            console.log("Skrývám todle:");
            console.log(element);
        }
        document.getElementById("announcementContainer").hidden = false;
        announcementTimeout = wsData.data.timeout;
        document.getElementById("announcementCZText").innerHTML = wsData.data.cz.text;
        document.getElementById("announcementCZText").style.fontSize = wsData.data.cz.size;
        document.getElementById("announcementENText").innerHTML = wsData.data.en.text;
        document.getElementById("announcementENText").style.fontSize = wsData.data.en.size;
    }
    else if(wsData.dataType == "unknwRouteData"){
        updateData(wsData.data, true);
    }
});

function init(){
    casovac = Date.now();
    clockInterval = setInterval(() => {
        hodiny();
    }, 1000);
    document.getElementById("diversion").hidden = true;
    document.getElementById("announcementContainer").hidden = true;
    
}

async function connect(){
    ipAddr = document.getElementById("serverIP").value;
    console.log(ipAddr);
    let regex = /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if(!regex.test(ipAddr) || ipAddr == ""){
        alert("Prázdná či neplatná IP adresa!");
        return;
    }

    try {
        const res = await fetch(`http://${ipAddr}:3000/status`, {method: "GET"});
        const status = await res.json();
        if(status.ready){
            document.getElementById("result").innerHTML = "Server OK! <br>";
            document.getElementById("result").innerHTML += "ver: " + status.ver;
            //connectionInterval = setInterval(updateData(), 60000);
            connectionReady = true;
        }
    } catch (err) {
            document.getElementById("result").innerHTML = "Server ERR! <br>";
            document.getElementById("result").innerHTML += err;
            connectionReady = false;
    }
}

async function updateData(inputData, mode) {
    if(inputData == undefined){
        const res = await fetch(`http://${ipAddr}:3000/bustec`, {method: "GET"});
        data = await res.json(); 
    }
    else{
        data = inputData;
    }
    console.log(data);
    stopIndex = 0;
    updateTextFields(mode);
}

function hodiny(){
    const date = new Date();
    const ted = Date.now();
    let hh = String(date.getHours()).padStart(2, "0");
    let mm = String(date.getMinutes()).padStart(2, "0");
    document.getElementById("time").innerHTML = `${hh}:${mm}`;
    //console.log((casovac - ted) / 1000 );
    //console.log("Update hodin ted!");
    if((((ted - casovac) / 1000) > 10)){
        if(!(vehInStop || announcement) && linkaActive){
            console.log("Snaha o přepnutí:");
            for (const element of document.getElementsByClassName("upcomingStopsContainer")) {
                element.hidden = !element.hidden;
            }
            console.log("Prepnuto snad");
        }
        else if(announcement){
            for (const element of document.getElementsByClassName("upcomingStopsContainer")) {
                element.hidden = true;
            }
        }
        casovac = Date.now();
       
    }

    if(announcementTimeout > 1 && casovac > announcementTimeout){
        announcement = false;
    }
}

function posunZastavky(smer){
    if(smer == "+"){
        if(stopIndex < data.stops.length-1){
            stopIndex++;
            updateTextFields();
            //getNextStopDepartures(data.stops[stopIndex].cisId);
        }
    }
    else{
        if(stopIndex > 0){
            stopIndex--;
            updateTextFields();
            //getNextStopDepartures(data.stops[stopIndex].cisId);
        }
    }
    
}

function updateTextFields(mode){
    document.getElementById("indexZastavky").innerHTML = "Index zastávky: " + stopIndex;
    document.getElementById("line").innerHTML = data.line;
    document.getElementById("line").className = "line " + data.type;
    if(data.type.endsWith("replacement")){
        document.getElementById("diversion").hidden = false;
    }
    else{
        document.getElementById("diversion").hidden = true;   
    }
    document.getElementById("mainDiv").className = "departures " + data.type;
    document.getElementById("destination").innerHTML = data.dest;
    
    let cilTransfers = "";
    if(!mode){
        data.stops[data.stops.length-1].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    cilTransfers += `<img src="../src/icons/${transfer}.svg" height="74px">`;
            }}
        );
        document.getElementById("destination").innerHTML += cilTransfers;
    }

    if(!(data.stops[stopIndex+4] == undefined)){
        document.getElementById("zone4").innerHTML = data.stops[stopIndex+4].zone;
        document.getElementById("stop4").innerHTML = data.stops[stopIndex+4].name;
        let transfers = "";
        data.stops[stopIndex+4].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    transfers += `<img src="../src/icons/${transfer}.svg" height="60px">`;
            }}
        );
        document.getElementById("stop4").innerHTML += transfers;
    }
    else{
        document.getElementById("zone4").innerHTML = "  ";
        document.getElementById("stop4").innerHTML = "  ";
    }

    if(!(data.stops[stopIndex+3] == undefined)){
        document.getElementById("zone3").innerHTML = data.stops[stopIndex+3].zone;
        document.getElementById("stop3").innerHTML = data.stops[stopIndex+3].name;
        let transfers = "";
        data.stops[stopIndex+3].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    transfers += `<img src="../src/icons/${transfer}.svg" height="60px">`;
            }}
        );
        document.getElementById("stop3").innerHTML += transfers;
    }
    else{
        document.getElementById("zone3").innerHTML = "  ";
        document.getElementById("stop3").innerHTML = "  ";
    }

    if(!(data.stops[stopIndex+2] == undefined)){
        document.getElementById("zone2").innerHTML = data.stops[stopIndex+2].zone;
        document.getElementById("stop2").innerHTML = data.stops[stopIndex+2].name;
            let transfers = "";
        data.stops[stopIndex+2].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    transfers += `<img src="../src/icons/${transfer}.svg" height="60px">`;
            }}
        );
        document.getElementById("stop2").innerHTML += transfers;
    }
    else{
        document.getElementById("zone2").innerHTML = "  ";
        document.getElementById("stop2").innerHTML = "  ";
    }

    if(!(data.stops[stopIndex+1] == undefined)){
        document.getElementById("zone1").innerHTML = data.stops[stopIndex+1].zone;
        document.getElementById("stop1").innerHTML = data.stops[stopIndex+1].name;
        let transfers = "";
        data.stops[stopIndex+1].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    transfers += `<img src="../src/icons/${transfer}.svg" height="60px"> `;
            }}
        );
        document.getElementById("stop1").innerHTML += transfers;
    }
    else{
        document.getElementById("zone1").innerHTML = "  ";
        document.getElementById("stop1").innerHTML = "  ";
    }
    if(!(data.stops[stopIndex] == undefined)){
        document.getElementById("zone0").innerHTML = data.stops[stopIndex].zone;
        document.getElementById("stop0").innerHTML = data.stops[stopIndex].name;
        if(data.stops[stopIndex].transfers.length > 0 && !data.type.startsWith("night") && !mode){
            let transfers = "";
            data.stops[stopIndex].transfers.forEach(transfer => {
                if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                        transfers += `<img src="../src/icons/${transfer}.svg" height="75px"> `;
                }}
            );
            document.getElementById("transferTypes").innerHTML = transfers;
            document.getElementById("transfers").hidden = false;
            console.log("máme přestupy");
        }
        else{
            document.getElementById("transfers").hidden = true;
            console.log("nemáme přestupy");
        }
    }
    else{
        document.getElementById("zone0").innerHTML = data.destZone;
        document.getElementById("stop0").innerHTML = data.dest;
    }

    let zbyvajiciZastavky = data.stops.length - stopIndex;

    let sipecky = Array.from(document.querySelectorAll('[data-group="stopMarkers"]')).reverse();
    console.log(sipecky);
    if(zbyvajiciZastavky <= 5){
        sipecky.slice(-2)[0].hidden = false;
        sipecky.slice(-2)[1].hidden = true;
    }
    else{
        sipecky.slice(-2)[0].hidden = true;
        sipecky.slice(-2)[1].hidden = false;

    }
    for (let i = 0; i < sipecky.length - 1; i++) {
        const element = sipecky[i];
        zbyvajiciZastavky = (zbyvajiciZastavky == 0) ? 1 : zbyvajiciZastavky;
        //sipka4 | sipka4end => 9 | 8 => zbývá 5 zastávek
        //sipka3 | sipka3end => 7 | 6 => zbývá 4 zastávky
        //sipka2 | sipka2end => 5 | 4 => zbývá 3 zastávky
        //sipka1 | sipka1end => 3 | 2 => zbývá 2 zastávky
        //sipka0 | sipka0end => 1 | 0 => zbývá 1 zastávka
        if(zbyvajiciZastavky == Math.floor(i/2)+1){
            element.hidden = ((i % 2) > 0); //jestli je sudy tak se skryje
            if((i % 2) > 0){//lichy => sipka base
                console.log("sipkabase na: " + i + " je hidden");3
                element.hidden = true;
            }
            else{//sudy => sipka end
                console.log("sipkaend na: " + i + " je shown");
                element.hidden = false;
            }
        }
        else if(zbyvajiciZastavky < Math.floor(i/2)+1){
            console.log("sipka na: " + i + " je hidden");
            element.hidden = true;
        }
        else{
            if((i % 2) > 0){//lichy => sipka base
                console.log("sipkabase na: " + i + " je shown");
                element.hidden = false;
            }
            else{//sudy => sipka end
                console.log("sipkaend na: " + i + " je hidden");
                element.hidden = true;

            }
        }

    }
    getNextStopDepartures(data.stops[stopIndex].cisId);
    
}

function vehicleInStop(goo){
    if(goo != undefined){
        vehInStop = goo;
    }
    else{
        vehInStop = document.getElementById("zastavkaBtn").checked;
    }
    
    if(vehInStop){
        document.getElementById("nextStopContainer").classList.add("active");
        document.getElementById("nextStopContent").classList.add("active");

        document.getElementById("nextStopHelperCZ").innerHTML = "Zastávka ";
        document.getElementById("nextStopHelperEN").innerHTML = "&nbsp;/ This stop";
        document.getElementsByClassName("upcomingStopsContainer")[0].hidden = announcement ? true : false;
        document.getElementsByClassName("upcomingStopsContainer")[1].hidden = true;

    }
    else{
        document.getElementById("nextStopContainer").classList.remove("active");
        document.getElementById("nextStopContent").classList.remove("active");
        casovac = Date.now();
        document.getElementById("nextStopHelperCZ").innerHTML = "Příští zastávka ";
        document.getElementById("nextStopHelperEN").innerHTML = "&nbsp;/ Next stop";
    }
}

async function getNextStopDepartures(id) {
    let response = await fetch("../options.json");
    let fetchOpt = await response.json();
    const result = await fetch(`https://api.golemio.cz/v2/pid/departureboards?cisIds=${id}&filter=routeHeadingOnce&total=12`, fetchOpt);
    const mezi = await result.json();
    const departures = mezi.departures;
    let toAdd = "";
    let noMoreDeparturesTextAdded = false;
    //console.log(JSON.stringify(departures));

    for (let i = 0; i < 12; i++) {
        //console.log(departures[i]);
        const dep = departures[i];
        //console.log(dep);
        if(departures[i] == undefined){
            if(noMoreDeparturesTextAdded){
                toAdd += `<div></div>`;
            }
            else{
                noMoreDeparturesTextAdded = true;
                toAdd += `<div class="noMoreDeps">– Žádné další odjezdy v následujících 30 min. –</div>`;
            }
            continue;
        }

        let m = dep.departure_timestamp.minutes;
        if(parseInt(m) > 30){
            if(noMoreDeparturesTextAdded){
                toAdd += `<div></div>`;
            }
            else{
                noMoreDeparturesTextAdded = true;
                toAdd += `<div class="noMoreDeps">– Žádné další odjezdy v následujících 30 min. –</div>`;
            }
            continue;
        }

        if(data.line == dep.route.short_name){
            departures.splice(i, 1);
            i--;
            continue;
        }
        else{
            let linka = dep.route.short_name;
            let smer = dep.trip.headsign;
            if((data.stops[stopIndex].zone == "P" || data.stops[stopIndex].zone == "0" || data.stops[stopIndex].zone == "B") && smer.startsWith("Praha")){
                smer = smer.slice(6);
            }
            let nastupiste = dep.stop.platform_code;
            let typ = "";
            if(dep.route.is_night){
                typ += "night ";
            }
            if(dep.route.is_regional){
                typ += "reg";
            }
            if(dep.route.is_substitute_transport){
                typ += "replacement ";
            }
            switch (dep.route.type) {
                case 0:
                    typ += "tram";
                break;
                case 1:
                    typ = "";
                    linka = `<img height="64px" src="../src/icons/metro${linka}.svg">`;
                    nastupiste = "M";
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
            toAdd += `<div><span class="line ${typ}">${linka}</span><img height="25px" src="../src/icons/arrow.svg" class="arrow"><span class="destination">${smer}</span><span class="platform">${nastupiste}</span><span class="time"><b>${m}</b> min.</span></div>`;
        }
    }
    document.getElementById("upcomingStopsInfoPane").innerHTML = toAdd;
}
