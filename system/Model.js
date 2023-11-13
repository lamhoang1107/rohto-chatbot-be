"use strict";

/* Package Application */
const Builder = require('./Database/' + process.env.DB_DRIVER + '/Builder');
module.exports = class Model {

	constructor(tableName, databaseName) {
		this.tb = tableName;
	}

	async buildQuery(type, obj) {
		try {
			// Query Builder
			let _result = null;
			let _db = new Builder(this.tb);
			switch (type) {
				case 'find':
					_result = await _db.find(obj);
					break;
				case 'get':
					_result = await _db.get(obj);
					break;
				case 'insert':
					_result = await _db.insert(obj);
					break;
				case 'update':
					_result = await _db.update(obj);
					break;
				case 'delete':
					_result = await _db.delete(obj);
					break;
			}

			return _result;
		} catch (e) {
			throw new Error(e.message);
		}
	}

	async find(conditions = {}, debug = 0) {
		return await this.buildQuery('find', { conditions, debug });
	}

	async get(conditions = {}, returnData = true) {
		return await this.buildQuery('get', { conditions, returnData });
	}

	async insert(data = null, returnField = '', shouldInsertId ) {
		return await this.buildQuery('insert', { data, returnField, shouldInsertId });
	}

	async update(conditions = {}, data = null) {
		return await this.buildQuery('update', { conditions, data });
	}

	async delete(conditions = {}, purge = false) {
		return await this.buildQuery('delete', { conditions, purge });
	}
}