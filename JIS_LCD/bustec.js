let connectionInterval, stopIndex = 0, data, clockInterval, ipAddr, casovac, vehInStop, wsData, announcement = false, announcementTimeout, linkaActive = false, prevData;
let connectionReady = false;
let npDataInit = false;
let npCasovac = 0;

const socket = new WebSocket("ws://192.168.2.67:3001");
const inputType = 1;
//0 = default websocket, 1 = nabourani konektelu

//const panelType = 1; => definovano v <script></> kazde HTML stranky panelu
//0 = bustec standard pid, 1 = kazidlo od necitelne prahy

// Connection opened
if(inputType == 0){
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
}

function init(){
    casovac = Date.now();
    clockInterval = setInterval(() => {
        hodiny();
    }, 1000);
    if(panelType == 0){
        document.getElementById("diversion").hidden = true;
        document.getElementById("announcementContainer").hidden = true;
    }
    
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
    //console.log(data);
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
        if(npDataInit && vehInStop == false){
            npDataInit = false;
        }
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
    if(inputType == 1){
        (async () => {
            console.log("spuštěn konektel fetcher 5000");
            let temp = await fetchKonektelData();
            let str = JSON.stringify(temp);
            if(str != prevData){
                if(panelType == 0){
                    updateData(temp.data, temp.unknownData);
                    vehicleInStop(temp.vehInStop);
                }
                else if(panelType == 1){
                    vehInStop = temp.vehInStop;
                    necitelnaPraha(temp.data);
                }
                
                prevData = str;
                linkaActive = temp.data.stops.length > 0 ? true : false;
            }
            
        })();
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
    if(panelType == 0){
        document.getElementById("indexZastavky").innerHTML = "Index zastávky: " + stopIndex;
        document.getElementById("mainDiv").className = "departures " + data.type;
        if(data.type.endsWith("replacement")){
            document.getElementById("diversion").hidden = false;
        }
        else{
            document.getElementById("diversion").hidden = true;   
        }
    }

    document.getElementById("line").innerHTML = data.line;
    if(panelType == 0){
        document.getElementById("line").className = "line " + data.type;
    }
    if(data.stops.length > 1 || panelType == 0){
        document.getElementById("destination").innerHTML = data.dest;
        if(panelType == 1){
            data.stops.pop();
        }
    }
    else{
        document.getElementById("destination").innerHTML = "&nbsp;";
    }
    
    let cilTransfers = "";
    if(!mode){
        data.stops[data.stops.length-1].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    cilTransfers += `<img src="../src/icons/${transfer}.svg" height="74px">`;
            }}
        );
        if(panelType == 0){
            document.getElementById("destination").innerHTML += cilTransfers;
        }
    }
    if(panelType == 1){
        if(!(data.stops[stopIndex+6+npStopOffset] == undefined)){
            document.getElementById("stop6").innerHTML = data.stops[stopIndex+6+npStopOffset].name;
            let transfers = "";
            data.stops[stopIndex+6+npStopOffset].transfers.forEach(transfer => {
                if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                        transfers += `<img src="../src/icons/${transfer}.svg" height="60px">`;
                }}
            );
            if(panelType == 0){
                document.getElementById("stop6").innerHTML += transfers;
            }
        }
        else{
            document.getElementById("stop6").innerHTML = "  ";
        }     

        if(!(data.stops[stopIndex+5+npStopOffset] == undefined)){
            document.getElementById("zone5").innerHTML = data.stops[stopIndex+5+npStopOffset].zone;
            document.getElementById("stop5").innerHTML = data.stops[stopIndex+5+npStopOffset].name;
            let transfers = "";
            data.stops[stopIndex+5+npStopOffset].transfers.forEach(transfer => {
                if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                        transfers += `<img src="../src/icons/${transfer}.svg" height="60px">`;
                }}
            );
            if(panelType == 0){
                document.getElementById("stop5").innerHTML += transfers;
            }
        }
        else{
            document.getElementById("zone5").innerHTML = "  ";
            document.getElementById("stop5").innerHTML = "  ";
        }        
    }

    if(!(data.stops[stopIndex+4+npStopOffset] == undefined)){
        document.getElementById("zone4").innerHTML = data.stops[stopIndex+4+npStopOffset].zone;
        document.getElementById("stop4").innerHTML = data.stops[stopIndex+4+npStopOffset].name;
        let transfers = "";
        data.stops[stopIndex+4+npStopOffset].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    transfers += `<img src="../src/icons/${transfer}.svg" height="60px">`;
            }}
        );
            if(panelType == 0){
                document.getElementById("stop4").innerHTML += transfers;
            }
    }
    else{
        document.getElementById("zone4").innerHTML = "  ";
        document.getElementById("stop4").innerHTML = "  ";
    }

    if(!(data.stops[stopIndex+3+npStopOffset] == undefined)){
        document.getElementById("zone3").innerHTML = data.stops[stopIndex+3+npStopOffset].zone;
        document.getElementById("stop3").innerHTML = data.stops[stopIndex+3+npStopOffset].name;
        let transfers = "";
        data.stops[stopIndex+3+npStopOffset].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    transfers += `<img src="../src/icons/${transfer}.svg" height="60px">`;
            }}
        );
            if(panelType == 0){
                document.getElementById("stop3").innerHTML += transfers;
            }
    }
    else{
        document.getElementById("zone3").innerHTML = "  ";
        document.getElementById("stop3").innerHTML = "  ";
    }

    if(!(data.stops[stopIndex+2+npStopOffset] == undefined)){
        document.getElementById("zone2").innerHTML = data.stops[stopIndex+2+npStopOffset].zone;
        document.getElementById("stop2").innerHTML = data.stops[stopIndex+2+npStopOffset].name;
            let transfers = "";
        data.stops[stopIndex+2+npStopOffset].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    transfers += `<img src="../src/icons/${transfer}.svg" height="60px">`;
            }}
        );
            if(panelType == 0){
                document.getElementById("stop2").innerHTML += transfers;
            }
    }
    else{
        document.getElementById("zone2").innerHTML = "  ";
        document.getElementById("stop2").innerHTML = "  ";
    }

    if(!(data.stops[stopIndex+1+npStopOffset] == undefined)){
        document.getElementById("zone1").innerHTML = data.stops[stopIndex+1+npStopOffset].zone;
        document.getElementById("stop1").innerHTML = data.stops[stopIndex+1+npStopOffset].name;
        let transfers = "";
        data.stops[stopIndex+1+npStopOffset].transfers.forEach(transfer => {
            if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                    transfers += `<img src="../src/icons/${transfer}.svg" height="60px"> `;
            }}
        );
            if(panelType == 0){
                document.getElementById("stop1").innerHTML += transfers;
            }
    }
    else{
        document.getElementById("zone1").innerHTML = "  ";
        document.getElementById("stop1").innerHTML = "  ";
    }
    if(!(data.stops[stopIndex+npStopOffset] == undefined)){
        document.getElementById("zone0").innerHTML = data.stops[stopIndex+npStopOffset].zone;
        document.getElementById("stop0").innerHTML = data.stops[stopIndex+npStopOffset].name;
        if(data.stops[stopIndex+npStopOffset].transfers.length > 0 && !data.type.startsWith("night") && !mode){
            let transfers = "";
            data.stops[stopIndex+npStopOffset].transfers.forEach(transfer => {
                if(transfer != "tram" && transfer != "bus" && transfer != "trolleybus" && !(data.type.startsWith("night"))){
                        transfers += `<img src="../src/icons/${transfer}.svg" height="75px"> `;
                }}
            );
            if(panelType == 0){
                document.getElementById("transferTypes").innerHTML = transfers;
                document.getElementById("transfers").hidden = false;
                console.log("máme přestupy");
            }
        }
        else{
            if(panelType == 0){
                document.getElementById("transfers").hidden = true;
                console.log("nemáme přestupy");
            }
        }
    }
    else{
        document.getElementById("zone0").innerHTML = data.destZone;
        document.getElementById("stop0").innerHTML = data.dest;
    }

    let zbyvajiciZastavky = data.stops.length - stopIndex;
    if(panelType == 0){
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

    }}
    else if(panelType == 1){
        let dots = document.querySelectorAll('[data-poletyp="upStopDot"]');
        let mins = document.getElementsByClassName("stopMin");
        let i = 0;
        if(data.stops.length < 8){
            console.log("máme míň jak 8 zastávek");
            document.getElementById("viaStops").style.backgroundColor = "transparent";
            document.getElementById("viaStopDots").style.borderColor = "transparent";
            for (const element of dots) {
                console.log("Index loopu: " + i + "// Objekt zastávky: " + data.stops[i]);
                if(data.stops[i] == undefined){
                    element.style = "transition: none; border-color: transparent; background-color: transparent;";
                    if(mins[i] != undefined){
                        mins[i].style = "transition: none; border-color: transparent; background-color: transparent; color: transparent;";
                    }
                    //element.className = "no-dot";
                }
                else{
                    element.style = "";
                    if(mins[i] != undefined){
                        mins[i].style = "";
                    }
                    /*
                    if(i == 0){
                        i++;
                        continue;
                    }
                    else if(i == 1){
                        element.className = "stop-dot-first";
                    }
                    else if(i == 6){
                        element.className = "stop-dot-last";
                    }
                    else{
                        element.className = "stop-dot";
                    }*/
                }
                i++;
            }
        }
        else{
            console.log("máme víc jak 8 zastávek");
            document.getElementById("viaStops").style.backgroundColor = "";
            document.getElementById("viaStopDots").style.borderColor = "";
            document.documentElement.style.setProperty("--cara-bottom-offset", "120px");
            for (const element of dots) {
                    if(i == 0){
                        i++;
                        continue;
                    }
                    else if(i == 1){
                        element.className = "stop-dot-first";
                    }
                    else if(i == 6){
                        element.className = "stop-dot-last";
                    }
                    else{
                        element.className = "stop-dot";
                    }
                i++;
            }
        }
    }
    
    //getNextStopDepartures(data.stops[stopIndex].cisId);
    
}

function vehicleInStop(goo){
    if(goo != undefined){
        vehInStop = goo;
        if(panelType == 1){
            necitelnaPraha();
            return;
        }
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
    let result;
    if(inputType == 0){
        result = await fetch(`https://api.golemio.cz/v2/pid/departureboards?cisIds=${id}&filter=routeHeadingOnce&total=12`, fetchOpt);
    }
    else if(inputType == 1){
        result = await fetch(`https://api.golemio.cz/v2/pid/departureboards?names=${data.stops[stopIndex].name}&filter=routeHeadingOnce&total=12`, fetchOpt);
    }
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
    if(panelType == 0){
        document.getElementById("upcomingStopsInfoPane").innerHTML = toAdd;
    }
}

let npStopOffset = 0;
let npPrevData = {};
let npAnimRunning = false;
let npReturn = false;

function necitelnaPraha(npData){
    let inv = !vehInStop;
    document.documentElement.style.setProperty("--laststop-koule", npData.stops.length == 1 ? "transparent" : "var(--cerna-text)");
    document.documentElement.style.setProperty("--cara-bottom-offset", npData.stops.length == 1 ? "920px" : "80px");
    document.getElementById("lastStopStrizka").className = npData.stops.length == 1 ? "move" : "";

    npReturn = false;
    if(JSON.stringify(npPrevData) == "{}" ){//při čistém definování
        console.log("First definigtion");
        npAnimUpdate(undefined, npData);
        npPrevData = JSON.parse(JSON.stringify(npData));
        return;
    }

    if(npPrevData.stops.length - npData.stops.length != 0){  //posun či posun
        npAnimUpdate(undefined, npData);
        npPrevData = JSON.parse(JSON.stringify(npData));
        return;
    }

    if(npData.line != npPrevData.line){ //změna linky
        npAnimUpdate(undefined, npData);
        npPrevData = JSON.parse(JSON.stringify(npData));
        return;
    }

    console.warn(vehInStop ? "Vozidlo přijelo na zastávku" : "Vozidlo vyjelo ze zastávky");
    console.log(npPrevData);
    console.warn("Prev len: " + npPrevData.stops.length);
    console.log(npData);
    console.warn("New len: " + npData.stops.length);
    console.warn("Changed by: " + String(npPrevData.stops.length - npData.stops.length));

    //když vozidlo bylo v zastávce (čili poslední stav proměnné vehInStop byl true, jenže na konci této funkce je negace)
    if(!inv){
        updateData(npData);
        //provede změnu barev na
        document.getElementsByClassName("nextStop")[0].classList.remove("plsAppear");
        document.getElementsByClassName("linkabg")[0].style.width = inv ? "360px" : "var(--fullsirka)";
        document.getElementById("nextStopMinutes").style.color = !inv ? "transparent" : "";
        document.documentElement.style.setProperty("--nextstop-text", (inv ? "white" : "rgba(29, 29, 29)"));
        document.documentElement.style.setProperty("--nextstop-koule", (inv ? "rgba(53, 53, 53)" :"white" ));
        if(data.stops.length > 1){
            document.getElementById("lastStopDot").className = "";
            document.getElementById("lastStopDot").style.color = "";
        }
    }
    else{
        document.getElementsByClassName("linkabg")[0].style.width = inv ? "360px" : "var(--fullsirka)";
        document.documentElement.style.setProperty("--nextstop-text", (inv ? "white" : "rgba(29, 29, 29)"));
        document.documentElement.style.setProperty("--nextstop-koule", (inv ? "rgba(53, 53, 53)" :"white" ));
        document.getElementById("destination").className = npData.stops.length == 1 ? "move" : "";
        let upStops = document.querySelectorAll('[data-poletyp="upStop"]');
        let dots = document.querySelectorAll('[data-poletyp="upStopDot"]')
        for (const element of dots) {
            element.classList.add("move");
        }           
        for (const element of upStops) {
            element.classList.add("move");
        }
        if(data.stops.length == 1){
            document.getElementById("lastStopDot").className = "move";
        }
        else{
            document.getElementById("lastStopDot").className = "";
            document.getElementById("lastStopDot").style.color = "";

        }
        console.log("Před timeoutem");

        npAnimRunning = true;
        
        setTimeout(() => {
            if(npData.stops.length == 1){
                document.getElementById("lastStopDot").style = "background-color: transparent; transition: none;";
                document.getElementById("lastStopDot").className = "";
            }

            console.log("V timeoutu");
            //document.getElementsByClassName("nextStop")[0].classList.add("plsAppear");
            if(document.getElementById("stop0").innerHTML == npData.stops[0].name && npAnimRunning == false){ //když se názvy shodujou
                console.error("CHYBA, shodující se názvy, napsaný: " + document.getElementById("stop0").innerHTML + " z dat: " + npData.stops[0].name);
                npStopOffset = 1;
            }
            else{
                console.info("Navracím stopOffset zpátky");
                npStopOffset = 0;
            }
            let i = 0;
            for (const element of upStops) {
                element.classList.remove("move");
                i++;
            }
            for (const element of dots) {
                element.classList.remove("move");
            }
            npAnimRunning = false;
            updateData(npData);
        }, animDuration*2);
    }
    npPrevData = JSON.parse(JSON.stringify(npData));
}

function npAnimUpdate(mode,npData){
    let stopEl;
    let dotEl;
    if(mode == "line" || mode == undefined){
        document.getElementById("line").style.color = "transparent";
    }

    if(mode == "stops" || mode == undefined){
        stopEl = document.querySelectorAll('[data-poletyp="upStop"]');
        dotEl = document.querySelectorAll('[data-poletyp="upStopDot"]');
        minEl = document.getElementsByClassName("stopMin");
        for (const element of stopEl) {
            element.style.color = "transparent";
        }
        for (const element of dotEl) {
            element.style = "border-color: transparent; background-color: transparent;";
        }
        document.getElementById("nextStopMinutes").style = "color: transparent;"
        for (const element of minEl) {
            element.style = "color: transparent;";
        }        
        if(npData.stops.length < 8){
            document.getElementById("viaStops").style.backgroundColor = "transparent";
            document.getElementById("viaStopDots").style.borderColor = "transparent";
        }
        else{
            document.getElementById("viaStops").style.backgroundColor = "";
            document.getElementById("viaStopDots").style.borderColor = "";
        }
    }

    if(mode == "dest" || mode == undefined){
        document.getElementById("destination").style.color = "transparent";
    }
            
    setTimeout(() => {
        updateData(npData);
        document.getElementById("line").style.color = "";
        document.getElementById("destination").style.color = "";
        for (const element of stopEl) {
            element.style.color = "";
        }
        if(npData.stops.length >= 8){
            for (const element of dotEl) {
                element.style = "";
            }
        }
    }, animDuration)
}