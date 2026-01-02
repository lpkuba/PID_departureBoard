let popupVis = 0;
let sluzbaShown;
let numpadEditing = false;
let curMode = "disabled";
let cas = {};
//linka 999 bude užita pro manipulační služební a další havěťospoje 
//směry: 01 => Manipulační Jízda
//       02 =>    Služební Jízda
//       03 =>    Servisní Jízda
//       04 =>    Zvláštní Jízda
let data = {
    sluzbaFull: "912 51 01",
    slLinka: 912,
    slPoradi: 51,
    slTypDne: 1,
    sluzbaKnown: true,
    cil: "Palmovka <B>",
    sluzbaGoesOverNight: true,
    sluzbaStartHour: 22,
    sluzbaEndHour: 5,
    spoje: [
        {linka: 999, smer: 99, dep:{h: 21, m: 50}},
        {linka: 141, smer:  1, dep:{h: 22, m:  0}},
        {linka: 141, smer:  2, dep:{h: 23, m:  0}},
        {linka: 141, smer:  1, dep:{h:  0, m:  0}},
        {linka: 912, smer:  2, dep:{h:  1, m:  0}},
        {linka: 912, smer:  1, dep:{h:  2, m:  0}},
        {linka: 912, smer:  2, dep:{h:  3, m:  0}},
        {linka: 999, smer: 99, dep:{h:  4, m:  0}},
        {linka: 141, smer:  2, dep:{h:  4, m: 10}},
        {linka: 999, smer: 99, dep:{h:  5, m:  0}}
    ],
    hof: {
        lines: {
            "1411": {
                stops: ["vezlibku_start","komarovska_cm","cernymost_end"],
                stopMins: [0,1,10],
                terminus: "cernymost"        
            },
            "1412": {
                stops: ["cernymost_start","komarovska_vz","vezlibku_end"],
                stopMins: [0,10,1],
                terminus: "vezlibku"
            },
            "9121": {
                stops: ["vezlibku_start","komarovska_cm","cernymost_end"],
                stopMins: [0,1,10],
                terminus: "cernymost"        
            },
            "9122": {
                stops: ["cernymost_start","komarovska_vz","vezlibku_end"],
                stopMins: [0,10,1],
                terminus: "vezlibku"
            },
            "9991":{
                stops: ["vezlibku_end", "garaz_ho"],
                stopMins: [0,20],
                terminus: "vezlibku"
            },
            "9992":{
                stops: ["garaz_ho","vezlibku_start"],
                stopMins: [0,20],
                terminus: "vezlibku"
            }
        },
        stops: {
            "vezlibku_start": {
                transfers: "",
                reqStop: false,
                ppName: "Ve Žlíbku",
                zones: "P"
            },
            "vezlibku_end": {
                prestupy: "",
                reqStop: false,
                ppName: "Ve Žlíbku",
                zones: "P"
            },
            "komarovska_cm": {
                transfers: "S",
                reqStop: false,
                ppName: "Komárovská",
                zones: "P"
            },
            "komarovska_vz": {
                prestupy: "S",
                reqStop: false,
                ppName: "Komárovská",
                zones: "P"
            },
            "cernymost_start": {
                transfers: "B,D",
                reqStop: false,
                ppName: "Č.Most15",
                zones: "P"
            },
            "cernymost_end": {
                prestupy: "B,D",
                reqStop: false,
                ppName: "Č.MostV1",
                zones: "P"
            },
            "garaz_ho": {
                prestupy: "",
                reqStop: false,
                ppName: "Garáž HO",
                zones: "P"
            }

        },
        termini: {
            "vezlibku": {
                id: 1234,
                ppName: "Ve Žlíbku"
            },
            "cernymost": {
                id: 4321,
                ppName: "Černý Most <B>"
            },
            "garaz_ho": {
                id: 9906,
                ppName: "Garáž Hostivař"
            },  
            "garaz_kl": {
                id: 9902,
                ppName: "Garáž Klíčov"
            }
        }
        

    }
};

let spojeDb = {
    
}
//tohle vše bude bokem ofc
let konfigurace = {
    nazev: "Urbanway",
    evid: 6756,
    garaz: 2,
    trakce: "bus",
    kasa: false,
    gps: false,
    periferie:{
       oznacovace:[
        {
            type: "oznacovac",
            name: "OznačovačETH 1",
            error: false
        },
        {
            type: "oznacovac",
            name: "OznačovačETH 2",
            error: false
        },
        {
            type: "oznacovac",
            name: "OznačovačETH 3",
            error: false
        },
        {
            type: "oznacovac",
            name: "OznačovačETH 4",
            error: false
        },
        {
            type: "oznacovac",
            name: "OznačovačETH 5",
            error: true
        }
       ],
       panelINT: [
        {
            type: "panelINT",
            name: "LCD multi",
            error: false  
        }
       ],
       panelEXT: [
        {
            type: "panelEXT",
            name: "Panel přední",
            pos: "front",
            error: false
        },
        {
            type: "panelEXT",
            name: "Panel boční 1",
            pos: "side",
            error: false
        },
        {
            type: "panelEXT",
            name: "Panel boční 2",
            pos: "side",
            error: false
        },
        {
            type: "panelEXT",
            name: "Panel zadní",
            pos: "rear",
            error: false
        }
       ],
       hodiny: [
        {
            type: "hodiny",
            name: "ZOCP",
            error: false
        }
       ],
       poradovky: [
        {
            name: "KV1",
            error: false
        },
        {
            name: "KV2",
            error: true
        }
       ],
       preference: [
        {
            name: "Komunikační ústředna",
            error: false
        },
        {
            name: " převodník Eth2CAN",
            error: false
        },
        {
            name: "MRJPreference",
            error: true
        }
       ],
       casovySpinac: [
            {
                name: "Časový Spínač",
                error: true
            }
       ],
       vysilacka: [
        {
            name: "RCA",
            error: false
        }
       ],
       apc: [
        {
            name: "APC1",
            error: true
        },
        {
            name: "APC2",
            error: true
        },
        {
            name: "APC3",
            error: true
        },
        {
            name: "APC4",
            error: true
        }
       ],
       pokladna: [
        {
            name: "Pokladna",
            error: false
        }
       ],
       mos: {
        verze: "1.0",
        age: "???"
       }

    }
};
let dataOut = {};
let numpadPos = 0;

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
    //cteni sluzby
    document.getElementById("homeSluzba").innerHTML = data.slLinka.toString().padStart(3, "0") + " " + data.slPoradi.toString().padStart(2, "0") + " " + data.slTypDne.toString().padStart(2, "0"); //prasarnicka ale funkcni
    document.getElementById("popupCilOK").addEventListener("click", popupBtnFunc, false);
}
//datum a cas
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
    cas.h = date.getHours();
    cas.m = date.getMinutes();
}, 1000);


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
            
    }
}

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

function loadRouteData() {
    try {
        
    } catch (error) {
        
    }
    document.getElementById("homeSluzba").innerHTML = sluzbaShown;
    //zde bude komunikace s vnějším EXE pro získání routeData
    console.log("Načteno!");
}

function sendRouteData(){

}
