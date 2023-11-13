"use strict";

/* Package System */
const { check, param } = require('express-validator');
const Controller = require('./Controller');
const Function = new Controller('events');
module.exports = (method) => {
	let _validation = [];

	switch (method) {
		case 'update':
			_validation = [
				param('id', 'Trường Id là bắt buộc').not().isEmpty(),
				check('prompt', 'Trường bắt buộc').not().isEmpty(),
				check('completion', 'Trường bắt buộc').not().isEmpty(),
			]
			break;
		case 'create':
			_validation = [
				check('prompt', 'Trường bắt buộc').not().isEmpty(),
				check('completion', 'Trường bắt buộc').not().isEmpty(),
			]
            break;
			
		case 'delete':
			_validation = [
				param('id', 'Trường Id là bắt buộc').not().isEmpty()
			]
			break;
	}

	return _validation;
}
