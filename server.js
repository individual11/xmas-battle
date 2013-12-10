/*


TODO:
- add error support for not getting socket working
- make it so if a desktop joins after the game is in progress, they jump right into watching
- make it so even teams are not neccesary
- better mobile experience with full-screen (iphone)
- compress js from grunt

- logo
- add "about" somewhere
- create rooms (name-space)
- text shadow is sucking on mobile devices

*/

// express magic
var express = require('express');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
io.set('log level', 1); // reduce logging

var device  = require('express-device');

var port, socket;

//check environment
if(process.env.NODE_ENV == 'production'){
	port = 80;
	socket = 'http://xmas-battle.jit.su:' + port;
}else{
	port = 1337;
	socket = 'http://fry.local:' + port;
}


//used for game
var left = 50,
	right = 50,
	leftTap = 50,
	rightTap = 50,
	isPlaying = false;

function reset(){
	left = 50;
	right = 50;
	leftTap = 50;
	rightTap = 50;
	isPlaying = false;

	//clear out the rooms
	emptyRoom('left');
	emptyRoom('right');

	//reset the clients in 5 seconds
	setTimeout(function(){
		io.sockets.in('desktop').emit('init-desktop', {});
		io.sockets.in('mobile').emit('init-mobile', {});
	}, 5000);

}

function emptyRoom(roomName){
	var clients = io.sockets.clients(roomName);

	for(var i = 0; i < clients.length; i++) {
        clients[i].leave(roomName);
    }
}

function clientsInRoom(roomName){
	return io.sockets.clients(roomName).length;
}

// used for loging
var log = new Array();


app.configure(function(){
	// I need to access everything in '/public' directly
	app.use(express.static(__dirname + '/public'));

	//set the view engine
	app.set('view engine', 'ejs');
	//path to where the views are
	app.set('views', __dirname +'/public/views');

	app.use(device.capture());
});



// logs every request
app.use(function(req, res, next){
	// keep track of every request in the array
	log.push({method:req.method, url: req.url, device: req.device});

	// goes onto the next function in line
	next();
});

app.get("/", function(req, res){
	res.render('index', {type:req.device.type, socketPath:socket});
});


//sends back the log as JSON data
app.get('/log', function(req, res){
	res.json(log);
});

//reset the numbers
app.get('/reset', function(req, res){
	reset();
	res.redirect(301, '/');
})

//this event is fired whenever any device connects to the socket
io.sockets.on('connection', function (socket) {

	//put the right people in the right rooms
	socket.on('join', function(data){
		socket.join(data.type);//works for desktop, mobile, left or right

		if(clientsInRoom('left') && clientsInRoom('right') && !isPlaying){
			io.sockets.emit('game-start', {});
			isPlaying = true;
		}

		console.log(data.type + " - joined");
	});

	//when a mobile device sends a tap notification
	socket.on('tap', function(data){
		if(isPlaying){
			//decide what team they are on and adjust the score
			if(data.side == 'left'){
				leftTap++;
				rightTap--;
			}else if(data.side == 'right'){
				rightTap++;
				leftTap--;
			}

			//make sure the taps never drop below zero
			if(leftTap < 0) leftTap = 0;
			if(rightTap < 0) rightTap = 0;


			//evaluate the percentage between left/right
			var totalTap = leftTap + rightTap;
			left = Math.round((leftTap/totalTap)*100);
			right = 100-left;

			//decide of the match is over or what
			if(right == 100 || left == 100){
				isPlaying = false;
				var winningSide = (right==100)? 'right':'left';
				io.sockets.in('desktop').emit('game-over', {winner:winningSide});

				if(winningSide == 'right'){
					io.sockets.in('right').emit('winner', {winner:winningSide});
					io.sockets.in('left').emit('loser', {winner:winningSide});
				}else{
					io.sockets.in('left').emit('winner', {winner:winningSide});
					io.sockets.in('right').emit('loser', {winner:winningSide});
				}

				reset();//reset all the variables, which fires back to all the clients as well
			}else{
				//let the desktops know the score
				io.sockets.in('desktop').emit('change', {left:left, right:right});
			}
		}
	});

});


server.listen(port);//listen on port 1337