var map;
var markers = [];
var service;
var infowindow;
var index;

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
      //Reset the index
      index = -1;
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
    index++;
    createMarker(index, place, bounds);  
  }

  $('.collapse[data-placeId]').on('shown.bs.collapse', function() {
    var id = $(this).data('placeid');
    if(!id) return;
    $(this).data('placeid', null); // Remove data so it won't get loaded again

    var list = $(this).find('ul');
    // Spinner to indicate loading
    $(list).append('<li class="text-center"><span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading more details</li>');

    var request = { placeId: id };

    service.getDetails(request, function(details, status) {
      $(list).find('li:last').remove(); // Remove the loading box.
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        if(details.international_phone_number)
          $(list).append('<li><strong>number:</strong> '+details.international_phone_number+'</li>');
        if(details.website)
          $(list).append('<li><strong>website:</strong> '+details.website+'</li>');
        var opennow = details.opennow ? 'yes' : 'no';
        $(list).append('<li><strong>open now:</strong> '+opennow+'</li>');
      } else {
        $(list).append('<li class="alert alert-danger"><span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> Failed to load details</li>');
      }
    });

  });

  map.fitBounds(bounds);

  // Don't want the map to zoom too closely. Set a maximum zoom of 15 here.
  var zoom = map.getZoom();
  map.setZoom(zoom > 15 ? 15 : zoom);
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
    infowindow.setContent(generateInfoBoxHTML(i,place));
    infowindow.open(map, this);
  });

  markers.push(marker);
  $('#place-list').append(generateListItemHTML(i,place));
  $('#panel' + i).mouseover(function() {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  });
  $('#panel' + i).mouseout(function() {
    marker.setAnimation(null);
  });
  bounds.extend(place.geometry.location);
}

function generateListItemHTML(i,place) {
  html = '<div id="panel'+i+'" class="panel panel-default">';
  html += '<div class="panel-heading"><h4 class="panel-title"><a class="collapsed" data-toggle="collapse" data-target="#collapse'+i+'">';
  html += (i+1) + '. ' + place.name;
  html += '</a></h4></div>';
  html += '<div id="collapse'+i+'" class="panel-collapse collapse" data-placeid="'+place.place_id+'"><div class="panel-body">';
  html += '<ul id="listing-details">'
  // Actual content begins here
  html += '<li><strong>address:</strong> ' + place.formatted_address + '</li>';
  // Actual content ends here
  html += '</div></div></div>';
  return html;
}

function generateInfoBoxHTML(i,place) {
  html = (i+1) + '. <a href="#collapse'+i+'">'+place.name+'</a>';
  html += '<br />';
  html += '<span>'+place.formatted_address+'</span>';
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

$(window).on('hashchange',function(){
  $(location.hash).collapse('show');
});

google.maps.event.addDomListener(window, 'load', initialize);
