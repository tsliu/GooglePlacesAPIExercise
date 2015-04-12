var map;
var markers = [];
var service;
var infowindow;

// Hack: Since google.maps.places.PlaceSearchPagination cannot provide the current page number,
// I need to know whether the callback function is loading the first page to decide whether to
// clear previous markers and results.
var isFirstPage = true;

function initialize() {

  var inputBox = document.getElementById('inputBox');
  var autocomplete = new google.maps.places.Autocomplete(inputBox);

  map = new google.maps.Map(document.getElementById('map-canvas'));
  service = new google.maps.places.PlacesService(map);
  infowindow = new google.maps.InfoWindow();

  search();

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    // When a place is selected, search this place instead of directl loading it in map.
    search();
  });
}

function callback(results, status, pagination) {
  if (status != google.maps.places.PlacesServiceStatus.OK) {
    return;
  } else {

    if(isFirstPage) {
      //Clear current search result
      $('#place-list').empty();
      setMapForMarkers(null);
      markers = [];
    } else {
      // remove the li containing the more button since it'll be added later.
      $('#more').parent().remove();
    }

    createMarkers(results);

    // Set this flag for future page loads.
    isFirstPage = false;

    if (pagination.hasNextPage) {

      // Append the load more button as part of the list.
      $('#place-list').append('<li><button id="more" class="btn btn-default">More results</button></li>');
      
      var moreButton = document.getElementById('more');
      moreButton.disabled = false;

      google.maps.event.addDomListenerOnce(moreButton, 'click',
        function() {
          moreButton.disabled = true;
          moreButton.innerHTML = '<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading...';
          pagination.nextPage();
        });
    }
  }
}

function createMarkers(places) {
  var bounds = new google.maps.LatLngBounds();

  for (var i = 0, place; place = places[i]; i++) {
    createMarker(i, place, bounds);  
  }

  map.fitBounds(bounds);
}

function createMarker(i, place, bounds) {
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

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent('<a href="#panel'+i+'">'+place.name+'</a>');
    infowindow.open(map, this);
  });

  markers.push(marker);
  $('#place-list').append(generateListItemHTML(i,place));
  bounds.extend(place.geometry.location);
}

function generateListItemHTML(index,place) {
  html = '<div id="panel'+index+'" class="panel panel-default">';
  html += '<div class="panel-heading"><h4 class="panel-title"><a class="collapsed" data-toggle="collapse" data-target="#collapse'+index+'">';
  html += place.name;
  html += '</a></h4></div>';
  html += '<div id="collapse'+index+'" class="panel-collapse collapse"><div class="panel-body">';
  html += 'something'; // This is the actual content
  html += '</div></div></div>'
  return html;
}

function setMapForMarkers(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function search(queryString) {
  isFirstPage = true;
  queryString = queryString || $('#inputBox').val()
  var request = {
     query: queryString
  };
  service.textSearch(request, callback);
}

$(document).ready(function(){
  $('#lookup').click(function() { 
    search();
  });
});

google.maps.event.addDomListener(window, 'load', initialize);
