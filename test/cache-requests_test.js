
var QUnit = require("steal-qunit");
var persist = require("can-connect/data-url");
var cacheRequests = require("can-connect/cache-requests");
var set = require("can-set");

var getId = function(d){ return d.id};

QUnit.module("can-connect/cache-requests",{
	setup: function(){

	}
});


QUnit.test("Get everything and all future requests should hit cache", function(){
	stop();
	var count = 0;

	var res = cacheRequests( persist({
		findAllURL: function(params){
			deepEqual(params,{},"called for everything");
			count++;
			equal(count,1,"only called once");
			return new can.Deferred().resolve([
				{id: 1, type: "critical", due: "today"},
				{id: 2, type: "notcritical", due: "today"},
				{id: 3, type: "critical", due: "yesterday"},
				{id: 4},
				{id: 5, type: "critical"},
				{id: 6, due: "yesterday"}
			]);
		}
	}) );
	
	res.getListData({}).then(function(list){
		
		deepEqual(list.map(getId), [1,2,3,4,5,6]);
		
		res.getListData({type: "critical"}).then(function(list){
			deepEqual(list.map(getId), [1,3,5]);
			
			res.getListData({due: "today"}).then(function(list){
				deepEqual(list.map(getId), [1,2]);
				start();
			});
			
		});
		
	});

});



QUnit.test("Incrementally load data", function(){
	stop();
	var count = 0;
	
	var behavior = cacheRequests( persist({
		findAllURL: function(params){
			equal(params.start, count * 10 + 1, "start is right "+params.start);
			count++;
			equal(params.end, count * 10, "end is right "+params.end);
			
			
			var items = [];
			for(var i= (+params.start); i <= (+params.end); i++) {
				items.push({
					id: i
				});
			}
			var def = new can.Deferred();
			//setTimeout(function(){
				def.resolve(items);
			//},50);
			return def;
		},
		compare: set.comparators.rangeInclusive("start","end")
	}) );
	
	
	behavior.getListData({
		start: 1,
		end: 10
	}).then(function(list){
		equal(list.length, 10, "got 10 items");
		equal(list[0].id, 1);
		equal(list[9].id, 10);
		
		behavior.getListData({
			start: 1,
			end: 20
		}).then(function(list){
			equal(list.length, 20, "got 20 items");
			equal(list[0].id, 1, "0th object's id'");
			equal(list[19].id, 20, "19th object's id");
			
			
			behavior.getListData({start: 9, end: 12}).then(function(list){
				equal(list.length, 4, "got 4 items");
				equal(list[0].id, 9);
				equal(list[3].id, 12);
				start();
			});
			
			
			
		});
		
	});
	
});