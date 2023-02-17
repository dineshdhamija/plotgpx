document
        .getElementById("file-input")
        .addEventListener("change", function (event) {
          const files = event.target.files;
          // const reader = new FileReader();
          const traces = [];
          let numFilesRead = 0;
          for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.fileName = files[i].name;
            reader.onload = function (event) {
              const data = event.target.result;
              const parsedData = parseGpx(data);
              debugger;
              traces.push({
                x: parsedData.distances,
                y: parsedData.elevations,
                mode: "lines",
                name: event.target.fileName.split('.').slice(0, -1).join('.'),
              });
              numFilesRead++;
              if (numFilesRead === files.length) {
                plotChart(traces);
              }
            };
            reader.readAsText(files[i]);
          }
        });

      function parseGpx(data) {
        // Parse GPX data
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "application/xml");
        const points = xml.getElementsByTagName("trkpt");

        // Extract elevation and distance data
        const elevations = [];
        const distances = [0];
        const feetInMeter = 3.28084;
        let totalDistance = 0;
        let firstElevation = null;
        for (let i = 0; i < points.length; i++) {
          const elevation =
            points[i].getElementsByTagName("ele")[0].textContent;
          if (firstElevation === null) firstElevation = parseFloat(elevation);
          elevations.push(
            (parseFloat(elevation) - firstElevation) * feetInMeter
          );

          if (i > 0) {
            const prevLat = points[i - 1].getAttribute("lat");
            const prevLon = points[i - 1].getAttribute("lon");
            const currLat = points[i].getAttribute("lat");
            const currLon = points[i].getAttribute("lon");
            const distance = getDistanceFromLatLonInMiles(
              prevLat,
              prevLon,
              currLat,
              currLon
            );
            totalDistance += distance;
            distances.push(Math.round(totalDistance * 1000) / 1000);
          }
        }

        return { elevations, distances, totalDistance };
      }

      function plotChart(traces) {
        // Define the layout of the chart
        var layout = {
          xaxis: {
            title: "Distance (miles)",
          },
          legend: {
            "orientation": "h",
          },
          yaxis: {
            title: "Elevation (feet)",
          },
        };

        Plotly.newPlot("chart", traces, layout);
      }

      // Helper function to calculate distance between two lat/lon points
      function getDistanceFromLatLonInMiles(lat1, lon1, lat2, lon2) {
        const deg2rad = (deg) => deg * (Math.PI / 180);
        const R = 6371; // Radius of the earth in km
        const kmInMile = 1.60934;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in meters
        return d / kmInMile;
      }
