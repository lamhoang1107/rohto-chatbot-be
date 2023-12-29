/* eslint-disable no-underscore-dangle */
/* Package System */
require('module-alias/register');
const Controller = require('@system/Controller');
const Model = require('../../../system/Model');
const {get} = require('@utils/Helper')

module.exports = class extends Controller {
    constructor(tableName) {
        super(tableName);
    }

    async create(req, res) {
        try {
            // Validate
            const _check = await this.validate(req, res);

            if (_check == false) {
                let _data = {};
                _data = req.body;
                this.db.insert(_data);
                this.response(res, 201);
            }
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }

    async get(req, res) {
        try {
            // Validate
            const _check = await this.validate(req, res);

            if (_check == false) {
                const _data = await this.db.get({id: req.params.id});                
                this.response(res, 200, {data:_data});
            }
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }

    async getAll(req, res) {
        try {
            const _data = await this.db.find(req);
            const _result = _data == null ? { items: [] } : _data;
            this.response(res, 200, _result);
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }
};
