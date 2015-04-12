var map;
var markers = [];

function initialize() {

  var inputBox = document.getElementById('inputBox');
  var autocomplete = new google.maps.places.Autocomplete(inputBox);


  var zenefits = new google.maps.LatLng(37.761824, -122.398587);

  map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: zenefits,
    zoom: 15
  });


  var request = {
     query: 'sushi in san mateo'
  };

  var service = new google.maps.places.PlacesService(map);
  service.textSearch(request, callback);

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    alert("!");
  });
}


  function setupClickListener(id, types) {
    var radioButton = document.getElementById(id);
    google.maps.event.addDomListener(radioButton, 'click', function() {
      autocomplete.setTypes(types);
    });
  }



function callback(results, status, pagination) {
  if (status != google.maps.places.PlacesServiceStatus.OK) {
    return;
  } else {
    createMarkers(results);

    if (pagination.hasNextPage) {
      var moreButton = document.getElementById('more');

      moreButton.disabled = false;

      google.maps.event.addDomListenerOnce(moreButton, 'click',
        function() {
          moreButton.disabled = true;
          pagination.nextPage();
        });
    }
  }
}

function createMarkers(places) {
  var bounds = new google.maps.LatLngBounds();

  setMapForMarkers(null);
  markers = [];

  for (var i = 0, place; place = places[i]; i++) {
    var image = {
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(25, 25)
    };

    var marker = new google.maps.Marker({
      map: map,
      icon: image,
      title: place.name,
      position: place.geometry.location
    });
    markers.push(marker);

    $('#place-list').append('<li>' + place.name + '</li>');

    bounds.extend(place.geometry.location);
  }
  map.fitBounds(bounds);
}

function setMapForMarkers(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

$(document).ready(function(){
  $('#lookup').click(function() {      
    var request = {
      query: $("#inputBox").val()
    }
    service = new google.maps.places.PlacesService(map);
    service.textSearch(request, callback);   
  });
});

google.maps.event.addDomListener(window, 'load', initialize);
