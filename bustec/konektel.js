const filename = "options.cfg";
let panelData = {};

async function fetchKonektelData() {
    let u,w;
    w = await fetch("http://127.0.0.1:6969/" + filename);
    u = await w.text();
    input = decodeIniFile(u);
    console.log(input);
    panelData = {
        data: {
            dest: input.name != undefined ? input.name[input.name.length-1] : "&nbsp;",
            typeId: 3,
            type: input.data.color_scheme == 1 ? "bus" : "bus replacement",
            line: input.data.line_name,
            stops: input.name != undefined ? joinData(input.name, input.info, input.tarif) : [{name:"&nbsp;", zone:"&nbsp;", transfers: []}]
        },
        unknownData: input.name != undefined ? false : true,
        vehInStop: input.data.state_info == 1 ? false : true
    }
    console.log(panelData);
    return panelData;
}

/**
 * Vrátí JSON vytvořený z vloženého INI souboru.
 * @param {string} f - INI soubor jakožto neupravený string.
 * @returns {string} Převedený JSON.
 */
function decodeIniFile(f){
    let a = false, b, c = {}, d, e, g;
    f = f.split('\r\n');
    let t = "";
    
    for (let i = 0; i < f.length-1; i++) {
        if(f[i].startsWith("#")){
            continue;
        }
        else if(f[i].startsWith("[")){
            a = true;
            b = f[i].slice(1,-1);
            switch (b) {
                case "name":
                case "type":
                case "info":
                case "tarif":
                    c[b] = [];    
                break;
            
                default:
                    c[b] = {};
                break;
            }
        }
        else if(f[i] == ""){
            a = false;
        }
        else{
            if(a){
                d = f[i].indexOf("=");
                e = f[i].slice(0,d);
                g = f[i].slice(d+1);
                if(b == "info"){
                    g = konektelTransfers(j(parseInt(g)));
                }
                c[b][e] = g;
            }
        }
    }
    return c;
}

function j(q)
{
  if (q < 0)
  {
    q = 0xFFFFFFFF + q + 1;
  }

  return q.toString(16).toUpperCase();
}

function konektelTransfers(hex){
    console.log("PRESTUPY HEX ZDE:");
    console.log(hex);
    let transfers = hex.split('');
    let result = {};
    result.transfers = [];
    transfers.reverse();
    for (let i = 0; i < transfers.length; i++) {
        switch (i) {
            case 0:
                switch (transfers[i]) {
                    case "1":
                        result.transfers.push("metroA");
                    break;
                    case "2":
                        result.transfers.push("metroB");
                    break;
                    case "3":
                        result.transfers.push("metroA");
                        result.transfers.push("metroB");
                    break;
                    case "4":
                        result.transfers.push("metroC");
                    break;
                    case "5":
                        result.transfers.push("metroA");
                        result.transfers.push("metroC");
                    break;
                    case "6":
                        result.transfers.push("metroB");
                        result.transfers.push("metroC");
                    break;
                    case "7":
                        result.transfers.push("metroA");
                        result.transfers.push("metroB");
                        result.transfers.push("metroC");
                    break;
                }
            break;
            case 1:
                switch (transfers[i]) {
                    case "1":
                        result.transfers.push("train");
                    break;
                    case "2":
                        result.transfers.push("airport");
                    break;
                }
            break;
            case 2:

                switch (transfers[i]){
                    case "1":
                        result.transfers.push("ferry");
                    break;
                }
        }
    }
    return result.transfers;
}

function joinData(x,y,z) {
    //x je jmeno, y jsou prestupy a z jsou pasma
    let result = [];
    for (let i = 0; i < x.length; i++) {
        result.push({name: x[i], zone: z[i], transfers: y[i]});
    }
    //console.log(result);
    return result;
}
