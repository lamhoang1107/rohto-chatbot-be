"use strict";

/* Package System */
const { check } = require('express-validator');
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
				check('id', 'Trường Id là bắt buộc').not().isEmpty()
			]
			break;
	}

	return _validation;
}
