/* Package Application */
const moment = require('moment');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const Model = require('./Model');


module.exports = class Controller {
    constructor(tableName) {
        this.db = new Model(tableName);
        this.moment = moment;
    }

    /* -------------- COMMON --------------*/
    async validate(req, res) {
        try {
            const _errors = validationResult(req).array({ onlyFirstError: true });
            if (_errors.length > 0) throw _errors;

            return false;
        } catch (e) {
            const _infoErr = [];

            e.map((item) => {
                _infoErr.push({ key: item.param, msg: item.msg });
            });

            return res.status(400).json({
                status: 'error',
                errors: _infoErr,
            });
        }
    }

    async response(res, status, data = null) {
        if (status == 201 || status == 204) return res.status(status).end();

        let _obj = {};

        switch (status) {
            case 400:
                _obj.status = 'error';
                _obj.errors = {};
                _obj.errors.msg = data;
                break;
            case 500:
                _obj.status = 'error';
                _obj.errors = {};
                _obj.errors.msg = process.env.NODE_ENV == 'production' ? 'Server Error, Please try again later.' : data;
                break;
            default:
                _obj.status = 'success';
                if (data != null) {
                    if (data.total) _obj.total = data.total;
                    if (data.nextPage) _obj.next_page = data.nextPage;
                    if (data.length > 0) _obj.items = data;
                    if (data.total_insert) _obj.total_insert = data.total_insert;
                    else _obj = { ..._obj, ...data };
                }
                break;
        }

        return res.status(status).json(_obj);
    }
    /* ------------ END COMMON ------------*/

    /* ------------- API CRUD -------------*/
    async getAll(req, res) {
        try {
            const _data = await this.db.find(req);
            const _result = _data == null ? { items: [] } : _data;

            this.response(res, 200, _result);
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }

    async get(req, res) {
        try {
            const _conditions = {};
            _conditions.id = req.params.id;
            const _result = await this.db.get(_conditions, true);

            this.response(res, 200, { data: _result });
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }

    async create(req, res) {
        try {
            // Validate
            const _check = await this.validate(req, res);

            if (_check == false) {
                let _data = {};
                _data = req.body;
                _data.is_deleted = false;
                _data.created_at = new Date();
                _data.updated_at = new Date();
                this.db.insert(_data);
                this.response(res, 201);
            }
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }

    async update(req, res) {
        try {
            // Validate
            const _check = await this.validate(req, res);
            if (_check == false) {
                let _data = {};
                _data = req.body;
                _data.updated_at = new Date();
                if (_data.password) _data.password = bcrypt.hashSync(_data.password, bcrypt.genSaltSync(12));
                if(_data?.ended_at)
                    _data.ended_at = new Date(_data.ended_at);
                this.db.update({ id: req.params.id }, _data);
                this.response(res, 200);
            }
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
                this.response(res, 204);
            }
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }
    /* ----------- END API CRUD -----------*/
};
