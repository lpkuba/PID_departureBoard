const express = require("express");
const cors = require("cors");
const fs = require("fs");
const csv = require('csv-parser');
const Fuse = require("fuse.js");
const app = express();
const { WebSocketServer } = require('ws');
const serverVersion = "0.0.4";
let data = null;
let prevWsData = null;
let wsData = null;

console.log("OIS SERVER INIT VERSION: " + serverVersion);

const wss = new WebSocketServer({port: 3001});
console.log("WS server připraven! Adresa: " + wss.address().address + wss.address().port);
const clients = [];
wss.on('error', console.error);
wss.on('connection', ws => {
    ws.on('message', msg =>{
        wsData = JSON.parse(msg.toString());
        let string = msg.toString();
        //console.log(prevWsData);
        //console.log(string);
        if(string == prevWsData && wsData.dataType != undefined){
            console.log("Přišla duplicitní zpráva!");
            return;
        }
        prevWsData = string;
        //console.log(wsData);
        
        let sendData = "";
        if(ws.name == "pp"){
            console.log("Příchozí zpráva z PPčka!");
            if(wsData.dataType == "routeData"){
                //console.log("Před asyncem");
                //console.log(wsData.data.trip_id);
                (async () => {
                    //console.log("V asyncu");
                    wsData.data = await setBustecTrip(wsData.data.trip_id);
                    wsData.dataType = "routeData";
                    let bustecClients = clients.filter((client) => client.name == "bustec");
                    for (let i = 0; i < bustecClients.length; i++) {
                        const element = bustecClients[i];
                        element.send(JSON.stringify(wsData));
                    }
                })();
            }
            else{
                let bustecClients = clients.filter((client) => client.name == "bustec");
                for (let i = 0; i < bustecClients.length; i++) {
                    const element = bustecClients[i];
                    element.send(JSON.stringify(wsData));
                }
            }

            
        }
        else{
            if (wsData.type === 'ois') {
              ws.name = wsData.name;
              clients.push(ws);
              console.log('Připojen:', ws.name);
            }
        }
    });
    ws.on('close', () =>{
        const index = clients.indexOf(ws);
        if(index !== -1){
            clients.splice(index, 1);
        }
    })
})

const fetchOpt = require("./options.json");
const stops = require("./src/stops.json");
const fuse = new Fuse(stops.stopGroups,{
        keys: [{name:'uniqueName', weight: 3}, {name:'stops.altIdosName', weight: 1}],
        threshold: 0.3,
        limit: 10
});


let serverReady = false;

app.use(express.json());
app.use(cors());

app.post("/bustec", (req, res) => {
    //console.log(req.body);
    //console.log("tohle má být IDčko");
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.json({ ok: true });
    setBustecTrip(req.body.idTrip);
})

app.get("/status", (req, res) =>{
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.send({
        ver: serverVersion,
        ready: serverReady
    });
})

app.get("/bustec", (req, res) =>{
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.send(data);
})
app.listen(3000, () => {
  console.log('Express server spuštěn! ADR: http://localhost:3000');
  serverReady = true;
});

async function setBustecTrip(tripId) {
    //console.log("před promise v setBustecTrip");
    return new Promise(async (resolve, reject) => {
    //console.log("FOREACH!!!!");
    //console.log(tripId);
    let tripInfo = {};
    try {
        const response = await fetch(`https://api.golemio.cz/v2/gtfs/trips/${tripId}?includeShapes=false&includeStops=true&includeStopTimes=true&includeService=false&includeRoute=true`, fetchOpt);
        tripInfo = await response.json();        
    } catch (err) {
        console.error(err);
        reject(err);
        return;
    }

    //zde dodělat aktuální pozici podle času
    //console.log(tripInfo);
    let trip = {
        type: "",
        typeId: 0,
        line: "",
        dest: "",
        id: "",
        stops: []
    };
    
        if(tripInfo.route.is_night){
            trip.type += "night ";
        }
        if(tripInfo.route.is_regional){
            trip.type += "reg";
        }
        switch (tripInfo.route.route_type) {
            case 0:
                trip.type += "tram";
            break;
            case 1:
                trip.type = "metro";
                trip.type += tripInfo.route.route_short_name;
            break;
            case 2:
                trip.type = "train";
            break;
            case 3:
                trip.type += "bus";
            break;
            case 4:
                trip.type += "ferry";
            break;
            case 7:
                trip.type += "funicular";
            break;
            case 11:
                trip.type += "tbus";
            break;
        }
        if(tripInfo.route.is_substitute_transport){
            trip.type += " replacement";
        }
    trip.line = tripInfo.route.route_short_name;
    if(tripInfo.trip_headsign.startsWith("Praha,")){
        trip.dest = tripInfo.trip_headsign.slice(6);
    }
    else{
        trip.dest = tripInfo.trip_headsign;
    }
    trip.id = tripId;
    trip.typeId = tripInfo.route.route_type;
    trip.stops = [];
    tripInfo.stop_times.forEach(element => {
        const stop = element.stop.properties;
        if(stop.zone_id != null){
            let stopTransfers = [];
            //let searchResult = fuse.search(stop.stop_name).slice(0,1);
            let searchResult = stops.stopGroups.filter((data) => data.node == parseInt(stop.stop_id.split("Z")[0].slice(1)));
            for (let i = 0; i < searchResult.length; i++) {
                const zastavka = searchResult[i];
                for (let x = 0; x < zastavka.stops.length; x++) {
                    const nastupiste = zastavka.stops[x];
                    for (let y = 0; y < nastupiste.lines.length; y++) {
                        const linka = nastupiste.lines[y];
                        if(linka.type == "metro"){
                            if(!stopTransfers.includes(linka.type + linka.name)){
                                stopTransfers.push(linka.type + linka.name);
                            }
                        }
                        else{
                            if(!stopTransfers.includes(linka.type) && !linka.type.endsWith("tram") && !linka.type.endsWith("bus") && !compareTypes(linka.type, tripInfo.route.route_type)){
                                //console.log("Pushuju: " + linka.type);
                                stopTransfers.push(linka.type);
                            }
                        }
                    }
                }
            }
            trip.stops.push({name: stop.stop_name, zone: stop.zone_id, platform: stop.platform_code, transfers: stopTransfers, cisId: searchResult[0].cis});
        }
    });
    data = trip;
    resolve(data);
    })
}

function compareTypes(str, num){
    let temp = "";

    switch (num) {
        case 0:
            temp = "tram";
        break;
        case 1:
            temp = "metro";
            temp = tripInfo.route.route_short_name;
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