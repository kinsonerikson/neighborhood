//In order to initialize the map and the markers we have to go global
var map;
//The Marker constructor will generate a marker at the coordiantes provided and setup the initial info about the marker
var Marker = function(name,lat,lng){
	//Setup our initial values based on the ones passed in and default the visiblity to true.
	//set that = to this so we always have the right context for our bindings.
	var that = this;
	that.name = name;
	that.lat = lat;
	that.lng = lng;
	that.visible = ko.observable(true);
	
	//Default content to be updated with our API Calls.
	var contentString = "<h3>"+that.name+"</h3><h4>In The News</h4><p>{{headlines}}</p><h4>Images</h4><p>{{images}}</p>";

	//Sets up a new InfoWindow that will appear when a user clicks the marker or list item
	that.info = new google.maps.InfoWindow({
      	content: contentString
  	});
	
	/*
		Adds a marker to the map at the specified locations and sets up the listener to 
		show the info window when the marker is clicked
	*/
	that.addMarker = function(){
		var marker = new google.maps.Marker({
			position: { lat: that.lat, lng: that.lng},
			map: map
		});
		google.maps.event.addListener(marker, 'click', function() {
    		that.showInfo();			
  		});
		return marker;
	};
	
	//As part of the filtering in the ViewModel, this will remove the marker from the map, essentially "Hiding" it
	that.hideMarker = function(){
		that.pos.setMap(null);	
	};
	
	//As part of the filtering in the ViewModel, this will add the marker to the map, essentially "Showing" it.
	that.showMarker = function(){
		that.pos.setMap(map);	
	};
	
	//This will show the info window when the marker or list item is clicked.
	that.showInfo = function(){		
		that.info.open(map,that.pos);
	};
	
	//Initializes the marker and stores it into the Marker object so we can modify it later
	that.pos = that.addMarker();
	
	/*
		This makes a call to the New York Times API and gets headlines and web_urls for 
		articles associated with our place name. If it fails it will display "Unable to load headlines."
		If it succeeds it will take the top 5 headlines and add them to the InfoWindow		
	*/
	that.getNews = function(){
		var url = "http://api.nytimes.com/svc/search/v2/articlesearch.json?";
		url+="q="+that.name;
		url+='&fq=glocations:("LONDON"),pub_year:2015';
		url+="&fl=web_url,headline";
		url+="&api-key=6d56f3e061aaf263385ce087d9f3b906:13:71762457";
		$.ajax({
			url: url,
			method: "get"
		}).done(function(msg){
			var r = msg;
			var articles = r.response.docs;
			var headlines = '<div class="list-group">';
			var loopCount = 5;
			if(articles.length < 5){
				loopCount = articles.length;	
			}
			for(var i=0;i<loopCount;i++){
				var a = articles[i];
				headlines+='<a href="'+a.web_url+'" target="_blank" class="list-group-item">'+a.headline.main+'</a>';
			}
			headlines +='<p><small>Headlines courtesy of <a href="http://www.nytimes.com/" target="_blank">The New York Times</a></small></p></div>';
			that.info.content = that.info.content.replace('{{headlines}}',headlines);
		}).fail(function(msg){
			that.info.content = that.info.content.replace('{{headlines}}','Unable to load headlines.');
		});
	};
	
	//Calls the getNews function to initialize our news content.
	that.getNews();
	
	/*
		This makes a call to the Yahoo Flickr API for images associated with our place name. If it fails it will 
		display "Unable to load images."
		If it succeeds it will take the top 5 images and add them to the InfoWindow
	*/
	
	that.getImages = function(){
		var url = "https://api.flickr.com/services/rest/?method=flickr.photos.search";
		url+="&api_key=d648c4834c3bcc5dbf31a82daf8be560";
		url+="&tags="+that.name;
		url+="&per_page=5&page=1&format=json&nojsoncallback=1";
		$.ajax({
			url: url,
			method: "get"
		}).done(function(msg){
			var r = msg;
			var photos = r.photos.photo;
			var images = '<div>';
			var loopCount = 5;
			if(photos.length < 5){
				loopCount = photos.length;	
			}
			for(var i=0;i<loopCount;i++){
				var p = photos[i];
				//headlines+='<a href="'+a.web_url+'" target="_blank" class="list-group-item">'+a.headline.main+'</a>';
				var imgUrl= "https://farm"+p.farm+".staticflickr.com/"+p.server+"/"+p.id+"_"+p.secret+"_t.jpg";
				var img = '<a href="'+imgUrl.replace('_t','')+'" target="_blank">';
				img+= '<img src="'+imgUrl;				
				img+='"></a>&nbsp;';
				images+=img;
				
			}
			images +='<p><small>Images courtesy of <a href="http://www.flickr.com/" target="_blank">flickr</a></small></p></div>';
			that.info.content = that.info.content.replace('{{images}}',images);
		}).fail(function(msg){
			that.info.content = that.info.content.replace('{{images}}','Unable to load images.');
		});
	};
	
	that.getImages();
};

//The ViewModel object that will get bound to knockout
var ViewModel = function(){
	//set that = this so we always have the right context for our bindings.
	var that = this;	
	
	//Function to setup the map object
	that.initializeMap = function(){	
		var mapOptions = {
			center: { lat: 51.4999600, lng: -0.1260000},
			zoom: 16
		};
		map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
		var trafficLayer = new google.maps.TrafficLayer();
		trafficLayer.setMap(map);
	};
	
	//Need to call the map before we can bind the markers
	that.initializeMap();
	
	//This initial array creates each of the markers as Marker objects and is then passed in as an observable.
	var initMarkers = [
		new Marker('Big Ben',51.500729,-0.124625),
		new Marker('Westminster Abbey',51.499292,-0.12731),
		new Marker('Westminster Bridge',51.500875,-0.122329),
		new Marker('House of Commons',51.499794,-0.124693),
		new Marker('10 Downing Street',51.503312,-0.127624)
	];	
	that.markers = ko.observableArray(initMarkers);
	
	//Setup our string to use as the search filter.
	that.searchString = ko.observable("");
		
	//Directly observe the searchString so we can hide/show the markers and list items that match		
	that.searchString.subscribe(function(searchValue){
		//Don't try to search on an empty string!
		if(searchValue !== ''){
			//Loop through all of the markers...
			for(var i=0;i<that.markers().length;i++){
				var m = that.markers()[i];
				//...and if the search string is in the marker's name show it ...
				if(m.name.indexOf(searchValue) >=0){
					m.visible(true);
					m.showMarker();
				}
				//... otherwise hide it!
				else{
					m.visible(false);
					m.hideMarker();
				}				
			}
		}
		//Make sure that everything is visible if they clear out the search box.
		else{
			for(var j=0;j<that.markers().length;j++){
				that.markers()[j].visible(true);
				that.markers()[j].showMarker();
			}
		}
	});	
};

//Once the document is fully loaded apply the bindings in knockout
$(document).ready(function(){
	ko.applyBindings(new ViewModel());	
});