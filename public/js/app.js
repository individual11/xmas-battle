//setup some common vars
var $left = $('#left'),
	$right = $('#right'),
	$info = $('#info'),
	$secondary = $('.secondary');

var side, isPlaying;

function init(){
	$info.html('Red<br /><p class="solid">vs.</p>Green');

	$left.animate({width:'50%'}, 500);
	$right.animate({width:'50%'}, 500);
	$info.parent().delay(300).fadeIn();
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
			$secondary.text('Waiting for other players to join');
			$info.text('');
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

	////////////////
	// FOR DESKTOP
	///////////////

	//initialize all desktops from the server
	socket.on('init-desktop', function(data){
		initDesktop();
	});

	//ends the game (on the desktops)
	socket.on('game-over', function(data){
		isPlaying = false;
		var winner = (data.winner == 'left')? 'red':'green';
		if(data.winner == 'left'){
			$left.animate({width:'100%'}, 50);
			$right.animate({width:'0%'}, 50);
		}else{
			$right.animate({width:'100%'}, 50);
			$left.animate({width:'0%'}, 50);
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
		if(isPlaying){
			$left.stop().animate({width:String(data.left + "%")},100);
			$right.stop().animate({width:String(data.right + "%")},100);
		}
	});

	////////////////
	// FOR MOBILE
	///////////////

	//initialize all the mobile devices
	socket.on('init-mobile', function(data){
		initMobile();
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
	

	//////////
	// SHARED
	/////////

	socket.on('error', function(){
		$info.parent().fadeOut('fast', function(e){
			$info.text('Error')
			$secondary.text('Try refreshing the page');
			$(this).fadeIn('fast');
		});
		console.error('ERROR FOUND, SEE BELOW');
	});

	//kicks off the game (on the desktops)
	socket.on('game-start', function(data){
		isPlaying = true;

		if(type == 'desktop'){
			$info.parent().fadeOut('fast', function(e){
				$secondary.text('It\'s on!');
				$(this).fadeIn('fast');
			});
		}else{//is mobile
			$info.parent().fadeOut('fast', function(e){
				$secondary.text('');
				$info.text('Tap!');
				$(this).fadeIn('fast');
			});
		}
		
	});

	//let the server know what device I am when joining
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