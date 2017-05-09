var http = require('http'),
	https = require('https');

//Export these funcitons for use
module.exports = {
 	getJSON: getJSON,
 	calculateItemsToFullfill: calculateItemsToFullfill
}

//Final variables
var arrayOfUnfullfilledOrders = [];
var remainingCookies = 0;

// Order with cookies
function orderWithCookie() {
  this.amountOfCookies = -1;
  this.idNumber = -1;
}

// Function to get the information as JSON
function getJSON(options, onResult) {
    var chosenPort = options.port == 443 ? https : http;
    var req = chosenPort.request(options, function(res)
    {
        var output = '';
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        res.send('error: ' + err.message);
    });

    req.end();
};

function calculateItemsToFullfill(obtainedResults, readyToGoCookies) {

	var arrayOfCookieOrders = [];
	var cookieOrderIndex = 0;
	for(var i = 0; i < obtainedResults.length; i++) {
		const arrayOfOrders = obtainedResults[i]["orders"];
		for(var j = 0; j < arrayOfOrders.length; j++) {
			const arrayOfProductsInOrder = arrayOfOrders[j]['products']
			if  (arrayOfOrders[j]["fulfilled"] == false) {
				for(var k = 0; k < arrayOfProductsInOrder.length; k++) {
					const product = arrayOfProductsInOrder[k];
					if (product["title"] == "Cookie") {
						var cookieOrder = new orderWithCookie
						cookieOrder.amountOfCookies = product["amount"];
						cookieOrder.idNumber = arrayOfOrders[j]["id"];
						arrayOfCookieOrders[cookieOrderIndex] = cookieOrder;
						cookieOrderIndex += 1;
					}
				}
			}
		}
	};

	arrayOfCookieOrders.sort(function(a, b) {
    	return (b.amountOfCookies) - (a.amountOfCookies);
	});

	// Sort by IdNumber if cookie order is the same
	for(var a = 0; a < arrayOfCookieOrders.length; a++) {
		for(var b = arrayOfCookieOrders.length-1; b > a; b--) {
			if (arrayOfCookieOrders[b].amountOfCookies == arrayOfCookieOrders[b-1].amountOfCookies) {
				if (arrayOfCookieOrders[b].idNumber < arrayOfCookieOrders[b-1].idNumber) {
					const tempHolder = arrayOfCookieOrders[b];
					arrayOfCookieOrders[b] = arrayOfCookieOrders[b-1];
					arrayOfCookieOrders[b-1] = tempHolder;
				}
			}
		}
	}

	var readyCookies = readyToGoCookies;

	// Determine which orders were unfullfilled
	for(var c = 0; c < arrayOfCookieOrders.length; c++) {
		if (readyCookies - arrayOfCookieOrders[c].amountOfCookies > -1) {
			readyCookies -= arrayOfCookieOrders[c].amountOfCookies;
		} else {
			arrayOfUnfullfilledOrders.push(arrayOfCookieOrders[c].idNumber);
		}
	}

	// Prepare a final dicitionary to be converted into JSON for response
	var finalDictionary = {
		"remaining_cookies": remainingCookies,
		"unfulfilled_orders": arrayOfUnfullfilledOrders
	}

	// Convert the dictionary into JSON
	var serialized = JSON.stringify(finalDictionary);

	return serialized;
};