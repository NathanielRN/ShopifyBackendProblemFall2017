//Set up modules for use
var http = require('http'),
	express = require('express'),
	app = express(),
    cookieCount = require('./cookieCount.js');

// Define calculation variables
var orderResults = [];
var currentPage = 0;
var itemsPerPage = 0;
var totalItems = 0;
var availableCookies;

// Generic response from root directory GET
app.get('/', function(req, response) {
    getResultsFromPort(true, req, response);
});

function getResultsFromPort(requestFromPort, req, response) {
    if (requestFromPort) {
        resetCounting();
        obtainCookieOrders(options, function() {
            availableCookies = orderResults[0]["available_cookies"];
            var jsonResponse = cookieCount.calculateItemsToFullfill(orderResults, availableCookies);
            returnCollectionResults(response, null, jsonResponse);
        });
    } else {
        resetCounting();
        obtainCookieOrders(options, function() {
            availableCookies = orderResults[0]["available_cookies"];
            var jsonResponse = cookieCount.calculateItemsToFullfill(orderResults, availableCookies);
            console.log(jsonResponse);
        });
    }
}

// To not have duplicates
function resetCounting() {
    orderResults = [];
    currentPage = 0;
    itemsPerPage = 0;
    totalItems = 0;
};

// Return colleciton results as JSON to response
function returnCollectionResults(res, error, objs) {
        if (error) {
        res.send(400, error); }
        else {
            res.set('Content-Type','application/json');
            res.status(200).send(objs)
        }
    };

// Endpoint to access information from
var options = {
    host: 'backend-challenge-fall-2017.herokuapp.com',
    port: 443,
    path: '/orders.json',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
}

// Call to function that will get information as JSON
function obtainCookieOrders(options, finishedRetreiving) {
    cookieCount.getJSON(options, function(statusCode, result) {
        orderResults[currentPage] = result;
        var paginationInfo = orderResults[currentPage]["pagination"];
        currentPage = paginationInfo["current_page"];
        itemsPerPage = paginationInfo["per_page"];
        totalItems = paginationInfo["total"];
            if (currentPage == 0 || currentPage < Math.ceil(totalItems/itemsPerPage)) {
                options.path = '/orders.json?page=' + (currentPage+1)
                obtainCookieOrders(options, finishedRetreiving);
            } else {
                finishedRetreiving();
            };
        }
    );
};

// Set the express port for request
app.set('port', 3000);

// Create a local server ready to receive requests for JSON response
http.createServer(app).listen(app.get('port'), function(){
    getResultsFromPort(false, null, null);
});