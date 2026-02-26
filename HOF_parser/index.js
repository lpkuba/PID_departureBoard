const fs = require('fs');
const readline = require('readline');

main();

async function main() {
    const fileStream = fs.createReadStream(filePath);
       const rl = readline.createInterface({
           input: fileStream,
           crlfDelay: Infinity // Zpracuje \r\n i \n korektně
       });   
}
