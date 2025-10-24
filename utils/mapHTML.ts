const mapHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map = L.map('map').setView([33.8938, 35.5018], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        let userMarker = null;
        let routeMarkers = [];
        let routeLayer = null;

        // Custom icons
        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: '<div style="background: #FF85C0; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });
        const startIcon = L.divIcon({
            className: 'start-marker',
            html: '<div style="background: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        const endIcon = L.divIcon({
            className: 'end-marker',
            html: '<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        // Message handler
        window.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('WebView received:', data.type, data);

                switch(data.type) {
                    case 'setUserLocation':
                        if (userMarker) {
                            userMarker.setLatLng([data.lat, data.lng]);
                        } else {
                            userMarker = L.marker([data.lat, data.lng], { icon: userIcon }).addTo(map);
                        }
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'locationUpdated',
                            lat: data.lat,
                            lng: data.lng
                        }));
                        break;

                    case 'setView':
                        map.setView([data.lat, data.lng], data.zoom || 14);
                        break;

                    case 'addRouteMarker':
                        const icon = data.markerType === 'start' ? startIcon : endIcon;
                        const marker = L.marker([data.lat, data.lng], { icon: icon })
                            .addTo(map)
                            .bindPopup(data.title || '');
                        routeMarkers.push(marker);
                        break;

                    case 'clearMarkers':
                        routeMarkers.forEach(marker => map.removeLayer(marker));
                        routeMarkers = [];
                        break;

                    case 'clearRoute':
                        if (routeLayer) {
                            map.removeLayer(routeLayer);
                            routeLayer = null;
                        }
                        break;

                    case 'drawRoute':
                        // Clear existing route
                        if (routeLayer) {
                            map.removeLayer(routeLayer);
                        }

                        // Draw new route using coordinates from OSRM/ORS
                        if (!data.coordinates || data.coordinates.length === 0) {
                            throw new Error('No coordinates provided for route');
                        }

                        // Coordinates are in [lng, lat] format, need to convert to [lat, lng]
                        const latLngs = data.coordinates.map(coord => [coord[1], coord[0]]);

                        routeLayer = L.polyline(latLngs, {
                            color: data.color || '#FF85C0',
                            weight: 5,
                            opacity: 0.8,
                            lineJoin: 'round',
                            lineCap: 'round'
                        }).addTo(map);

                        // Fit map to route bounds
                        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'routeDrawn',
                            success: true
                        }));
                        break;

                    case 'showRoute':
                        // Fallback: simple straight line (for when OSRM fails)
                        if (routeLayer) {
                            map.removeLayer(routeLayer);
                        }

                        routeLayer = L.polyline([
                            [data.start.lat, data.start.lng],
                            [data.end.lat, data.end.lng]
                        ], {
                            color: '#FF85C0',
                            weight: 4,
                            opacity: 0.6,
                            dashArray: '10, 10'
                        }).addTo(map);

                        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
                        break;
                }
            } catch (error) {
                console.error('WebView error:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'error',
                    message: error.message
                }));
            }
        });

        // Initial load complete
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapLoaded'
        }));
    </script>
</body>
</html>
`;
export default mapHTML;
