var api = require('../apiUtils.js');
var express = require('express');
var router = express.Router();
var config = require("../config/config.json");
const axios = require('axios'); 
const { check, validationResult } = require('express-validator/check');




//Adds recommendations to products.
router.put('/recommendations', [
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
    var productId = req.body.productId
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
    });
    api.putData('/admin/products/'+productId+'.json', shopifyProductOb)
            .then(response => {
              res.send(response);
            })
            .catch(error => {
              res.status(400).send(error.response.data);
            });
});
//Deletes all recommendations for products.
router.delete('/recommendations', [
    // productId must be a number
    check('productId').isInt()
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    var productId = req.body.productId;
    api.getData('/admin/products/'+productId+'/metafields.json')
      .then(response => {
        var productList = response["metafields"];
        for(var i = 0; i < productList.length; i++) {   
          if (productList[i].key != "description_tag" && productList[i].key != "title_tag" ) {
            api.deleteData('/admin/products/'+productId+'/metafields/'+ productList[i].id+'.json')
                      .then(response => {
                        //res.send(response);
                      })
                      .catch(error => {
                        res.status(400).send(error.response.data);
                      });
          }
        }
      res.send(response);
      })
      .catch(error => {
        res.status(400).send(error.response.data);
      });

});
//Deletes a single recommendation from a product

router.delete('/recommendation', [
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
    var productId = req.body.productId
    var data = JSON.parse(req.body.metadata);
    var arrayId =[];
    Object.keys(data).forEach(function(key) {
        arrayId.push(data[key]);
    });
    api.getData('/admin/products/'+productId+'/metafields.json')
      .then(response => {
        var productList = response["metafields"];
        for(var i = 0; i < productList.length; i++) {  
           for(var j = 0; j < arrayId.length; j++){
              if(arrayId[j] == productList[i].value){
                api.deleteData('/admin/products/'+productId+'/metafields/'+ productList[i].id+'.json')
                  .then(response => {
                    //res.send(response);
                  })
                  .catch(error => {
                    res.status(400).send(error.response.data);
                  });
              }  
            }
          
        }
      res.send(response);
      })
      .catch(error => {
        res.status(400).send(error.response.data);
      });

});

//Gets recommendations for a product recommendations to products.
router.get('/recommendations', [
    // productId must be a number
    check('productId').isInt()
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    var productId = req.query.productId
    var arrayId = [];
    
    api.getData('/admin/products/'+productId+'/metafields.json')
            .then(response => {
              var result = {
                recommendations: []
              };
              var metaData = response["metafields"];
              metaData.forEach(product => {
                if (product.key != "description_tag" && product.key != "title_tag" ) {
                    result.recommendations.push({key:product.key,recommendationId:product.value});
                }
              });
              res.send(result);
            })
            .catch(error => {
              res.status(400).send(error.response.data);
            });
});

//Gets recommendations for a product recommendations to products.
router.get('/all', [
    // productId must be a number
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    var productList = [];
    
    api.getData('/admin/products.json')
            .then(response => {
              var products = response["products"];
              products.forEach(product => {
                productList.push({id: product.id,title:product.title,type:product.product_type})
              });
              res.send(productList);
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