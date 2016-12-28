var DefineMap = require('can-define/map/map');
var DefineList = require('can-define/list/list');
var set = require('can-set');
var fixture = require('can-fixture');
var canEvent = require("can-event");

var connect = require('can-connect');
var canMap = require('can-connect/can/map/map');
var dataUrl = require('can-connect/data/url/url');
var constructor = require('can-connect/constructor/constructor');
var constructorStore = require('can-connect/constructor/store/store');

var smartMerge = require('./map-deep-merge').smartMerge;
var mergeInstance = require('./map-deep-merge').mergeInstance;
var mergeList = require('./map-deep-merge').mergeList;

var QUnit = require('steal-qunit');

// Orig data:
var origData = {
	id: 1,
	month: 'Feb',
	osProjects: [ { id: 1, title: 'canjs' }, {id: 2, title: 'jQuery++'} ],
	author: {id: 5, name: 'ilya'}
};

// Updated data:
var updatedData = {
	id: 1,
	month: 'February',
	osProjects: [ { id: 1, title: 'CanJS' }, {id: 3, title: 'StealJS'}, {id: 2, title: 'jQuery++'} ],
	author: {id: 6, name: 'ilya'}
};

// List of changes that should be applied on update:
//contributionMonth.name = 'February'; // 1
//contributionMonth.osProjects[0].name = 'CanJS'; // 2
//contributionMonth.osProjects.splice(1,0, new OSProject({id: 3, name: 'StealJS'}) ) // 3
//contributionMonth.author = hydrateInstance( {id: 6, name: 'ilya'} ) // 4

var OSProject, Author, ContributionMonth, origEventDispatch, events;

fixture('PUT /contribution-month/{id}', function(){
	console.log('fixture here');
	return updatedData;
});

var canMapMerge = {
	updatedInstance: function(instance, props){
		smartMerge( instance, props );
		canMap.callbackInstanceEvents('updated', instance);
	}
};

QUnit.module('helpers map-deep-merge', {
	setup: function(){
		Author = DefineMap.extend({
			id: {type: 'number'},
			name: {type: 'string'}
		});
		Author.algebra = new set.Algebra( set.props.id('id') );

		OSProject = DefineMap.extend({
			id: {type: 'number'},
			title: {type: 'string'}
		});
		OSProject.List = DefineList.extend({ '#' : OSProject });
		OSProject.algebra = new set.Algebra( set.props.id('id') );

		ContributionMonth = DefineMap.extend({
			author: Author,
			osProjects: OSProject.List
		});

		connect([dataUrl, constructor, constructorStore, canMap, canMapMerge], {
			Map: ContributionMonth,
			url: 'http://localhost:8080/contribution-month'
		});

		origEventDispatch = canEvent.dispatch;
		events = [];
		canEvent.dispatch = function(ev){
			console.log('!!! canEvent.dispatch !!! ' + JSON.stringify(ev), arguments);
			events.push({type: ev.type, target: ev.target.serialize()});
			return origEventDispatch.apply(this, arguments);
		};
	},
	teardown: function(){
		canEvent.dispatch = origEventDispatch;
	}
});

QUnit.noop = function(){};
QUnit.test('smartMerge simple object', function(assert) {
	var item = new ContributionMonth({
		id: 1,
		month: 'feb'
	});
	var data = {
		id: 1,
		month: 'February'
	};

	events = [];
	smartMerge(item, data);

	assert.deepEqual(item.serialize(), data, 'updated data should be correct');
	assert.equal(events.length, 1, 'should dispatch only one event');
	assert.deepEqual(events[0].type, 'month', 'should dispatch only "month" event: ' + JSON.stringify(events));
});

QUnit.test('smartMerge nested objects', function(assert) {
	var item = new ContributionMonth({
		id: 1,
		author: {id: 6, name: 'ily'}
	});
	var data1 = {
		id: 1,
		author: {id: 6, name: 'Ilya'}
	};
	var data2 = {
		id: 1,
		author: {id: 7, name: 'Peter'}
	};

	events = [];
	smartMerge(item, data1);
	assert.deepEqual(item.serialize(), data1, 'nested object MERGE');
	assert.equal(events.length, 1, 'should dispatch only one event: ' + JSON.stringify(events));
	assert.deepEqual(events[0].type, 'name', 'should dispatch only "name" event');

	events = [];
	smartMerge(item, data2);
	assert.deepEqual(item.serialize(), data2, 'nested object REPLACE');
	assert.equal(events.length, 3, 'should dispatch 3 events: id, name (for the new author), and author: ' + JSON.stringify(events));
	assert.deepEqual(events[0].type, 'id', 'should dispatch "id" event on new Author');
	assert.deepEqual(events[1].type, 'name', 'should dispatch "name" event on new Author');
	assert.deepEqual(events[2].type, 'author', 'should dispatch "author" event on contributionMonth');

	console.log('events::', events);
});

QUnit.noop('smartMerge', function(assert) {
	var done = assert.async();

	// Orig data:
	var origData = {
		id: 1,
		name: 'Feb',
		osProjects: [ { id: 1, name: 'canjs' }, {id: 2, name: 'jQuery++'} ],
		author: {id: 5, name: 'ilya'}
	};

	// Updated data:
	var updatedData = {
		id: 1,
		name: 'February',
		osProjects: [ { id: 1, name: 'CanJS' }, {id: 3, name: 'StealJS'}, {id: 2, name: 'jQuery++'} ],
		author: {id: 6, name: 'ilya'}
	};

	var item = new ContributionMonth(origData);

	debugger

	events = [];

	//item.set(origData);

	item.save().then(function(updated){
		assert.deepEqual(updated.serialize(), updatedData, 'updated data should be correct');
		assert.equal(events.length, 4);
		console.log('events::', events);
		done();
	}).catch(function(e){
		console.log('Error: ', e);
		assert.ok(false, 'should not throw an exception');
		done();
	});
});

//QUnit.test('mergeInstance', function(assert) {
//	var done = assert.async();
//	assert.ok(false);
//	done();
//});
//QUnit.test('mergeList', function(assert) {
//	var done = assert.async();
//	assert.ok(false);
//	done();
//});