"use strict";

/* Package System */
require('dotenv').config();
require('module-alias/register');
const { v4: uuidV4 } = require('uuid');

/* Package Application */
const connectionDefault = require('./Connection')();

module.exports = class Builder {
  constructor(tableName) {
    this.tb = tableName;
    this.connection =  connectionDefault;
  }

  async insert({ data, returnField = '', shouldInsertId = true }) {
    try {
       const [result] =  await this.connection.promise().query(`INSERT INTO ${this.tb} SET ?`, data);
      if(returnField != ''){
        // const [[insertedID]]= await this.connection.promise().query('SELECT LAST_INSERT_ID()')
        const [[insertedData]] = await this.connection.promise().query(`SELECT ${returnField} FROM ${this.tb} WHERE id=?`, [result.insertId]);
        return insertedData[returnField]
      } else {
        return true;
      }
    } catch (e) {
      console.log(`Error while inserting data to table ${this.tb} - Error: ${JSON.stringify(e)}`);
      throw new Error(e.message);
    }
  }

  async update({ conditions, data }) {
    try {
      if (!data || !Object.keys(data)) {
        return true;
      }

      let conditionQuery = '';

      if (conditions['id'] !== undefined) {
        data.id = conditions.id;

        conditionQuery = `id = '${conditions.id}'`;
      } else {
        for(let i = 0; i < Object.keys(conditions).length;i++){
          const key =Object.keys(conditions)[i];
          conditionQuery += i>0 ? ' AND ' : '';
          conditionQuery += `${key} = '${conditions[key]}'`;
        }
      }

      let updateValueQuery = '';

      for (const key in data) {
        updateValueQuery = updateValueQuery ? `${updateValueQuery}, ${key}=?` : `${key}=?`;
      }

      const rawUpdateQuery = `
        UPDATE ${this.tb}
        SET ${updateValueQuery}
        WHERE ${conditionQuery};
      `;
      // console.log("rawUpdateQuery",rawUpdateQuery)
      await this.connection.promise().query(rawUpdateQuery, Object.values(data));

      return true;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async delete({ conditions, purge }) {
    try {
      let id = '';

      if (conditions['id'] !== undefined) {
        id = conditions['id'];
      }

      const rawQuery = `
        DELETE FROM ${this.tb} WHERE id='${id}';
      `;
      if (purge == true) {
        await this.connection.promise().query(rawQuery);
      } else {
        await this.update({ conditions, data: { deleted_at: new Date() } });
      }

      return true;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async get({ conditions }) {
    try {
      let id = '';

      if (conditions['id'] !== undefined) {
        // console.log("có id get")
        id = conditions['id'];
        // console.log("id: " + id)
        const rawQuery = `SELECT * FROM ${this.tb} WHERE id=?;`;
        let [[data = null]] = await this.connection.promise().query(rawQuery, [id]);
        // console.log('data get từ id ra',data)
        return data;
      }
      else {
        const { data = [] } = await this.find({
          conditions: { query: { ...conditions, limit: 1 } },
        });
        // console.log('data get từ find ra',data)
        return data.length ? data[0] : null;
      }
      
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async find({ conditions }) {
    try {
      let whereQuery = ''
      let rawQuery = `SELECT DISTINCT ${this.tb}.* FROM ${this.tb} `;
      const params = [];
      let _where = conditions?.query?.fq ?? '';
      let _whereIn = conditions?.query?.fqin ?? '';
      let _whereNotIn = conditions?.query?.fqnotin ?? '';
      let _whereRange = conditions?.query?.fqrange ?? '';
      let _whereRangeTime = conditions?.query?.fqrangetime ?? '';
      let _search = conditions?.query?.s ?? '';
      let _whereNot = conditions?.query?.fqnot ?? '';
      let _whereNull = conditions?.query?.fqnull ?? '';
      let _limit = conditions?.query?.limit ?? 10;
      let _offset = conditions?.query?.offset ?? 0;
      let _sort = conditions?.query?.sort ?? '';
      let joinQueries = conditions?.query?.joinQueries ?? '';
      let mergeField = `${this.tb}.*`
      let _whereOr = conditions?.query?.fqor ?? '';
      if(conditions?.query?.fields){
        mergeField = conditions.query.fields.split(',').map(field=>`${this.tb}.${field}`).join(',');
      }
      if(joinQueries && joinQueries.length > 0){
        for (const joinQuery of joinQueries) {
          if(joinQuery?.fieldTarget && joinQuery?.table && joinQuery?.fieldJoin){
            const rawFieldJoin = joinQuery.fieldJoin.indexOf('.') == -1 ?`${this.tb}.${joinQuery.fieldJoin}` : `${joinQuery.fieldJoin}`
            rawQuery += `LEFT JOIN ${joinQuery.table} ON ${joinQuery.table}.${joinQuery.fieldTarget} = ${rawFieldJoin} `;
          }
          if(joinQuery?.filter){
            rawQuery += `AND ${joinQuery.filter} `
          }
          if(joinQuery?.mergeField)
            mergeField += ','+joinQuery?.mergeField
        }
      }
      
      let countQuery = rawQuery.replace(`DISTINCT ${this.tb}.*`, `COUNT(DISTINCT ${conditions?.query?.fields ? conditions.query.fields.split(',').map(field=>`${this.tb}.${field}`).join(',') :this.tb+".id"}) AS total`);
      if(mergeField){
        rawQuery =rawQuery.replace(`${this.tb}.*`, mergeField);
      }

      if (_where != '') {
        console.log("_where",_where)
        let whereByKeyQuery = `WHERE `;

        for (const val of _where.split(",")) {
          let _fq = val.split(":").map(v => v);
          if (_fq.length == 2) {

            const field = _fq[0].indexOf('.') == -1 ? `${this.tb}.`+_fq[0] : _fq[0]
            whereByKeyQuery = whereByKeyQuery.length > 6 ? `${whereByKeyQuery} AND ${field} = ?` : `${whereByKeyQuery} ${field} = ?`
            params.push(_fq[1]);
          }
        }

        whereQuery += whereByKeyQuery;
      }

      if (_whereOr != '') {
        let whereOr = whereQuery ? ` AND ` : ` WHERE `;
        let _fqor = _whereOr.split("|").map(v => v);
        if (_fqor.length == 2) {
          whereOr = whereOr + `(${_fqor[1].replace(/,/g, ' = ? OR ')} = ? )`
          for (const val of _fqor[1].split(",")) {
            params.push(...[_fqor[0]])
          }
        }
        whereQuery += whereOr;
      }

      if (_whereIn != '') {
        let whereIn = whereQuery ? ` AND ` : ` WHERE `;
        let _fq = _whereIn.split(":").map(v => v);

        if (_fq.length == 2) {
          const field = _fq[0].indexOf('.') == -1 ? `${this.tb}.`+_fq[0] : _fq[0]
          whereIn = whereIn + field + ` IN (?)`;
          params.push(_fq[1].split(','));
        }

        whereQuery += whereIn;
      }
      if (_whereNotIn != '') {
        let whereIn = whereQuery ? ` AND ` : ` WHERE `;
        let _fq = _whereNotIn.split(":").map(v => v);

        if (_fq.length == 2) {
          const field = _fq[0].indexOf('.') == -1 ? `${this.tb}.`+_fq[0] : _fq[0]
          whereIn = whereIn + field + ` NOT IN (?)`;
          params.push(_fq[1].split(','));
        }
        whereQuery += whereIn;
      }
      if (_whereRange != '') {
				_whereRange.split(',').map((val) => {
					const _fq = val.split(':').map(v => v);
          const field = _fq[0].indexOf('.') == -1 ? `${this.tb}.`+_fq[0] : _fq[0]
					if (_fq.length == 2) {
						const _parse = _fq[1].match(/^(gte|gt|lte|lt)/gi);
						if (_parse != null) {
							const _prefix = whereQuery == '' ? 'WHERE ' : ' AND ';
							whereQuery += _prefix + field + ` ${_parse[0] == 'gte' ? '>=' : '<='} ` + `'${_fq[1].replace(_parse[0], '')} ${_parse[0] == 'gte' ? '00:00:00' : '23:59:59'}'`;
						}
					}
				});
			}

      if (_whereRangeTime != '') {
				_whereRangeTime.split(',').map((val) => {
					const _fq = val.replace(':','&').split('&').map(v => v);
          const field = _fq[0].indexOf('.') == -1 ? `${this.tb}.`+_fq[0] : _fq[0]
					if (_fq.length == 2) {
						const _parse = _fq[1].match(/^(gte|gt|lte|lt)/gi);
						if (_parse != null) {
							const _prefix = whereQuery == '' ? 'WHERE ' : ' AND ';
							whereQuery += _prefix + field + ` ${_parse[0] == 'gte' ? '>=' : '<='} ` + `'${_fq[1].replace(_parse[0], '')}'`;
						}
					}
				});
			}

      if (_search != '') {
        if( Array.isArray(_search) == false ) {
          let _parser = _search.split("|");
          if(_parser[1].indexOf('.') == -1)
            _parser[1] = this.tb +'.'+_parser[1];
          let searchQuery = `${whereQuery ? '' : `WHERE (`} ${_parser[1].replace(/,/g, ' LIKE ? OR ')} LIKE ? )`;
          
          whereQuery = whereQuery ? `${whereQuery} AND ( ${searchQuery}` : `${whereQuery} ${searchQuery}`;
          for (const val of _parser[1].split(",")) {
            params.push(...[`%${_parser[0]}%`/*, `%${_parser[0]}%`*/])
          }
        } else {
            for (const value of _search) {
              let _parser = value.split("|");
              if(_parser[1].indexOf('.') == -1)
                _parser[1] = this.tb +'.'+_parser[1];
              let searchQuery = `${whereQuery ? '' : `WHERE (`} ${_parser[1].replace(/,/g, ' LIKE ? OR ')} LIKE ? )`;
              
              whereQuery = whereQuery ? `${whereQuery} AND ( ${searchQuery}` : `${whereQuery} ${searchQuery}`;
              for (const val of _parser[1].split(",")) {
                params.push(...[`%${_parser[0]}%`/*, `%${_parser[0]}%`*/])
              }
            }
        }
      }

      if (_whereNot !== '') {
        let _parser
        if (Array.isArray(_whereNot)){
          _parser = _whereNot.map(value => {
              if(value.indexOf('.') == -1)
              value = this.tb + '.' + value;
              return value
            }).join(',')
          
        } else {
           _parser = _whereNot
        }
        let whereNot = `${whereQuery ? ` AND ` : ` WHERE `} ${_parser?.replace(/,/g, ' IS NOT NULL AND ')} IS NOT NULL`;
        whereQuery += whereNot;
      }

      if (_whereNull !== '') {
        if(_whereNull.indexOf('.') == -1)
          _whereNull = this.tb + '.' + _whereNull;
        let whereNull = `${whereQuery ? ` AND ` : ` WHERE `} ${_whereNull?.replace(/,/g, ' IS NULL AND ')} IS NULL`;
        whereQuery += whereNull;
      }

      let sortQuery = ` ORDER BY ${this.tb}.created_at DESC`;

      if (_sort != '') {
        sortQuery = ``;

        _sort.split(",").map(val => {
          const value = val.indexOf('.') > -1 ? val.replace(/^-/, '').trim() :`${this.tb}.`+val.replace(/^-/, '').trim();

          if (new RegExp('^-').test(val) == true) {
            sortQuery = sortQuery ? `${sortQuery}, ${value} DESC` : ` ORDER BY ${value} DESC`;
          } else {
            sortQuery = sortQuery ? `${sortQuery}, ${value} ASC` : ` ORDER BY ${value} ASC`;
          }
        })
      }
      // console.log(rawQuery + whereQuery + sortQuery + ` LIMIT ? OFFSET ?`, [...params, Number(_limit), Number(_offset)])
      const [
        [data],
        [[count]]
      ] = await Promise.all([
        this.connection.promise().query(rawQuery + whereQuery + sortQuery + ` LIMIT ? OFFSET ?`, [...params, Number(_limit), Number(_offset)]),
        this.connection.promise().query(countQuery + whereQuery, params)
      ])
      return {
        data: data || null,
        total: count?.total ?? 0,
      };
    } catch (e) {
      console.log('e', e);
      throw new Error(e.message);
    }
  }

}
