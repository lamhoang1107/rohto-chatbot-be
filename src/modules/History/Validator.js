"use strict";

/* Package System */
const { check,param } = require('express-validator');
const Controller = require('./Controller');

module.exports = (method) => {
	let _validation = [];

	switch (method) {
		case 'create':

			_validation = [
				check('dialog_id').not().isEmpty().withMessage('Trường name là bắt buộc'),
				check('user_message').not().isEmpty().withMessage('Trường name là bắt buộc'),
				check('assistant_message').not().isEmpty().withMessage('Trường name là bắt buộc'),
			]
            break;
	}

	return _validation;
}
