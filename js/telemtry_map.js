var container = "telemtry_map"
var canvas = document.getElementById(container);
var context = canvas.getContext('2d');

// scaling ranges from 0 to 1
// The closer to the 1, the larger the canvas will be
var scaling = .58

// full scaling 
//var scaling = 1

var canvas_width = 1234
var canvas_height = 480

var scaled_width = canvas_width * scaling
var scaled_height = canvas_height * scaling

// the radius of the circles that will represent kills
var radius = 6

start_time = new Date(data[0].time).getTime() / 1000
end_time = new Date(data.slice(-1)[0].time).getTime() / 1000

function draw(callback)
{
	var imageObj = new Image();
    imageObj.onload = function() {

    	// Add the image to the canvas
    	context.drawImage(imageObj, 0, 0, scaled_width, scaled_height);

    	callback()
    };
    imageObj.src = '../telemtry_canvas/img/vainglory-map.png';
}

function drawDataObject(item)
{
	//Find hero/hero kills		  		
	if (item.type == "KillActor" || item.type == "NPCkillNPC")
	{				  		
		x = transformX(item.payload.Position[0])
		y = transformY(item.payload.Position[2])

		if (item.payload.TargetIsHero)
		{

			if (item.payload.KilledTeam == "Left")
				killed_team_color = "red"
			else
				killed_team_color = "blue"

			if (item.payload.Team == "Left")
				killer_team_color = "red"
			else
				killer_team_color = "blue"		  	  

			context.beginPath();
	    	context.arc(x, y, radius, 0, 2 * Math.PI, false);
	    	context.fillStyle = killed_team_color;
	    	context.fill();
	    	context.stroke();
		}
		else
		{
			context.beginPath();
	    	context.arc(x, y, 4, 0, 2 * Math.PI, false);
	    	context.fillStyle = "white";
	    	context.fill();
	    	context.stroke();
		}
	}
}

// Transform the telemetry X coordinate to fit the correct map scaling
function transformX(x)
{	
	return (x - -93) * (scaled_width / 185)
}

// Transform the telemetry Y coordinate to fit the correct map scaling
function transformY(y)
{	
	return (y - -25) * (scaled_height / 75);
}

// Initialize the page load. Draw the image then draw the telemetry items
setTimeout(function() {

	// resize the canvas:
	context.canvas.width  = scaled_width;
	context.canvas.height = scaled_height;

	draw(function () {
		// loop through every item
		for (i = 0; i < data.length; i++) { 
		    drawDataObject(data[i])
		}
	})
}, 10)


// Add a jquery ui slider and interact with it
$(document).ready(function () {

	$( "#timeline" ).slider({
		range: "max",
		min: start_time,
		max: end_time,
		value: start_time,
		slide: function( event, ui ) {

			// calculate the time difference
			var diffMs = (ui.value - start_time);
			var diffMins = Math.floor(diffMs/60);

			draw(function () {
				// loop through the data set to see if it the items exist in the time frame
				$.each(data, function (key, item) {
					item_time = new Date(item.time).getTime() / 1000

					if (item_time <= ui.value)
					{
						drawDataObject(item)
					}
				})
			})
		}
	})
})