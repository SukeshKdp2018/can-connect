
var can = require("can/util/util");
var connect = require("can-connect");
var pipe = require("./helpers/pipe");
var WeakReferenceMap = require("./helpers/weak-reference-map");
var overwrite = require("./helpers/overwrite");

/**
 * @module can-connect/constructor
 * 
 * Connect CRUD methods to a constructor function.
 * 
 * Consumes:
 * 
 * - getListData, getInstanceData, createInstanceData, updateInstanceData, destroyInstanceData
 * 
 * Produces:
 * 
 * - findAll, findOne, save, destroy, id, createdInstance, updatedInstance
 * 
 * @param {{}} options
 * 
 *   @option {function} instance
 *   @option {function} list
 *   @option {String} id
 */
module.exports = connect.behavior("constructor",function(baseConnect){
	
	var behavior = {
		// stores references to instances
		// for now, only during create
		cidStore: new WeakReferenceMap(),
		_cid: 0,
		findAll: function(params) {
			return pipe(this.getListData( params ), this, function(data){
				return this.makeList(data, params);
			});
		},
		findOne: function(params) {
			return pipe(this.getInstanceData(params), this, function(data){
				return this.makeInstance(data);
			});
		},
		
		// given raw data, makes the instances
		makeList: function(instanceData, params){
			if(can.isArray(instanceData)) {
				instanceData = {data: instanceData};
			}
			
			var arr = [];
			for(var i = 0; i < instanceData.data.length; i++) {
				arr.push( this.makeInstance(instanceData.data[i]) );
			}
			instanceData.data = arr;
			if(this.list) {
				return this.list(instanceData, params);
			} else {
				var list = instanceData.data.slice(0);
				list.__set = params;
				return list;
			}
			
		},
		makeInstance: function(props){
			if(this.instance) {
				return this.instance(props);
			}  else {
				return can.simpleExtend({}, props);
			}
		},
		save: function(instance){
			var serialized = this.serializeInstance(instance);
			var id = this.id(instance);
			
			if(id === undefined) {
				var cid = this._cid++;
				this.cidStore.addReference(cid, instance);
				
				return pipe(this.createInstanceData(serialized, cid), this, function(data){
					// if undefined is returned, this can't be created, or someone has taken care of it
					if(data !== undefined) {
						this.createdInstance(instance, data);
					}
					this.cidStore.deleteReference(cid, instance);
					return instance;
				});
			} else {
				return pipe(this.updateInstanceData(serialized), this, function(data){
					if(data !== undefined) {
						this.updatedInstance(instance, data);
					}
					return instance;
				});
			}
		},
		destroy: function(instance){
			var serialized = this.serializeInstance(instance);
			
			return pipe( this.destroyInstanceData(serialized), this, function(data){
				if(data !== undefined) {
					this.destroyedInstance(instance, data);
				}
				return instance;
			});
		},
		createdInstance: function(instance, data){
			can.simpleExtend(instance, data);
		},
		updatedInstance: function(instance, data){
			overwrite(instance, data, this.idProp);
		},
		destroyedInstance: function(instance, data){
			overwrite(instance, data, this.idProp);
		},
		serializeInstance: function(instance){
			return can.simpleExtend({}, instance);
		},
		serializeList: function(list){
			var self = this;
			return list.map(function(instance){
				return self.serializeInstance(instance);
			});
		},
		isNew: function(instance){
			var id = this.id(instance);
			return !(id || id === 0);
		}
	};
	
	return behavior;
	
});
