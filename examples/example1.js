var Creatio = require('../api_creatio.js');
/** Odata Query Documentation:
 *   https://github.com/techniq/odata-query#selecting
 */
const CREATIO_SERVER = 'https://yourinstance.creatio.com'
const CREATIO_USERNAME = 'yourusername'
const CREATIO_PASSWORD = 'yoursuperstrongpassword'

var creatio;

var ops = {
    server: CREATIO_SERVER, 
    username: CREATIO_USERNAME,
    password: CREATIO_PASSWORD
}


async function creatio_get(table, filter) {
    creatio = new Creatio(ops);
    await creatio.login();
    return new Promise((resolve, reject) => {
        try {
            // creatio.getCollectionInstances("Lead",{top:5, select:"LeadTypeId", orderby:"LeadTypeId"}).then(response => {
            //     console.log(response)
            // });
            creatio.get(table, filter).then(response => {
                // console.log(response)
                resolve(response)
            });
        } catch (e) {
            reject (e)
            // console.log("error");
            // console.log(JSON.stringify(e));
        }
    })
}


async function main() {
    try {
        let params = {"id":"c0d5841d-69ce-47c5-87cb-ae510825a24a"};
        var creatioresponse = await creatio_get("Contact", {id: params.id});
        result = { 
            id: params.id,
            data: creatioresponse
        }
        // console.log(JSON.stringify(result));
    } catch (error) {}
}

main ();
