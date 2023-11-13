/* Application */
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config(); 

const apiUrl = process.env.BASE_API_ADMIN;

class Helper {
    genToken = () => {
        const _time = Date.now();
        return `${_time}_${crypto.createHash('sha1').update(`${_time} ${process.env.SECRET_SHA_KEY} rohto.ai`).digest('hex')}`;
    };

    compareToken = (token) => {
        const _parseToken = token.trim().split('_');
        if (_parseToken.length == 2) {
            const _time = parseInt(_parseToken[0]);
            const _shaToken = _parseToken[1];
            if ((_time + (60 * 1000)) > Date.now()) {
                const _shaAuth = crypto.createHash('sha1').update(`${_time} ${process.env.SECRET_SHA_KEY} rohto.ai`).digest('hex');
                if (_shaAuth != _shaToken) return false;
            } else {
                console.log('Token Expired', this.genToken());
                return false;
            }
        } else return false;
        return true;
    };

    fetchApi = async (url, token) => {
        let _url;
        const _options = {};
        if (url.indexOf('http') != '-1') _url = url;
        else _url = apiUrl + url;
        if (token != '') _options.headers = { Authorization: `Bearer ${token}` };
        return await axios.get(_url, _options).then((resp) => resp.data).catch((e) => e);
    };

    postApi = async (url, params, token = '') => {
        let _url;
        const _options = {};
        if (url.indexOf('http') != '-1') _url = url;
        else _url = apiUrl + url;
        if (token != '') _options.headers = { Authorization: `Bearer ${token}` };
        return await axios.post(_url, params, _options).then((resp) => resp.data).catch((e) => e);
    };


    postApiToken = async (url, params, token = '') => {
        let _url;
        const _options = {};
        if (url.indexOf('http') != '-1') _url = url;
        else _url = apiUrl + url;
        if (token != '') _options.headers = { Authorization: `Token ${token}` };
        return await axios.post(_url, params, _options).then((resp) => resp.data).catch((e) => e);
    };

    putApi = async (url, params, token = '', _options = {}) => {
        let _url;
        if (url.indexOf('http') != '-1') _url = url;
        else _url = apiUrl + url;
        if (token != '') _options.headers = { Authorization: `Bearer ${token}` };
        return await axios.put(_url, params, _options);
    };

    deleteApi = async (url, token = '', params = '') => {
        let _url;
        const _options = {};
        if (url.indexOf('http') != '-1') _url = url;
        else _url = apiUrl + url;
        if (token != '') _options.headers = { Authorization: `Bearer ${token}` };
        if (params != '') _options.data = { ids: params };
        return await axios.delete(_url, _options);
    };

    parseCookie = (str) => str.split(';').map((v) => v.split('=')).reduce((cookie, v) => {
        cookie[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
        return cookie;
    }, {});

    dateFormat = (str) => {
        const _date = new Date(str);
        return `${_date.getDate()}/${_date.getMonth() + 1}/${_date.getFullYear()}`;
    };

    changeToSlug = (str) => {
        const _str = str.trim().toLowerCase();

        return _str
            .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
            .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
            .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
            .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
            .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
            .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
            .replace(/đ/gi, 'd')
            .replace(/&/g, '-va-')
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/^-+/, '')
            .replace(/-+$/, '')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    capitalize = (str) => {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    extractBase64 = (str) => {
        const _obj = {};

        if (typeof str !== 'undefined' && str != '') {
            const _match = str.match(/^data:(.*?)\/(.*?);base64,(.*?)$/i);

            if (typeof _match[1] !== 'undefined') _obj.type = _match[1];
            if (typeof _match[2] !== 'undefined') _obj.ext = _match[2];
            if (typeof _match[3] !== 'undefined') _obj.data = _match[3];
        }

        return _obj;
    };

    trimSlash = (str) => {
        const _arr = str.split('/');

        if (typeof _arr[1] !== 'undefined') return _arr[1];
        return str.replace('/', '');
    };

    formatPhone=str=>{
        let result = String(str).trim().replace(/(?!\+)\D+/g,'').replace(/^0|^\+840/g,'+84');
		return result?.indexOf('+84') > -1 ? result : '+84'+result;
	}

    formatEmail = (str) => String(str).trim().toLowerCase();

    validateEmail = (str) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(str).trim().toLowerCase());
    };

    renderRequestHeaders = (token, options) => {
        const RequestHeaders = options;
        if (token !== '') {
            switch (token) {
            case 'Token':
            case 'rohto.ai':
                RequestHeaders.headers = { Authorization: `Token ${this.genToken()}` };
                break;
            case 'admin':
                RequestHeaders.headers = { Authorization: `rohto.ai ${this.genTokenAdmin()}` };
                break;
            default:
                RequestHeaders.headers = {...RequestHeaders.headers, Authorization: `Bearer ${token}` };
                break;
            }
        }
        return RequestHeaders;
    };

    get = async (url, data = {}, token = '', options = {}) => new Promise((resolve, reject) => {
        const params = Object.keys(data).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`).join('&');
        let urlApi = url;
        if (params.length > 0) urlApi += `?${params}`;
        axios.get(urlApi, this.renderRequestHeaders(token, options))
            .then((response) => resolve(response.data))
            .catch((e) => reject(e));
    });

    post = async (url, data, token = '', options = {}) => new Promise((resolve, reject) => {
        axios.post(url, data, this.renderRequestHeaders(token, options))
            .then((response) => resolve(response.data))
            .catch((e) => reject(e));
    });

    put = async (url, data, token = '', options = {}) => new Promise((resolve, reject) => {
        axios.put(url, data, this.renderRequestHeaders(token, options))
            .then((response) => resolve(response.data))
            .catch((e) => reject(e));
    });

    delete = async (url, data, token = '', options = {}) => new Promise((resolve, reject) => {
        const params = Object.keys(data).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`).join('&');
        let urlApi = url;
        if (params.length > 0) urlApi += `?${params}`;
        axios.delete(urlApi, this.renderRequestHeaders(token, options))
            .then((response) => resolve(response.data))
            .catch((e) => reject(e));
    });

    getTasks = (tasks) => {
		return () => {
			const task = tasks.shift();
			if (!task) return;
			return task;
		}
	};


    inArray(needle, haystack, key) {
        var length = haystack.length;
        for(var i = 0; i < length; i++) {
            if(haystack[i][key] == needle) return true;
        }
        return false;
    }

    removeSign = (str) => {
        const _str = str.trim().toLowerCase();

        return _str
            .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
            .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
            .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
            .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
            .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
            .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
            .replace(/đ/gi, 'd')
    };

    uppercaseStr = (str) => {
        if(typeof str==='string'&&str!=''){
            return str.toUpperCase();
        }else return '';
    }
    
      
}

module.exports = new Helper();
