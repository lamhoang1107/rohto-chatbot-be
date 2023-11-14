"use strict";

/* Package System */
const fs = require('fs');
const {check} = require('express-validator');

/* Application */
const Controller = require('./Controller');
const Function = new Controller('modules');

module.exports=method=>{
	let _validation = [];

	switch(method){
		case 'create':
			_validation = [
				check('key_name').not().isEmpty().withMessage('Trường bắt buộc'),
				check('key_value').not().isEmpty().withMessage('Trường bắt buộc')
			]
			break;
		case 'update':
			_validation = [
				check('id','Trường Id là bắt buộc').not().isEmpty(),
				check('key_value').not().isEmpty().withMessage('Trường bắt buộc')
			]
			break;
	}
	return _validation;
}