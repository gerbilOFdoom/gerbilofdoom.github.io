var flipbook = $('[id=flipbook]'),
	backward = $('.back'),
	forward = $('.forward'),
	thbutton = $('.thumbviewbutton'),
	zoomin = $('.zoomin'),
	zoomout = $('.zoomout'),
	zoomFactor = 1,
	zoomIncrement = .1,
	thumbnailView = false,
	lastTap = 0,
	clicktracker,
	thumbnails = [],
	pageRatio = []; //Height/width, found automatically based on first image.
//Init will:
//Initialize Turn.js, Hash, setup events, then display the flipbook.
function init() {
	//Create thumbnails
	$('.page').each(function(page) {
		$('.thumbview').append($(this).clone(false));
		var pageWidth = viewportSize.getWidth()*zoomFactor-2; //-1 to prevent scrollbars at zoom factor 1
		var pageHeight = viewportSize.getHeight()*zoomFactor-2;//reposition arrows accordingly
		console.log(typeof $('[page='+page+']').find("img")[0] === 'object');
		if(typeof $(this).find("img")[0] === 'object') {
			var newImg = new Image();
			newImg.src = $(this).find("img")[0].src;
			var height = newImg.height;
			var width = newImg.width;
			pageRatio.push(height/width);
			console.log(pageRatio[page]+" Virtual Image");
		}
		console.log(pageRatio);		
	});
	$('.thumbview').children().each(function(index) {
		$(this).children().each(function() {
			$(this).parent().css('background-image', "url('"+$(this).attr('src')+"')");
			$(this).remove();
		});
		$(this).css('background-size', "300px "+(300*pageRatio[index])+"px");
		$(this).css('background-repeat', 'no-repeat');
		$(this).css('float','left');
		$(this).width(300);
		$(this).height(300*pageRatio[index]);
		$(this).css('border', '1px solid black');
		$(this).css('margin', '1px');
		$(this).unbind();
		$(this).click(function() {
			thumbnailView = false;
			flipbook.turn('page',index+1);
			reflow();
		});
	});
	var columns = Math.floor((viewportSize.getWidth()*zoomFactor-2)/300);
	$('.thumbview').width(columns*304);
	$('.thumbview').css('margin-left', 'auto');
	$('.thumbview').css('margin-right', 'auto');
	flipbook.turn({
		display: 'single',
		autoCenter: false,
		duration: 1000,
		when: {
				turning: function(event, page, view) {
					// Update the current URI
					Hash.go('page/' + page).update();
				}
			}
	});

	Hash.on('^page\/([0-9]*)$', {
		yep: function(path, parts) {
			var page = parts[1];

			if (page!==undefined) {
				if (flipbook.turn('is'))	
					flipbook.turn('page', page);
					reflow();
			}

		},
		nop: function(path) {

			if (flipbook.turn('is')) {
				flipbook.turn('page', 1);
				reflow();
			}
		}
	});

	//Because the 'first page' event is not triggered when loading direclty to the first page.
	//Check and use via Modernizr
	
	//Button Position & Events
	forward.click(function() {
		thumbnailView = false;
		flipbook.turn('next');
	});
	backward.click(function() {
		thumbnailView = false;
		flipbook.turn('previous');
	});
	thbutton.click(function() {
		thumbnailView = !thumbnailView;
		reflow();
	});
	zoomin.click(function() {
		zoomFactor += zoomIncrement;
		reflow();
	});
	zoomout.click(function() {
		zoomFactor -= zoomIncrement;
		reflow();
	});
	flipbook.bind('tap click', function(e) {
		if(e.button == 0) { //Left Click
			if((new Date().getTime())-lastTap < 400) { //true: double tap
				if(zoomFactor == 1)
					zoomFactor = 2;
				else
					zoomFactor = 1;
				console.log(zoomFactor);
				lastTap = 0;
				clearTimeout(clicktracker);
				reflow();
			}
			else {
				clicktracker = setTimeout(function() {
					zoomFactor = 1;
					reflow();
					console.log(zoomFactor);
				}, 400);
				lastTap = new Date().getTime();
			}
		}
		
	});

	flipbook.bind('turning',function(event, page, view) {	
		$('.page p'+page).each(function() {
			$(this).width($(this).parent().width()).height($(this).parent().height());
		});
	});
	flipbook.bind('turned', function(event, page, view) {
		reflow();
	});
	flipbook.swipe({
		swipeStatus:function(event, phase, direction, distance, duration, fingers) {

		if(phase==$.fn.swipe.phases.PHASE_START) {
		} 

		if(phase==$.fn.swipe.phases.PHASE_CANCEL) {
			
		}   
	  },
	  swipe:function(event, direction, distance, duration, fingerCount) {
		if(direction == 'left')
			flipbook.turn('next');
		else if (direction == 'right')
			flipbook.turn('previous');
	  },
	  threshold:150,
	  fingers:1,
	  allowPageScroll:'auto'
	});

	$(window).resize(reflow);
	// Use arrow keys to turn the page
	$(document).keydown(function(e){
		var previous = 37, next = 39, esc = 27;
		switch (e.keyCode) {
			case previous:
				// left arrow
				e.preventDefault();
				$('.flipbook').turn('previous');
			break;
			case next:
				//right arrow
				e.preventDefault();
				$('.flipbook').turn('next');
			break;
			case esc:
				e.preventDefault();
				thumbnailView = false;
				zoom = 1;
				reflow();
			break;
		}
		
	});
	if( navigator.userAgent.match(/(Android|iPhone|iPod|iPad)/g) )
		$('head').append('<meta name="viewport" content="target-densitydpi=device-dpi" />');
	reflow();	
	$('.flipbook-container').css('display','inline');
	$('.loading').css('display','none');
}
//Reflow does:
//Refit flipbook window to browser window, multiply by zoom factor
//Discover portrait/landscape mode and adjust
//Reposition buttons
function reflow() {
	if(typeof zoomFactor === 'undefined')
		zoomFactor = 1;
	if(zoomFactor > 1 || thumbnailView) {
		$('body').css('overflow', 'auto');
	}
	else
		$('body').css('overflow', 'hidden');
	var pageWidth = viewportSize.getWidth()*zoomFactor-2; //-1 to prevent scrollbars at zoom factor 1
	var pageHeight = viewportSize.getHeight()*zoomFactor-2;//reposition arrows accordingly
	$('.flipbook-container').width(pageWidth);
	$('.flipbook-container').height(pageHeight);
	if(thumbnailView) {
		flipbook.hide();
		forward.hide();
		backward.hide();
		thbutton.hide();
		zoomin.hide();
		zoomout.hide();
		$('.thumbview').show();
	}
	else {
		$('.thumbview').hide();
		if( navigator.userAgent.match(/(Android|iPhone|iPod|iPad)/g) ) {
			var zoom = document.width / window.innerWidth;
			if(zoom > 1)
				flipbook.swipe("disable");
			else
				flipbook.swipe("enable");
		}
		else {
			zoomin.show();
			zoomout.show();
		}
		if((pageHeight/pageRatio[flipbook.turn('page')-1]) <= pageWidth-86) { //Landscape
			var flipHeight = pageHeight-5;	
			var flipWidth = (pageHeight-5)/pageRatio[flipbook.turn('page')-1];
			var spaceAvailable = pageWidth - flipWidth;
			if(spaceAvailable < 172) {
				flipHeight -= (175-spaceAvailable)*pageRatio[flipbook.turn('page')-1];
				flipWidth -= (175-spaceAvailable);
			}
			backward.css({
				'bottom': $('.flipbook-container').height()/2,
				'left': '0px',
				'float': 'left'
			});
			thbutton.css({
				'bottom': $('.flipbook-container').height()/2-100,
				'left': '0px',
				'float': 'left'
			});
			forward.css({
				'bottom': $('.flipbook-container').height()/2,
				'right': '0px',
				'left': '',
				'float': 'left'
			});
			zoomin.css({
				'bottom': $('.flipbook-container').height()/2+100,
				'right': '0px',
				'left': '',
				'float': 'left'
			});
			zoomout.css({
				'bottom': $('.flipbook-container').height()/2-100,
				'right': '0px',
				'left': '',
				'float': 'left'
			});
		}
		else {
			var flipHeight = (pageWidth-5)*pageRatio[flipbook.turn('page')-1]; //Portrait
			var flipWidth = pageWidth-5;
			var spaceAvailable = pageHeight - flipHeight;
			if(spaceAvailable < 86) {
				flipWidth -= (91-spaceAvailable)/pageRatio[flipbook.turn('page')-1];
				flipHeight -= (91-spaceAvailable);
			}
			backward.css({
				'bottom': '0px',
				'left':  $('.flipbook-container').width()/2-221,
				'float': 'left'
			});
			thbutton.css({
				'bottom': '0px',
				'left': $('.flipbook-container').width()/2-44,
				'float': 'left'
			});
			forward.css({
				'bottom': '0px',
				'right': '',
				'left':  $('.flipbook-container').width()/2+133,
				'float': 'right'
			});
			zoomin.css({
				'bottom': '0px',
				'right': '',
				'left': $('.flipbook-container').width()/2+45,
				'float': 'right'
			});
			zoomout.css({
				'bottom': '0px',
				'right': '',
				'left': $('.flipbook-container').width()/2-135,
				'float': 'left'
			});
			
		}
		flipbook.show();
		thbutton.show();
		if(flipbook.turn('page') != flipbook.turn('pages'))
			forward.show();
		else
			forward.hide();
		if(flipbook.turn('page') != 1)
			backward.show();
		else
			backward.hide();
		flipbook.turn('size',flipWidth, flipHeight);

		$('img').each(function() {
			$(this).width(flipWidth).height(flipHeight).css('backgroundsize', flipWidth+'px '+flipHeight+'px');
		});
		var verticalpos = flipbook.height()/2;
	}
}