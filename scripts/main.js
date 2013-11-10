$(function() {
  var chchCenter = L.latLng([-43.5319, 172.634])

  //Create a map focused on Christchurch
  var map = L.map('map').setView(chchCenter, 13);

  //Add an OSM tile layer
  L.tileLayer('//{s}.tile.cloudmade.com/39239bf77a964887becf688f462e9ff8/997/256/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 18
  }).addTo(map);


  var spinOpts = {
    lines: 11, // The number of lines to draw
    length: 0, // The length of each line
    width: 5, // The line thickness
    radius: 9, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#fff', // #rgb or #rrggbb or array of colors
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: 'auto', // Top position relative to parent in px
    left: 'auto' // Left position relative to parent in px
  };

  //Test for user locatable
  if ('geolocation' in navigator) {

    var locationButton = $('#center-on-user');

    var locationMarker = L.marker(chchCenter).addTo(map);

    function centerOnUser() {
      locationButton.text('');
      locationButton.attr('disabled', 'disabled');
      var locSpinner = new Spinner(spinOpts).spin(locationButton[0]);
      navigator.geolocation.getCurrentPosition(function(position) {
        var positionLatLng = L.latLng([position.coords.latitude, position.coords.longitude]);
        map.panTo(positionLatLng);
        map.setZoom(15);
        locSpinner.stop();
        locationButton.text('My Location');
        locationButton.removeAttr('disabled');
        locationMarker.setLatLng(positionLatLng);
      });
    }

    locationButton.show();
    locationButton.on('click', function (e) {
      centerOnUser();
      e.preventDefault();
    });
    //Move to users location
    centerOnUser();

  }

  var placeMarkers = [];
  function distance(a, b) {
    aPoint = L.latLng([a.lat, a.lng]);
    bPoint = L.latLng([b.lat, b.lng]);
    return aPoint.distanceTo(bPoint);
  }
  var tree = new kdTree(placeMarkers, distance, ['lat', 'lng']);

  //Fetch beer feeds
  var feedIds = [23, 7, 29, 30, 109, 8];
  var feedUrl = 'findchch.com/categories/{id}.json';
  _.each(feedIds, function (id) {
    //Use CORS proxy to bypass access control allow origin
    var url = 'http://www.corsproxy.com/' + feedUrl.replace('{id}', id);
    var jqxhr = $.get(url, function (data) {
      _.each(data.objects, function (place) {
        //Construct a marker for each place and add to map
        var marker = L.marker(place.geometry[1], {
          title: place.name,
        }).addTo(map);
        var popupContent = '<h1>'+place.name+'</h1>'+place.address+place.description;
        marker.bindPopup(popupContent);
        var markerObject = {
         marker: marker,
         lat: place.geometry[1][0],
         lng: place.geometry[1][1]
        };
        placeMarkers.push(markerObject);
        tree.insert(markerObject)
      });
    });
  });

  $('#find-nearest').on('click', function (e) {
    var center = map.getCenter();
    var nearest = tree.nearest({lat: center.lat, lng: center.lng}, 1)[0][0].marker;
    map.panTo(nearest.getLatLng());
    nearest.openPopup();
    e.preventDefault();
  });
});
