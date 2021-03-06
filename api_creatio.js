/**
 * node-creatio-api
 * author: enrique motilla <e @ quad-tree.com>
 * date: 2020-10-26 21:03, 
 * 2021-02-05 14:02 last update
 * licence MIT
 * no warranties implied
 * All rights reserved Quad Tree SA de CV 2021.
 */
var buildQuery = require('odata-query');
var axios = require('axios');

/** Odata Query Documentation:
 *   https://github.com/techniq/odata-query#selecting
 */

var Creatio = function (options) {
    this.server = options.server;           // http://youraccount.creatio.com
    this.userName = options.username;       // creatio username
    this.userPassword = options.password;   // creatio password
    this.authStr = '';
    this.bpm_csrf = '';

    var bodyObj = {
        "UserName": this.userName,
        "UserPassword": this.userPassword
    };

    this._include_headers = function (body, response, resolveWithFullResponse) {
        return {
            'headers': response.headers,
            'data': body
        };
    };
    this.options = {
        'method': 'POST',
        'url': this.server + '/ServiceModel/AuthService.svc/Login',
        'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8'
        },
        // transform: this._include_headers,
        json: true, 
        'data': JSON.stringify(bodyObj)
    };

    // console.log(JSON.stringify(this.options));
    console.log("Creatio contructor OK");
};

Creatio.prototype.constructor = Creatio;

Creatio.prototype.parsecookie = function (setcookiearr) {
    var c = setcookiearr; //response.headers['set-cookie']
    var bpm_loader = c[0]
    bpm_loader = bpm_loader.replace('BPMLOADER=', '')
    bpm_loader = bpm_loader.split(';')[0]
    var aspx_auth = c[1]
    aspx_auth = aspx_auth.replace('.ASPXAUTH=', '')
    aspx_auth = aspx_auth.split(';')[0]
    var bpm_csrf = c[2]
    bpm_csrf = bpm_csrf.replace('BPMCSRF=', '')
    bpm_csrf = bpm_csrf.split(';')[0]
    var user_name = c[3]
    user_name = user_name.replace('UserName=', '')
    user_name = user_name.split(';')[0]
    var auth = 'BPMLOADER=' + bpm_loader + '; .ASPXAUTH=' + aspx_auth + '; BPMCSRF=' + bpm_csrf + '; UserName=' + user_name + ';';
    return {
        auth: auth,
        bpm_csrf: bpm_csrf
    }
}


Creatio.prototype.login = function () {
    //console.log (this.options)
    return new Promise((resolve, reject) => {
        axios(this.options)
            .then(response => {
                // console.log(response.headers['set-cookie']);
                // console.log(response.data);
                var authObj = this.parsecookie(response.headers['set-cookie']);
                this.authStr = authObj.auth;
                this.bpm_csrf = authObj.bpm_csrf;
                // console.log("AUTHSTR="+this.authStr);
                // console.log("BPMCSRF="+this.bpm_csrf);
                resolve(this);
            })
            .catch(function (err) {
                console.log("ERROR on login: " + err);
                reject(err);
            });
    });
}

/**
 * gets instances of a collection
 * @param {string} resource   example: "Lead"
 * @param {string} paramsObj   {id: "c0d5841d-69ce-47c5-87cb-ae510825a24a", top:value, select:"Field1,Field2", orderby:"name", expand: "expandcollection", collection2:"Lead", field:"Field", count:true, skip:5 } }
 * DOCUMENTATION: https://documenter.getpostman.com/view/10204500/SztHX5Qb#ca343f79-d010-4293-979a-150650149ce9
 */
Creatio.prototype.get = function (resource, paramsObj) {
    console.log("Creatio GET");
    var idstr = (paramsObj.id ? "(" + paramsObj.id + ")" : "");
    var query = (paramsObj.query ? paramsObj.query : {});
    var queryStr = buildQuery.default(query);
    // var collection2str = (paramsObj.collection2 ? "/" + paramsObj.collection2 : "");
    var fieldstr = (paramsObj.id && paramsObj.field ? "/" + paramsObj.field : "");
    var options = {
        method: 'GET',
        url: this.server + '/0/odata/' + resource + idstr + fieldstr + queryStr,
        'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            Cookie: this.authStr,
            BPMCSRF: this.bpm_csrf,
        },
        json: true
    };

    // console.log(options.url);
    return new Promise((resolve, reject) => {
        axios(options)
            .then(data_json => {
                // console.log(JSON.stringify(data_json.data));
                var result = data_json.data; //JSON.parse(data_json);
                if (paramsObj.field) {
                    resolve(result.value);
                } else {
                    resolve(result);
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
}



Creatio.prototype.insert = function (resource, object) {
    var options = {
        method: 'POST',
        url: this.server + '/0/odata/' + resource,
        'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            Cookie: this.authStr,
            BPMCSRF: this.bpm_csrf,
        },
        json: true,
        data: object
    };

    // console.log(options.url);
    return new Promise((resolve, reject) => {
        axios(options)
            .then(data_json => {
                resolve(data_json.data);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
/**
 * Updates Collection info
 * @param {string} resource   "Contact"   //collection
 * @param {id}     id         uuid of the resource
 * @param {*}      object     {fields... }
 */
Creatio.prototype.update = function (resource, id, object) {

    var options = {
        method: 'PATCH',
        url: this.server + '/0/odata/' + resource + "(" + id + ")",
        'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            Cookie: this.authStr,
            BPMCSRF: this.bpm_csrf,
        },
        json: true,
        data: object
    };

    // console.log(options.url);
    return new Promise((resolve, reject) => {
        axios(options)
            .then(data_json => {
                // resolve(data_json);
                resolve({response:"ok"});
            })
            .catch(function (err) {
                reject(err);
            });
    });
}
/**
 * @param {*} resource  is the collection name
 * @param {*} id        uuid of the resource
 */
Creatio.prototype.delete = function (resource, id) {
    var options = {
        method: 'DELETE',
        url: this.server + '/0/odata/' + resource + "(" + id + ")",
        'headers': {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            Cookie: this.authStr,
            BPMCSRF: this.bpm_csrf,
        }
    };

    // console.log(options.url);
    return new Promise((resolve, reject) => {
        axios(options)
            .then(data_json => {
                resolve(data_json.data);
            })
            .catch(function (err) {
                reject(err);
            });
    });
}



module.exports = Creatio;