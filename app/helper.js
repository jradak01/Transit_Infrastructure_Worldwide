// Define a color palette with colors associated with names 
const colorPalette = {
    purple: '#8960BF',
    blue: '#5AA6E4',
    green: '#21E32A',
    yellow: '#FDB628',
    orange: '#F68154',
    pink: '#EB4482',
    grey: document.body.classList.contains('dark-mode')? '#153034':'#DADBDB',
}

// Hide an HTML element by its ID
function hide(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

// Show an HTML element by its ID
function show(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = '';
    }
}

// Convert an object's values to an array
function convertObjectToArray(obj) {
    return Object.values(obj);
}

// Filter data based on relevant dates within a specific year range
function filterByDates(data, attribute1, attribute2 = false) {
    const year = new Date().getFullYear()
    if (attribute2) {
        data = data.filter(d => +d[attribute2] >= 9999 && +d[attribute1] > 0 && +d[attribute1] <= year);
    } else {
        data = data.filter(d => Number.isInteger(+d[attribute1]) && +d[attribute1] > 0 && +d[attribute1] <= year)
    }
    return data;
}

// Extract coordinates from POINT geometry data and add them to each object
function breakPointCoordinates(data) {
    data.forEach(d => {
        const coords = d.geometry.match(/POINT\(([^)]+)\)/)[1].split(' ').map(Number);
        d.Long = +coords[0];
        d.Lat = +coords[1];
        d.coordinates = coords;
    });
    return data;
}

// Extract and split coordinates from POINT geometry strings
function splitCoordinates(data) {
    data.forEach(d => {
        const coords = d.coords.replace("POINT(", "").replace(")", "").split(" ");
        d.coordinates = [+coords[0], +coords[1]];
    })
    return data;
}

// Extract and split coordinates from LINESTRING geometry data
function breakLineCoordinates(data) {
    data.forEach(d => {
        const coordinates = d.geometry.replace("LINESTRING(", "").replace(")", "").split(",").map(coord => coord.split(" ").map(Number));
        d.coordinates = coordinates;
    });
    return data;
}

// Get unique elements from a dataset based on a specified attribute
function uniqueElements(data, atribute) {
    const uniques = new Set();
    data.forEach(d => {
        uniques.add(d[atribute]);
    })
    return uniques;
}

// Slice the dataset to a specified number of elements
function sliceData(data, slice = 15) {
    return data.slice(0, slice);
}

// Sort data by a specified attribute, optionally in reverse order
function sortByAttribute(data, attribute, reverse = false) {
    if (reverse) {
        return data.sort((a, b) => {
            if (a[attribute] < b[attribute]) {
                return -1;
            }
            if (a[attribute] > b[attribute]) {
                return 1;
            }
            return 0;
        });
    } else {
        return data.sort((a, b) => {
            if (a[attribute] > b[attribute]) {
                return -1;
            }
            if (a[attribute] < b[attribute]) {
                return 1;
            }
            return 0;
        });
    }
}

// Sum values of specified attributes for each data object
function sumValues(data, atributes) {
    data.forEach(d => {
        d.sum = atributes.reduce((acc, atribute) => acc + d[atribute], 0);
    })
    return data;
}

// Asynchronously load data from multiple CSV files based on dataset names
async function getData(datasets) {
    const data = {};

    if (datasets.includes('cities')) {
        data.cities = await d3.csv('../data2/cities.csv');
    }
    if (datasets.includes('stations')) {
        data.stations = await d3.csv('../data2/stations.csv');
    }
    if (datasets.includes('lines')) {
        data.lines = await d3.csv('../data2/lines.csv');
    }
    if (datasets.includes('tracks')) {
        data.tracks = await d3.csv('../data2/tracks.csv');
    }
    if (datasets.includes('trackLines')) {
        data.trackLines = await d3.csv('../data2/track_lines.csv');
    }
    if (datasets.includes('stationLines')) {
        data.stationLines = await d3.csv("../data2/station_lines.csv");
    }
    if (datasets.includes('systems')) {
        data.systems = await d3.csv('../data2/systems.csv');
    }
    return data;
}

// Merge data by city, adding city name and coordinates to the filtered data
function mergeDataByCity(cities, dataToFilter, attribute = 'value', addZeros = false) {
    const idCityMap = new Map(cities.map(d => [d.id, { name: d.name, ...d }]));
    const enrichedData = dataToFilter.map(d => {
        const cityInfo = idCityMap.get(d.city_id);
        if (cityInfo) {
            d.city = cityInfo.name;
            d.coords = cityInfo.coords;
        }
        return d;
    });

    let groupedData = d3.rollups(enrichedData, v => v, d => d.city)
        .map(d => {
            return { name: d[0], coords: d[1][0].coords, id: d[1][0].city_id, [attribute]: d[1] };
        });

    if (addZeros) {
        const existingCities = new Set(groupedData.map(d => d.name));
        const allCities = cities.map(d => d.name);
        allCities.forEach(name => {
            if (!existingCities.has(name)) {
                const cityInfo = cities.find(city => city.name === name);
                groupedData.push({ ...cityInfo, [attribute]: [] });
            }
        });
    }

    return groupedData;
}

// Merge data by country, adding country name and cities to the filtered data
function mergeDataByCountry(cities, dataToFilter, attribute = 'value', addZeros = false) {
    const idCityMap = new Map(cities.map(d => [d.id, { country: d.country, name: d.name, ...d }]));
    const countryCityMap = new Map();

    cities.forEach(city => {
        if (!countryCityMap.has(city.country)) {
            countryCityMap.set(city.country, []);
        }
        countryCityMap.get(city.country).push(city.name);
    });

    const enrichedData = dataToFilter.map(d => {
        const cityInfo = idCityMap.get(d.city_id);
        if (cityInfo) {
            d.country = cityInfo.country;
            d.city = cityInfo.name;
        }
        return d;
    });

    let groupedData = d3.rollups(enrichedData, v => v, d => d.country)
        .map(d => {
            const citiesInCountry = countryCityMap.get(d[0]);
            return { country: d[0], cities: citiesInCountry, [attribute]: d[1] };
        });

    if (addZeros) {
        const existingCountries = new Set(groupedData.map(d => d.country));
        const allCountries = Array.from(countryCityMap.keys());
        allCountries.forEach(country => {
            if (!existingCountries.has(country)) {
                groupedData.push({ country: country, cities: countryCityMap.get(country), [attribute]: [] });
            }
        });
    }

    return groupedData;
}

// Concatenate data from multiple datasets based on a matching attribute
function concatenateData(data, attributes, matchAttribute) {
    data[0].forEach(d => {
        attributes.forEach((attribute, index) => {
            const append = data[index + 1].find(dNew => dNew[matchAttribute] === d[matchAttribute]) || [];
            d[attribute] = append[attribute];
        });
    });
    return data[0];
}

// Remove data objects where a specified field has an empty or zero value
function removeEmptyData(data, fieldToCheck) {
    return data.filter(d => d[fieldToCheck] !== 0);
}

// Count the number of data objects by a grouped attribute
function countDataByGroupedAttribute(groupedData, attribute) {
    
    if (!groupedData || !Array.isArray(groupedData) || groupedData.length === 0) {
        console.error("groupedData is not valid or empty");
        return [];
    }

    if (!attribute || typeof attribute !== 'string') {
        console.error("Attribute is not valid");
        return [];
    }

    const countedData = groupedData
        .filter(d => d[attribute] !== undefined && d[attribute] !== null) 
        .sort((a, b) => d3.descending((a[attribute] || []).length, (b[attribute] || []).length))
        .map(d => ({ ...d, [attribute + '_count']: (d[attribute] || []).length }));

    return countedData;
}

// Calculate the percentage of a specified attribute relative to a total
function countPercentage(data, attribute, total) {
    data.forEach(d => {
        d[attribute + '_percentage'] = d[attribute] / total * 100;
    });
    return data;
}

// Sum data values for a specific attribute, optionally in kilometers
function sumData(data, attribute, field = null, inKm = false) {
    if (field !== null) {
        data.forEach(d => {
            if (inKm) {
                d[`${field}_${attribute}`] = d[field].reduce((acc, d) => acc + +d[attribute], 0) / 1000
            } else {
                d[`${field}_${attribute}`] = d[field].reduce((acc, d) => acc + +d[attribute], 0)
            }
        })

        return data;
    } else {
        if (inKm) {
            return data.reduce((acc, d) => acc + +d[attribute], 0) / 1000;
        } else {
            return data.reduce((acc, d) => acc + +d[attribute], 0);
        }
    }
}

// Map data from one dataset to another based on matching attributes
function mapData(data, dataToMap, dataConnector, connector1, connector2, attributeName = 'mappedData') {
    
    const mapToData = {};
    dataToMap.forEach(item => {
        mapToData[item.id] = item;
    });

    const result = data.map(item => {
        const mappedData = [];

        dataConnector.forEach(connector => {
            if (connector[connector1] === item.id) {
                const mappedItem = mapToData[connector[connector2]];
                if (mappedItem) {
                    mappedData.push(mappedItem);
                }
            }
        });

        return {
            ...item,
            [attributeName]: mappedData
        };
    });

    return result;
}

// Format text by capitalizing the first letter of each line and removing non-alphabetic characters
function formatText(input) {
    return input
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            let formattedLine = line.replace(/[^a-zA-Z\s]/g, ' ');
            return formattedLine.charAt(0).toUpperCase() + formattedLine.slice(1);
        })
        .join('\n');
}

// Filter data to include only objects related to a specific city ID
function filterDataForCity(city_id, dataToFilter) {
    return dataToFilter.filter(d => d.city_id === city_id);
}

// Filter data to include only objects related to a specific country
function filterDataForCountry(country, cities, dataToFilter) {
    const filteredCities = cities.filter(d => d.country === country);
    const cityIds = filteredCities.map(d => d.id);

    const filteredData = dataToFilter.filter(d => cityIds.includes(d.city_id));

    return filteredData;
}

// Calculate the cumulative sum of a specified attribute for each data object
function culmulativeSum(data, attribute) {
    let sum = 0;
    return data.map(d => {
        sum += d[attribute];
        return { ...d, [`cumulative_${attribute}`]: sum };
    });
}

// Count the number of occurrences of each value in a specified field
function countByField(data, field, attribute = 'value') {
    return d3.rollups(data, v => v.length, d => d[field])
        .map(d => {
            return { name: d[0], [attribute]: d[1] };
        });
}

// Add missing data entries for each year starting from a specified year
function addMissingData(data, field, startYear, attribute = 'value') {
    const currentYear = new Date().getFullYear()
    const allYears = d3.range(startYear, currentYear);
    const dataMap = allYears.reduce((acc, year) => {
        const existingData = data.find(d => +d[field] === year);
        if (existingData) {
            acc.push(existingData);
        } else {
            const newEntry = { [field]: year.toString(), [attribute]: 0 };
            acc.push(newEntry);
        }
        return acc;
    }, []);
    return dataMap;
}

// Creates new div element
function createDiv(innerText, placementId) {
    const newDiv = document.createElement('div');
    newDiv.className = 'text title';
    newDiv.innerText = innerText;
    const dashboardElement = document.getElementById(placementId);
    if (dashboardElement) {
        dashboardElement.appendChild(newDiv);
    } else {
        console.error(`Element with ID ${placementId} not found`);
    }
}