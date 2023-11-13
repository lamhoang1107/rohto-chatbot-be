/* eslint-disable no-underscore-dangle */
/* Package System */
require('module-alias/register');
const Controller = require('@system/Controller');
const {extractBase64,get,post,uppercaseStr,fetchApi,extractPlainText} = require('@utils/Helper');
const Model = require('../../../system/Model');
const { v4: uuidV4 } = require('uuid');
const axios = require('axios');

module.exports = class extends Controller {
    constructor(tableName) {
        super(tableName);
        this.tb = tableName;
        this.db = new Model(tableName);
    }

    async getById(id){
        return new Promise((resolve)=>{
            this.db.get({id},true).then(value=>{
                resolve(value)
            })
        })
    }


    async create(req, res) {
        try {
            // Validate
            const _check = await this.validate(req, res);

            if (_check == false) {
                let _data = {};
                _data = req.body;
                // await this.insertPromt(_data.prompt,_data.completion,_data.source_name,_data.category_id).then(results => {
                    // _data.vector_id = results
                    _data.vector_id = uuidV4()
                    this.db.insert(_data);
                    this.response(res, 201);    
                // })
                
            }
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }
    async getAll(req, res) {
        try {
            req.query.joinQueries = [{
                fieldJoin: 'product_id',
                fieldTarget: 'id',
                table: 'products',
                mergeField: 'products.name as product_name',
            },
            {
                fieldJoin: 'products.product_group_id',
                fieldTarget: 'id',
                table: 'product_groups',
                mergeField: 'product_groups.name as product_group_name',
            },
            {
                fieldJoin: 'product_groups.category_id',
                fieldTarget: 'id',
                table: 'categories',
                mergeField: 'categories.name as category_name',
            }
            ]

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
            let _result = await this.db.get(_conditions, true);
            this.response(res, 200, { data: _result });
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
                if(_data?.status !== undefined){
                    delete _data.status;
                }
                delete _data?.source_name_changed
                delete _data?.category_id_changed
                await this.db.get({id:req.params.id}, true).then(async (result) => {
                    // await this.updatePromt(result.vector_id,_data.prompt,_data.completion,_data.source_name,_data.category_id).then(results => {
                        this.db.update({id:req.params.id},_data);
                        this.response(res, 200);  
                    // }) 
                })
 
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
                await this.db.get({id:req.params.id}, true).then(async (result) => {
                    await this.deletePromt(result.vector_id)
                })   
                this.db.delete({ id: req.params.id });
                this.response(res, 200);           
            }
        } catch (e) {
            this.response(res, 500, e.message);
        }
    }

    async insertPromt(prompt,completion,source,category_id){
        return new Promise((resolve,reject)=>{
            const data = {
                "prompt":prompt,
                "completion":completion,
                "source":source,
                "type": "prompt",
                "specialty":parseInt(category_id)
            }
            post(`${process.env.AI_URL}/records/upsert`,data).then(value=>{
                if(value?.status == "success")
                    resolve(value.data.id)
                else reject('Lỗi index vector')
            }).catch(e=>console.log(e?.message))
        })
    }

    async updatePromt(vector_id,prompt,completion,source,category_id){
        return new Promise((resolve,reject)=>{
            const data = {
                "id":vector_id,
                "prompt":prompt,
                "completion":completion,
                "source":source,
                "specialty":parseInt(category_id)
            }
            post(`${process.env.AI_URL}/records/upsert`,data).then(value=>{
                if(value?.status == "success")
                    resolve(value.data.id)
                else reject('Lỗi update vector')
            }).catch(e=>console.log(e?.message))
        })
    }

    async deletePromt(vector_id){
        return new Promise((resolve,reject)=>{
            const data = {
                "id": [
                    vector_id
                    ]
                }
            post(`${process.env.AI_URL}/records/delete`,data).then(value=>{
                if(value?.status == "success")
                    resolve(true)
                else reject('Lỗi delete vector')
            }).catch(e=>console.log(e?.message))
        })
    }


    async detectAndUploadImages(htmlContent) {
        const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
        const imgTags = htmlContent.match(imgTagRegex);
      
        if (imgTags) {
          for (const imgTag of imgTags) {
            const srcMatch = /src=["']([^"']+)["']/g.exec(imgTag);
            if (srcMatch) {
              const src = srcMatch[1];
              let imageBuffer = src
                if (!src.startsWith(process.env.AWS_CDN_CMC)){
                    if (src.startsWith('http') || src.startsWith('https')) {
                        try {
                            const response = await axios.get(src, {
                                responseType: 'arraybuffer'
                              });
                            const fileExtension = src.split('.').pop();
                            imageBuffer = `data:image/${fileExtension};base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
                        } catch (error) {
                            console.log(error);
                        }
                    } 
                    try {
                        const response = await this.uploadImage(imageBuffer, this.tb);
                        if (response !== false) {
                            // Replace the src attribute with the link from the API
                            const newImgTag = imgTag.replace(src, process.env.AWS_CDN_CMC + response);
                            htmlContent = htmlContent.replace(imgTag, newImgTag);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
          }
        }
        // After processing all image tags, the htmlContent string will contain the updated HTML.
        return htmlContent;
    }
      
    async uploadImage(image='',image_type=''){
        return new Promise((resolve)=>{
            post(`${process.env.BASE_URL}/v1/images`,{image: {file:image},image_type:image_type},'Token')
            .then(value=>{
                resolve(value.image_link)
            }).catch(e=>resolve(false))
        })
    }

};
