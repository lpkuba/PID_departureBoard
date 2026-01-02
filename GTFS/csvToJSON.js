const fs = require("fs");
const csv = require('csv-parser');

const getDirectories = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

getDirectories("./").forEach(folder => {
    console.log(folder);
    fs.readdir(folder, (err, files) => {
        console.log(files);
        if(folder.endsWith("JSON")){
            console.error("Snaha o upravení již upravené složky!");
            return;
        }
        fs.promises.mkdir(`./${folder}_JSON/`)
        .catch(console.error(err))
        .then(() => {
            files.forEach(file => {
                console.log(file);
                const results = [];
                const altResults = [];
                let extraFile = false;
                fs.createReadStream(`./${folder}/${file}`)
                  .pipe(csv())
                  .on('data', (data) => { 
                    if(file == "trips.txt"){
                            altResults.push({
                                tripId: data.trip_id,
                                routeId: data.route_id
                            });
                        extraFile = true;
                    }
                    else if(file == "stops.txt"){
                        altResults.push({
                            id: data.stop_id,
                            name: data.stop_name,
                            zone: data.zone_id,
                            platform: data.platform_code
                        });
                        extraFile = true;
                    }
                    else if(file == "stop_times.txt"){
                        altResults.push({
                            tripId: data.trip_id,
                            stopId: data.stop_id,
                            time: data.departure_time
                        });
                        extraFile = true;
                    }
                    else if(file == "routes.txt"){
                        altResults.push({
                            id: data.route_id,
                            name: data.route_short_name
                        });
                        extraFile = true;
                    }
                    results.push(data);
                    
                  })
                  .on('end', () => {
                    let filepath = `./${folder}_JSON/${file.split(".")[0]}.json`;
                    let filepathAlt = `./${folder}_JSON/${file.split(".")[0]}_ex.json`;
                    if(extraFile){
                        fs.writeFile(filepathAlt, Buffer.from(JSON.stringify(altResults)), err => {
                            if(err){
                                console.error(err);
                            }
                            else{
                                console.log(`./${folder}_JSON/${file.split(".")[0]}_ex.json` + " written OK!");
                            }
                        });                        
                    }
                    fs.writeFile(filepath, Buffer.from(JSON.stringify(results)), err => {
                        if(err){
                            console.error(err);
                        }
                        else{
                            console.log(filepath + " written OK!");
                        }
                    });
                });
            })
        })
    })
})


