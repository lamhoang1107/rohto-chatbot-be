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

    async getIsUsed(req) {
        return new Promise((resolve, reject) => {
            get(`${process.env.BASE_URL}/v1/products?fq=categories.id:${req}`,{},'Token').then(value=>{
                if(value?.data.length > 0)
                    reject(`Nhóm sản phẩm đang được sử dụng trong Sản phẩm`)
                else resolve (true)
            }).catch(e => {
                console.log(e);
                reject('Server Error, Please try again later');
            });
        })
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

    async update (req, res) {
        try {
            // Validate
            const _check = await this.validate(req, res);

            if (_check == false) {
                let _data = {};
                _data = req.body;                
                this.db.update({id:req.params.id},_data);
                this.response(res, 200);
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
            req.query.joinQueries = [{
                fieldJoin: 'category_id',
                fieldTarget: 'id',
                table: 'categories',
                mergeField: 'categories.name as category_name',
            }]
            const _data = await this.db.find(req);
            const _result = _data == null ? { items: [] } : _data;
            this.response(res, 200, _result);
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }

    async delete(req, res) {
        
        try {
            // Validate
            const _check = await this.validate(req, res);
            if (_check == false) {
                this.db.delete({ id: req.params.id });
                this.response(res, 200);           
            }
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }
};
