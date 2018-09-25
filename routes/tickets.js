var api = require('../apiUtils.js');
var express = require('express');
var router = express.Router();
var config = require("../config/config.json");
const axios = require('axios'); 
const { check, validationResult } = require('express-validator/check');

router.get('/all', [
    // productId must be a number
    check('productId').isInt(),
    // metadata must be a valid json object
    check('metadata').isJSON()
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    /*var productId = req.body.productId
    var data = JSON.parse(req.body.metadata);
    var arrayId = [];
    var shopifyProductOb = {
        product: {
            id: productId,
            metafields: []
        }
    };
    Object.keys(data).forEach(function(key) {
        var value = data[key];
        shopifyProductOb.product.metafields.push({
            key: key,
            value: value,
            value_type: "integer",
            namespace: "recommendations"
        });
    });*/
    api.putData('/admin/products/.json', shopifyProductOb)
            .then(response => {
              res.send(response);
            })
            .catch(error => {
              res.status(400).send(error.response.data);
            });
});





module.exports = router; 



/*
productId = 1231
{
"product": 11111,
"recommendation2": 22222,
"recommendation3": 33333
}
*/