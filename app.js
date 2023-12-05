
var mobilityExistsCSV = "from,to\n";
var lines = mobilityExistsCSV_raw.split("\n");
for (var i = 1; i < lines.length; i++) {
    var segments = lines[i].split(",")[0].split("_to_");
    mobilityExistsCSV += segments[0] + "," + segments[1] + "\n";
}

var gctData = "id,Datetime,flow\n";
var lines = gctData_raw.split("\n");
for (var i = 1; i < lines.length; i++) {
    var columns = lines[i].split(",");
    for (var j = 1; j < columns.length; j++) {
        gctData += j + "," + columns[0] + "," + columns[j] + "\n";
    }
}

var mobilityData = "from,to,Datetime,flow\n";
var lines = mobilityData_raw.split("\n");
for (var i = 1; i < lines.length; i++) {
    var columns = lines[i].split(",");
    for (var j = 1; j < columns.length; j++) {
        var segments = lines[0].split(",")[j].split("_to_");
        mobilityData += segments[0] + "," + segments[1] + "," + columns[0] + "," + columns[j] + "\n";
    }
}

var gctLocations = Papa.parse(gctLocationsCSV, {header: true}).data;
var mobilityExists = Papa.parse(mobilityExistsCSV, {header: true}).data;
var gctDataParsed = Papa.parse(gctData, {header: true}).data;
var mobilityDataParsed = Papa.parse(mobilityData, {header: true}).data;

var medianLatitude = (Math.min(...gctLocations.map(loc => parseFloat(loc.latitude))) + Math.max(...gctLocations.map(loc => parseFloat(loc.latitude)))) / 2;
var medianLongitude = (Math.min(...gctLocations.map(loc => parseFloat(loc.longitude))) + Math.max(...gctLocations.map(loc => parseFloat(loc.longitude)))) / 2;

function createGctChart(locationId, date) {
    var filteredData = gctDataParsed.filter(row => row.id == locationId && row.Datetime.startsWith(date));
    var chartData = filteredData.map(row => [new Date(row.Datetime).getTime(), parseFloat(row.flow)]);
    var chartOptions = {
        chart: {
            type: 'line',
            renderTo: 'chartContainer'
        },
        title: {
            text: 'GCT Flow of Road Segment ' + locationId
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Time'
            }
        },
        yAxis: {
            title: {
                text: 'GCT Flow'
            }
        },
        series: [{
            name: 'GCT Flow',
            data: chartData
        }]
    };
    return chartOptions;
}

function createMobilityChart(fromId, toId, date) {
    var filteredData = mobilityDataParsed.filter(row => row.from == fromId && row.to == toId && row.Datetime.startsWith(date));
    var chartData = filteredData.map(row => [new Date(row.Datetime).getTime(), parseFloat(row.flow)]);
    var chartOptions = {
        chart: {
            type: 'line',
            renderTo: 'chartContainer'
        },
        title: {
            text: 'Mobility Flow of Route ' + fromId + "_to_" + toId
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Time'
            }
        },
        yAxis: {
            title: {
                text: 'Mobility Flow'
            }
        },
        series: [{
            name: 'Mobility Flow',
            data: chartData
        }]
    };
    return chartOptions;
}
/**
function showChartInInfoWindow(map, chartOptions, position) {
    var chartContainer = document.createElement('div');
    chartContainer.id = 'chartContainer';
    chartContainer.style.width = '400px';
    chartContainer.style.height = '300px';
    var infowindow = new google.maps.InfoWindow({
        content: chartContainer,
        position: position
    });
    infowindow.open(map);
    Highcharts.chart(chartOptions);
}

function showChartInInfoWindow(map, chartOptions, position) {
    var chartContainer = document.createElement('div');
    chartContainer.id = 'chartContainer';
    chartContainer.style.width = '400px';
    chartContainer.style.height = '300px';
    var infowindow = new google.maps.InfoWindow({
        content: chartContainer,
        position: position
    });
    infowindow.addListener('domready', function() {
        Highcharts.chart('chartContainer', chartOptions);
    });
    infowindow.open(map);
}
**/

var currentInfoWindow = null;  // Track the currently open info window

function showChartInInfoWindow(map, chartOptions, position) {
    if (currentInfoWindow) {
        currentInfoWindow.close();  // Close the currently open info window
    }
    var chartContainer = document.createElement('div');
    chartContainer.id = 'chartContainer';
    chartContainer.style.width = '400px';
    chartContainer.style.height = '300px';
    var infowindow = new google.maps.InfoWindow({
        content: chartContainer,
        position: position
    });
    infowindow.addListener('domready', function() {
        Highcharts.chart('chartContainer', chartOptions);
    });
    infowindow.open(map);
    currentInfoWindow = infowindow;  // Update the currently open info window
}

function displayMobilityChart(map, fromId, toId, date) {
    var filteredDataA = mobilityDataParsed.filter(row => (row.from == fromId && row.to == toId || row.from == toId && row.to == fromId) && row.Datetime.startsWith(date));
    
    filteredDataA.sort((a, b) => new Date(a.Datetime).getTime() - new Date(b.Datetime).getTime());

    var chartDataA = filteredDataA.filter(row => row.from == fromId && row.to == toId).map(row => [new Date(row.Datetime).getTime(), parseFloat(row.flow)]);
    var chartDataB = filteredDataA.filter(row => row.from == toId && row.to == fromId).map(row => [new Date(row.Datetime).getTime(), parseFloat(row.flow)]);

    console.log(chartDataA)
    var chartOptions = {
        chart: {
            type: 'line'
        },
        title: {
            text: 'Mobility Flow Over Time'
        },
        xAxis: {
            type: 'datetime',
          title: {
              text: 'Time'
          },
          dateTimeLabelFormats: {
              hour: '%m/%d %H:%M',
              day: '%m/%d %H:%M'
          },
          tickInterval: 3600 * 1000 // one hour interval
        },
        yAxis: {
            title: {
                text: 'Mobility Flow'
            }
        },
        legend: {
            align: 'center',
            verticalAlign: 'top'
        },
        series: [{
            name: fromId + '_to_' + toId,
            data: chartDataA
        }, {
            name: toId + '_to_' + fromId,
            data: chartDataB
        }]
    };

    var position = {
        lat: (parseFloat(gctLocations.find(loc => loc.id == fromId).latitude) + parseFloat(gctLocations.find(loc => loc.id == toId).latitude)) / 2,
        lng: (parseFloat(gctLocations.find(loc => loc.id == fromId).longitude) + parseFloat(gctLocations.find(loc => loc.id == toId).longitude)) / 2
    };
    
    showChartInInfoWindow(map, chartOptions, position);
}


function initMap() {
    var map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: medianLatitude, lng: medianLongitude},
        zoom: 14
    });

    gctLocations.forEach(function(location) {
        var marker = new google.maps.Marker({
            position: {lat: parseFloat(location.latitude), lng: parseFloat(location.longitude)},
            map: map,
            label: location.id
        });
        marker.addListener('click', function() {
            var date = document.getElementById('dateSelector').value;
            var chartOptions = createGctChart(location.id, date);
            showChartInInfoWindow(map, chartOptions, marker.getPosition());
        });
    });

    mobilityExists.forEach(function(connection) {
        if (connection.from == '' || connection.to == '')
            return;
        var fromCoords = gctLocations.find(loc => loc.id == connection.from);
        var toCoords = gctLocations.find(loc => loc.id == connection.to);
        var line = new google.maps.Polyline({
            path: [
                {lat: parseFloat(fromCoords.latitude), lng: parseFloat(fromCoords.longitude)},
                {lat: parseFloat(toCoords.latitude), lng: parseFloat(toCoords.longitude)}
            ],
            map: map
        });
        line.addListener('click', function(event) {
            var date = document.getElementById('dateSelector').value;
            displayMobilityChart(map, connection.from, connection.to, date);
        });
    });
}


// Load the Google Maps JavaScript API with your API key
var script = document.createElement('script');
script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyACNY0Ulsv854nOM-9xzyKVdHIUs1I-TcU&callback=initMap';
document.body.appendChild(script);
