var connect = require("./can-connect");

require("../constructor");
require("../constructor-map");
require("../constructor-store");
require("../data-callbacks");
require("../data-callbacks-cache");
require("../data-combine-requests");
require("../data-inline-cache");
require("../data-localstorage-cache");
require("../data-parse");
require("../data-url");
require("../fall-through-cache");
require("../real-time");

var Map = require("can/map/map");
var List = require("can/list/list");

connect.superMap = function(options){

	var behaviors = [
		"constructor",
		"constructor-map",
		"constructor-store",
		"data-callbacks",
		"data-callbacks-cache",
		"data-combine-requests",
		"data-inline-cache",
		"data-parse",
		"data-url",
		"real-time"];

	if(typeof localStorage !== "undefined") {
		options.cacheConnection = connect(["data-localstorage-cache"],{
			name: options.name+"Cache",
			id: options.idProp
		});
		behaviors.push("fall-through-cache");
	}

	return connect(behaviors,options);
};
/**
 * @module can-connect/super-map super-map
 * @parent can-connect.modules
 */
module.exports = connect.superMap;



