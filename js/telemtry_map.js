var container = "telemtry_map"
var canvas = document.getElementById(container);
var context = canvas.getContext('2d');

// scaling ranges from 0 to 1
// The closer to the 1, the larger the canvas will be
var scaling = .73

// full scaling 
//var scaling = 1

var canvas_width = 1234
var canvas_height = 480

var scaled_width = canvas_width * scaling
var scaled_height = canvas_height * scaling

var canvas_offsetLeft = canvas.offsetLeft;
var canvas_offsetTop = canvas.offsetTop;

// the radius of the circles that will represent kills
var radius = 6
var minion_radius = 4

// keep track of the items that were painted
// this allows our overall list to be smaller incase we need 
// to loop through it frequently
var drawn_items = []

// keep track of the left and right team members/heros
var team = {'left': [], 'right': []}

start_time = new Date(data[0].time).getTime() / 1000
end_time = new Date(data.slice(-1)[0].time).getTime() / 1000

// canvas events
canvas.addEventListener('click', detectClick, false);
canvas.addEventListener('mousemove', detectHover, false);

function draw(callback)
{
	var imageObj = new Image();
    imageObj.onload = function() {

    	// Add the image to the canvas
    	context.drawImage(imageObj, 0, 0, scaled_width, scaled_height);

    	callback()
    };
    imageObj.src = 'img/vainglory-map.png';
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

	    	// add to our drawn items array:
	    	drawn_items.push(item)
		}
		else
		{
			context.beginPath();
	    	context.arc(x, y, minion_radius, 0, 2 * Math.PI, false);
	    	context.fillStyle = "white";
	    	context.fill();
	    	context.stroke();

	    	// add to our drawn items array:
	    	drawn_items.push(item)
		}
	}
}

function buildTeamObject()
{	
	// ignored kill actors:
	var ignore = ["RangedMinion", "LeadMinion", "Kraken_Captured"]

	for (i = 0; i < data.length; i++) {

		var hero = data[i].payload.Actor.replace(/\*/g, "")

		if (ignore.indexOf(hero) <= -1)
		{
			// check what team the hero is on
			if (data[i].payload.Team == "Left")
			{	
				if (team.left.indexOf(hero) <= -1)
				{
					team.left.push(hero)
				}
		   	}
		   	else
		   	{
		    	if (team.right.indexOf(hero) <= -1)
				{
					team.right.push(hero)
				}
		   	}
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

function detectInsideItem(e)
{
	// find where exactly the canvas is on the screen and use the positions as the offset
	var rect = canvas.getBoundingClientRect();
	mx = e.clientX - rect.left;
    my = e.clientY - rect.top;

    for (i = 0; i < drawn_items.length; i++) {

    	cx = transformX(drawn_items[i].payload.Position[0])
		cy = transformY(drawn_items[i].payload.Position[2])

		// determine what radius to use
		if (drawn_items[i].payload.TargetIsHero)
			calc_radius = radius
		else
			calc_radius = minion_radius

		// distance formula
		var distance = Math.sqrt(Math.pow((mx - cx), 2) + Math.pow((my - cy), 2))
		if (distance <= radius)
		{
			return true
		}
	}

	return false
}

// detect if user clicked on a kill event in the canvas
function detectClick(e) {

	if (detectInsideItem(e))
	{
		drawOverlay(drawn_items[i], true, e.clientX, e.clientY)
	}
	else
	{
		drawOverlay(false, false, false, false)
	}
}

function detectHover(e)
{
	if (detectInsideItem(e))
	{
		canvas.style.cursor = "pointer";
	}
	else
	{
		canvas.style.cursor = "default";
	}
}

// show/hide the overlay
function drawOverlay(selectedItem, display, x, y)
{
	var overlay = $("#event_container")

	if (display)
	{
		overlay.removeClass('hide')
		overlay.css({'left': x, 'top': y});

		var content_string = selectedItem.payload.Actor + " killed " + selectedItem.payload.Killed
		var cleaned_content_string = content_string.replace(/\*/g, "")
		overlay.html(cleaned_content_string)
	}
	else
	{
		overlay.addClass('hide')
	}
}

function findHeroItems(hero)
{	
	// reset the drawn items
	drawn_items = []
	draw(function () {
		for (i = 0; i < data.length; i++) {
			
			var item_actor_hero = data[i].payload.Actor.replace(/\*/g, "")
			
			//var item_killed_hero = data[i].payload.Killed.replace(/\*/g, "")
			var item_killed_hero = ''
			if (typeof data[i].payload.Killed != "undefined") {
			   item_killed_hero = data[i].payload.Killed.replace(/\*/g, "")
			}

			if (hero == item_killed_hero || hero == item_actor_hero)
			{	
				drawDataObject(data[i])
			}
		}
	})
}

// Initialize the page load. Draw the image then draw the telemetry items
setTimeout(function() {
	// reset the drawn items:
	drawn_items = []

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

	buildTeamObject()

	var player_source = $('#entry-template').html();
	var player_template = Handlebars.compile(player_source);
	$("#results").html(player_template(team))

	$( "#timeline" ).slider({
		range: "max",
		min: start_time,
		max: end_time,
		value: start_time,
		slide: function( event, ui ) {

			// reset the drawn items:
			drawn_items = []

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

	// Show the hero's kills/deaths
	$(".toggleItems").click(function() {
		$(".toggleItems").removeClass('active')
		$(this).addClass('active')
		var hero = $(this).attr("hero");
		findHeroItems(hero)
	})
	drawn_items = []
})