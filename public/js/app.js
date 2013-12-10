//connect to our socket server
var socket = io.connect('http://fry.local:1337/');

//setup some common vars
var $left = $('#left'),
	$right = $('#right'),
	$info = $('#info'),
	$secondary = $('.secondary');

var side;

function init(){
	$info.html('Red<br /><p class="solid">vs.</p>Green');

	$left.animate({width:'50%'}, 500);
	$right.animate({width:'50%'}, 500);
	$info.delay(300).fadeIn();
}

function initDesktop(){
	init();//call main init
	$secondary.text('Waiting for players').fadeIn('fast');
}

function initMobile(){
	side = undefined;

	init();//call main init

	$secondary.text('Choose a side').fadeIn('fast');

	$left.click(function(e){
		sideSelected('left');
	});

	$right.click(function(e){
		sideSelected('right');
	});

}

function sideSelected(selectedSide){
	if(side === undefined){
		side = selectedSide;

		//join the socket group
		socket.emit('join', {type:side});

		//drop the events 
		$left.unbind('click');
		$right.unbind('click');

		//make some visual updates
		if(side=='right'){
			$right.animate({width:'100%'}, 500);
			$left.animate({width:'0%'}, 500);
		}else{
			$left.animate({width:'100%'}, 500);
			$right.animate({width:'0%'}, 500);
		}
		
		$info.parent().fadeOut('fast', function(e){
			$secondary.text('');
			$info.text('Tap!');
			$(this).fadeIn('fast');
		});

		//add an event to the main body to tap away
		$('body').on('touchstart', function(e){
			socket.emit('tap', {side:side});
		});
	}
}

//shortcut for document.ready
$(function(){

	//initialize all desktops from the server
	socket.on('init-desktop', function(data){
		initDesktop();
	});
	//initialize all the mobile devices
	socket.on('init-mobile', function(data){
		initMobile();
	});

	//kicks off the game (on the desktops)
	socket.on('game-start', function(data){
		$info.parent().fadeOut('fast', function(e){
			$secondary.text('It\'s on!');
			$(this).fadeIn('fast');
		});
	});

	//ends the game (on the desktops)
	socket.on('game-over', function(data){
		var winner = (data.winner == 'left')? 'red':'green';
		if(data.winner == 'left'){
			$left.animate({width:'100%'}, 500);
			$right.animate({width:'0%'}, 500);
		}else{
			$right.animate({width:'100%'}, 500);
			$left.animate({width:'0%'}, 500);
		}

		//update the copy
		$info.parent().fadeOut('fast', function(e){
			$info.text(winner + ' wins');
			$secondary.text('');
			$(this).fadeIn('fast');
		});
	});

	//receiving an update from the server about who's winning
	socket.on("change", function(data){
		$left.stop().animate({width:String(data.left + "%")},100);
		$right.stop().animate({width:String(data.right + "%")},100);
	});

	//the winning mobile devices are notified
	socket.on("winner", function(data){
		$('body').unbind('touchstart');
		$info.parent().fadeOut('fast', function(e){
			$info.text('You won');
			$(this).fadeIn('fast');
		});
	});
	//the losing mobile devices are notified
	socket.on("loser", function(data){
		$('body').unbind('touchstart');
		$info.parent().fadeOut('fast', function(e){
			$info.text('You lost');
			$(this).fadeIn('fast');
		});
	});
	
	//let the server know what device I am
	if(type == 'desktop'){
		initDesktop();
		socket.emit('join', {type:'desktop'});
	}else{
		initMobile();
		socket.emit('join', {type:'mobile'});
	}

	// $sendBlastButton.click(function(e){

	// 	var blast = $blastField.val();
	// 	if(blast.length){
	// 		socket.emit("blast", {msg:blast}, 
	// 			function(data){
	// 				$blastField.val('');
	// 			});
	// 	}


	//});
	
});