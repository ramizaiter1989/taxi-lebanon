// utils/mapHTML.ts

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .leaflet-container { background: #f0f0f0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([40.7128, -74.0060], 13);

        var layers = {
          street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
          satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
          terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17 })
        };

        layers.street.addTo(map);
        var currentLayer = 'street';
        var markers = {};
        var userMarker = null;
        var routeStartMarker = null;
        var routeEndMarker = null;
        var routeLayer = null;

        var customIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        var userIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        var startIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        var endIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapClick',
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }));
        });

        document.addEventListener('message', function(e) { handleMessage(e.data); });
        window.addEventListener('message', function(e) { handleMessage(e.data); });

        function handleMessage(data) {
          try {
            var message = JSON.parse(data);
            
            switch(message.type) {
              case 'setView':
                map.setView([message.lat, message.lng], message.zoom || map.getZoom());
                break;
              case 'addMarker':
                if (markers[message.id]) map.removeLayer(markers[message.id]);
                var marker = L.marker([message.lat, message.lng], { icon: customIcon })
                  .addTo(map)
                  .bindPopup('<b>' + message.title + '</b><br>' + message.description);
                markers[message.id] = marker;
                break;
              case 'setUserLocation':
                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.marker([message.lat, message.lng], { icon: userIcon })
                  .addTo(map)
                  .bindPopup('Your Location');
                break;
              case 'zoomIn':
                map.zoomIn();
                break;
              case 'zoomOut':
                map.zoomOut();
                break;
              case 'changeLayer':
                map.removeLayer(layers[currentLayer]);
                layers[message.layer].addTo(map);
                currentLayer = message.layer;
                break;
              case 'addRouteMarker':
                var icon = message.markerType === 'start' ? startIcon : endIcon;
                var marker = L.marker([message.lat, message.lng], { icon: icon })
                  .addTo(map)
                  .bindPopup('<b>' + (message.markerType === 'start' ? 'Pickup: ' : 'Destination: ') + message.title + '</b>');
                
                if (message.markerType === 'start') {
                  if (routeStartMarker) map.removeLayer(routeStartMarker);
                  routeStartMarker = marker;
                } else {
                  if (routeEndMarker) map.removeLayer(routeEndMarker);
                  routeEndMarker = marker;
                }
                break;
              case 'showRoute':
                if (routeLayer) map.removeLayer(routeLayer);
                var coordinates = message.route.coordinates.map(function(coord) {
                  return [coord[1], coord[0]];
                });
                routeLayer = L.polyline(coordinates, {
                  color: '#007AFF',
                  weight: 5,
                  opacity: 0.8
                }).addTo(map);
                map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
                break;
              case 'clearRoute':
                if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
                if (routeStartMarker) { map.removeLayer(routeStartMarker); routeStartMarker = null; }
                if (routeEndMarker) { map.removeLayer(routeEndMarker); routeEndMarker = null; }
                break;
            }
          } catch(error) {
            console.error('Error handling message:', error);
          }
        }

        setTimeout(function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        }, 100);
      </script>
    </body>
    </html>
  `;

export default mapHTML;
