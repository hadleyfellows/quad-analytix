// Module dependencies
var socket = require('socket.io');
var request = require('request');
var cheerio = require('cheerio');

// Socket.io callbacks
var socketConnectionCallBack = socketConnectionCallBack;
var recursiveRequest = recursiveRequest;

// Module root
module.exports = function (server){ 
	var io = socket.listen(server);
	io.sockets.on('connection', socketConnectionCallBack);
	return io;
};


/*
 * socketConnectionCallBack
 * module function that handles socket.io configuration
 * @params socket {object} socket object
 */
function socketConnectionCallBack (socket) {
    socket.on('crawl-site', function (urlSuffix) {
	    var baseURL = 'http://www.scheels.com'; 
	      // url:baseURL + '/shop/scheels-catalog/-men/-mens-activities-/mens-workwear/Carhartt-Adult-Acrylic-Watch-Cap-35481-A18-L3',
	    var url = baseURL + urlSuffix;
	    var itemIndex = [];
	    var itemQueue = [];
	    var items = [];
	    var fs = require('fs');
	    var requestOptions = {
	      url: url,
	      method: 'GET',
	      baseURL   : baseURL,
	      itemIndex : itemIndex,
	      itemQueue : itemQueue,
	      items     : items,
	      socket    : socket,
	      firstReq  : true
	    };
	    recursiveRequest(requestOptions);
	}); 
}


/*
 * recursiveRequest
 * recusrive request to comb site for products
 * @params requestOptions {object} http request configuration object
 */
function recursiveRequest (requestOptions) {
  request(requestOptions, function(err, resp, html) {
    var url 		= this.url;
    var baseURL 	= this.baseURL;
    var itemIndex   = this.itemIndex;
    var itemQueue   = this.itemQueue;
    var items 		= this.items;
    var socket 		= this.socket;
    var index 		= itemQueue.indexOf(url);

    itemQueue.splice(index);

    if (!err){
		$ = cheerio.load(html);
		var html = $.html();
		var tt = $("script");
		var len = tt.length;
		if (tt[len-1] && tt[len-1].children[0]) {       
			var text = tt[len-1].children[0].data;
			if (text && text.split('POWERREVIEWS.display.render(') && text.split('POWERREVIEWS.display.render(')[1]) {        
				var result = text.split('POWERREVIEWS.display.render(')[1].split(');')[0];
				var object = eval('(' + result + ')');
				if (!this.firstReq) {
					items.push(object);
					socket.emit('item', object);
				};
			};
		};
      	var localItems = [];
		$('a').each(function(i, elem) {
			var href = $(this).attr('href');
			if (href && href[0] && href[0] == '/') {
				href = baseURL + href;
			}
			if (href && itemIndex.indexOf(href) === -1 && (href.startsWith('http://www.scheels.com/shop/scheels-catalog') || href.startsWith('https://www.scheels.com/shop/scheels-catalog'))) {
				// if (itemIndex.length < 100 ) {           
				itemIndex.push(href);
				itemQueue.push(href);
				localItems.push(href);
				// };        
			};        
		});

		if (localItems.length > 0) {        
			var requestOptions = {
			  method: 'GET',
			  timeout: 60000,
			  baseURL   : baseURL,
			  itemIndex : itemIndex,
			  itemQueue : itemQueue,
			  items     : items,
			  socket    : socket
			};
			for (var i = 0; i < localItems.length; i++) {
			  requestOptions.url = localItems[i];
			  recursiveRequest(requestOptions);
			};
		};
    }

    if (itemQueue.length == 0 && !this.firstReq) {
      console.log("crawl complete");
    };


  });


}
