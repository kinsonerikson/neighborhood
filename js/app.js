//In order to initialize the map and the markers we have to go global
var map;

var Marker = function(name,lat,lng){
	this.name = name;
	this.lat = lat;
	this.lng = lng;
	this.visible = true;
	var that = this;
	var contentString = "<h4>In The News</h4><p>{{headlines}}</p><h4>Images</h4><p>{{images}}</p>";
	this.info = new google.maps.InfoWindow({
      	content: contentString
  	});
	this.addMarker = function(){
		var marker = new google.maps.Marker({
			position: { lat: this.lat, lng: this.lng},
			map: map
		});
		google.maps.event.addListener(marker, 'click', function() {
    		that.showInfo();			
  		});
		return marker;
	};
	this.removeMarker = function(){
		this.pos.setMap(null);	
	};		
	this.showInfo = function(){		
		this.info.open(map,this.pos);
	};
	this.pos = this.addMarker();
	this.getNews = function(){
		var url = "http://api.nytimes.com/svc/search/v2/articlesearch.json?";
		url+="q="+this.name;
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
			headlines +="</div>";
			that.info.content = that.info.content.replace('{{headlines}}',headlines);
		}).fail(function(msg){
			that.info.content = that.info.content.replace('{{headlines}}','Unable to load headlines.');
		});
	}
	this.getNews();
	
}
var ViewModel = function(){
	var that = this;		
	var mapOptions = {
		center: { lat: 51.4999600, lng: -0.1260000},
		zoom: 17
	};
	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);	
	var initMarkers = [
		new Marker('Big Ben',51.500729,-0.124625),
		new Marker('Westminster Abbey',51.499292,-0.12731),
		new Marker('Westminster Bridge',51.500875,-0.122329),
		new Marker('House of Commons',51.499794,-0.124693),
		new Marker('10 Downing Street',51.503312,-0.127624)
	];
	that.filterMarkers = function(){
		//console.log(that.searchString());	
		console.log('derp');
		return that.searchString();
	}
	that.searchString = ko.observable("");
	that.markers = ko.observableArray(initMarkers);	
};

$(document).ready(function(){
	ko.applyBindings(new ViewModel());	
});