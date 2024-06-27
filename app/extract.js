// filter data for city boundaries

const fs = require('fs');

const csvDatoteka = '../data2/cities.csv';
const jsonDatoteka = '../data2/convert.json';

fs.readFile(csvDatoteka, 'utf8', (err, csvData) => {
    if (err) {
        console.error('err:', err);
        return;
    }
    const redovi = csvData.split('\n');
    const gradoviZaIzdvajanje = redovi.map(red => {
        const polja = red.split(',');
        let name = polja[1]?.toUpperCase();
        return name;
    });
    fs.readFile(jsonDatoteka, 'utf8', (err, jsonData) => {
        if (err) {
            console.error('err:', err);
            return;
        }
        const podaci = JSON.parse(jsonData);
        const filtriraniPodaci = podaci.features.filter(grad => gradoviZaIzdvajanje.includes(grad.properties.NAME));
        const noviJSON = {
            "type": "FeatureCollection",
            "features": filtriraniPodaci
        };
        fs.writeFile('../data2/convert_new.json', JSON.stringify(noviJSON), (err) => {
            if (err) {
                console.error('err', err);
                return;
            }
            console.log('JSON created.');
        });
    });
});

// // call::
// // node extract.js