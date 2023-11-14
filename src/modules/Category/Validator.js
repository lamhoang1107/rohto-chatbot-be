"use strict";

/* Package System */
const { check,param } = require('express-validator');
const Controller = require('./Controller');
const Function = new Controller('categories');

module.exports = (method) => {
	let _validation = [];

	switch (method) {
		case 'update':
			_validation = [
				check('name').not().isEmpty().withMessage('Trường name là bắt buộc'),
			]
			break;
		case 'create':

			_validation = [
				check('name').not().isEmpty().withMessage('Trường name là bắt buộc'),
			]
            break;
			
		case 'delete':
			_validation = [
				param('id', 'Trường Id là bắt buộc').not().isEmpty().custom(async(value,{req})=>await Function.getProductGroupUsed(value,req.params)),
			]
			break;
	}

	return _validation;
}
