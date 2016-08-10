(function () {
    angular
    .module('vliller.home')
    .controller('HomeController', ['Vlilles', '$scope', '$timeout', 'aetmToastService', '$log', '$q', 'aetmNetworkService', 'Location', 'Navigation', 'GoogleMapsTools', function (Vlilles, $scope, $timeout, aetmToastService, $log, $q, aetmNetworkService, Location, Navigation, GoogleMapsTools) {
        var vm = this,
            map,
            markers = [],
            userMarker,
            activeMarker,
            currentPosition = null,
            iconDefault,
            iconActive;

        vm.activeStation = null;
        vm.isLoading = true;
        vm.isGPSLoading = false;

        // get stations list
        vm.stations = Vlilles.query();

        // default map values
        vm.map = {
            $loaded: false
        };

        // Loads the map
        document.addEventListener('deviceready', function () {
            // Initialize the map view
            var mapElement = plugin.google.maps.Map.getMap(document.getElementById('map-canvas'));

            // Wait until the map is ready status.
            mapElement.addEventListener(plugin.google.maps.event.MAP_READY, onMapReady);
        }, false);

        /**
         * Map loaded
         */
        function onMapReady(gmap) {
            map = gmap;
            vm.map.$loaded = true;

            // Init icon objects
            iconDefault = {
                url: 'www/assets/img/vliller-marker-white.png',
                size: {
                    width: 38,
                    height: 45
                }
            };

            iconActive = {
                url: 'www/assets/img/vliller-marker-red.png',
                size: {
                    width: 58,
                    height: 67
                }
            };

            // Init markers, etc.
            vm.stations.$promise.then(initStations, errorHandler);
        }

        /**
         * @param Object error
         */
        function errorHandler(error) {
            $log.debug(error);
            aetmToastService.showError('Oups! Une erreur est survenue.');
        }

        /**
         * @param  Array stations
         */
        function initStations(stations) {
            // update GPS position
            vm.updatePosition();

            // add stations markers
            stations.forEach(function (station) {
                map.addMarker({
                    position: {
                        lat: station.latitude,
                        lng: station.longitude
                    },
                    icon: iconDefault,
                    station: station,
                    disableAutoPan: true,
                    markerClick: function (marker) {
                        setActiveMarker(marker, true);
                    }
                }, function (marker) {
                    // store list of markers
                    markers.push(marker);
                });
            });

            vm.isLoading = false;
        }

        /**
         *
         * @param google.maps.Marker marker
         */
        function setActiveMarker(marker, centerMap) {
            var station = marker.get('station');

            // set default icon on current office marker
            if (activeMarker) {
                activeMarker.setIcon(iconDefault);
            }

            // update new active office
            activeMarker = marker;
            vm.activeStation = station;

            // update icon and center map
            activeMarker.setIcon(iconActive);
            if (centerMap !== false) {
                setCenterMap(vm.activeStation);
            }

            // loads station details
            Vlilles.get({id: station.id}, function (stationDetails) {
                // get some missing informations from the previous request
                angular.extend(vm.activeStation, stationDetails);

                vm.activeStation.$loaded = true;
            });
        }

        /**
         * Center the map to given office
         * @param Object position
         */
        function setCenterMap(position) {
            map.animateCamera({
                target: {
                    lat: position.latitude,
                    lng: position.longitude
                },
                zoom: 16,
                duration: 1000
            });
        }

        /**
         * Center the map on the closest station
         *
         * @param Position position
         */
        function handleLocationActive(position) {
            currentPosition = position.coords;

            if (!userMarker) {
                map.addMarker({
                    position: {
                        lat: currentPosition.latitude,
                        lng: currentPosition.longitude
                    },
                    icon: {
                        url: 'www/assets/img/vliller-marker-user.png',
                        size: {
                            width: 18,
                            height: 18
                        }
                    },
                    disableAutoPan: true

                }, function (marker) {
                    userMarker = marker;
                });
            } else {
                userMarker.setPosition({
                    lat: currentPosition.latitude,
                    lng: currentPosition.longitude
                });
            }

            setCenterMap(currentPosition);

            // compute the closest station and set active
            var closest = GoogleMapsTools.computeClosestMarker(currentPosition, markers);
            setActiveMarker(closest, false);
        }

        /**
         * Updates the current position
         */
        vm.updatePosition = function () {
            vm.isGPSLoading = true;

            // Get current location
            Location.getCurrentPosition()
                .then(function (position) {
                    handleLocationActive(position);
                }, function (error) {
                    if (error === 'locationDisabled') {
                        aetmToastService.showError('Vous devez activer votre GPS pour utiliser cette fonctionnalité.', 'long');

                        return error;
                    }

                    errorHandler(error);
                })
                .finally(function () {
                    vm.isGPSLoading = false;
                });
        };

        /**
         * Launch navigation application (Google Maps if avaible)
         */
        vm.navigate = function () {
            Navigation.navigate(currentPosition, vm.activeStation);
        };
    }]);
}());