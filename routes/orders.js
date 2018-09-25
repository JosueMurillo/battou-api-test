var api = require('../apiUtils.js');
var express = require('express');
var router = express.Router();
var config = require("../config/config.json");
const axios = require('axios'); 
const { check, validationResult } = require('express-validator/check');

//Ids of the metafields that store the secuential number.
const generalId= "4308630863935";
const clubId= "4308639121471";

/**
 * Updates an order and adds provided metadata
 * Params:
 *      orderId: order id to update + 
 *      metadata: array of json object
 *          {
 *              ticket_number, 
 *              name (can be null), 
 *              last_name(can be null)], 
 *              will_call (true/false), 
 *              is_gift(true/false),
 *              gift_name(required if true), 
 *              gift_message(required if true),
 *              gift_email(required if true)
 *          }
 */
router.put('/metadata', [
    // orderId must be a number
    check('orderId').isInt(),
    // metadata must be a valid json object
    check('metadata').isJSON()
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    var orderId = req.body.orderId
    var data = JSON.parse(req.body.metadata);
    var generalCurrentConsecutive =0;
    var clubCurrentConsecutive =0;
    var shopifyOrderOb = {
        order: {
            id: orderId,
            metafields: []
        }
    };

   

    

 //Gets the metafield of ticket Number
    api.getData('/admin/metafields/'+generalId+'.json')
      .then(response => {
        var metafielddata= response["metafield"];
        //Get the last ticket number for General tickets stored on the metafield.
        Object.keys(metafielddata).forEach(function(key) {
          if (key=='value') {
            generalCurrentConsecutive = metafielddata[key];
          }
        });

        //Get the last ticket number for Club tickets stored on the metafield.
        api.getData('/admin/metafields/'+clubId+'.json')
          .then(response => {
            var metafielddata= response["metafield"];
            //Get the last ticket number stored on the metafield.
            Object.keys(metafielddata).forEach(function(key) {
              if (key=='value') {
                clubCurrentConsecutive = metafielddata[key];
              }
            });
            Object.keys(data).forEach(function(key) {
            var value = data[key];
        
           if(key === 'ticket_list') {
            // Updates the number for every ticket and increases the consecutive.
            Object.keys(data['ticket_list']).forEach(function(ticketkey) {
              if (data['ticket_list'][ticketkey].ticket_type == 'general') {
                data['ticket_list'][ticketkey].number = generalCurrentConsecutive+1;
                generalCurrentConsecutive++;
              }
              else{
                data['ticket_list'][ticketkey].number = clubCurrentConsecutive+1;
                clubCurrentConsecutive++;
              }
            
            });

          value = JSON.stringify(data[key]);
          }
          shopifyOrderOb.order.metafields.push({
              key: key,
              value: value,
              value_type: "string",
              namespace: "global"
          });

          });
          //Puts the data on the orders metafield 
          api.putData('/admin/orders/'+orderId+'.json', shopifyOrderOb)
            .then(response => {
              var shopifyGeneralConsecutiveMetafieldOb = {
                metafield: {
                    value: generalCurrentConsecutive
                }
              };
              //Changes the Generalnumber consecutive metafield to the last number given to a ticket.
              api.putData('/admin/metafields/'+generalId+'.json',shopifyGeneralConsecutiveMetafieldOb)
              .then(response => {
                //res.send(response);
              })
              .catch(error => {
                res.status(400).send(error.response.data);
              });
              //Changes the Club number consecutive metafields to the last number given to a club ticket
              var shopifyClubConsecutiveMetafieldOb = {
                metafield: {
                    value: clubCurrentConsecutive
                }
              };
              api.putData('/admin/metafields/'+clubId+'.json',shopifyClubConsecutiveMetafieldOb)
              .then(response => {
                //res.send(response);
              })
              .catch(error => {
                res.status(400).send(error.response.data);
              });
              res.send(response);
            })
            .catch(error => {
              res.status(400).send(error.response.data);
            });

      })
      .catch(error => {
        res.status(400).send(error.response.data);
      });
      })
    .catch(error => {
      res.status(400).send(error.response.data);
    });
});



module.exports = router; 

/*
{
    "order": {
      "id": 1,
      "metafields": [
        {
          "key": "new",
          "value": "newvalue",
          "value_type": "string",
          "namespace": "global"
        }
      ]
    }
  }


{
  "is_gift" : "true",
	"gift_name": "Kimberly",
	"gift_mail": "kim.morales@gmail.com",
	"gift_message": "Gift",
  "will_call":"true",
	"ticket_list": [{
		"name": "Yerlin",
		"lastName": "Gómez",
		"number": 601561268288,
    "line_item":11111,
    "status" : "ok",
    "ticket_type" : "general"
	}, {
		"name": "Kimberly",
		"lastName": "Morales",
		"number": 601561268289,
    "line_item":11111,
    "status" : "ok",
    "ticket_type" : "general"
	}, {
		"name": "",
		"lastName": "",
		"number": 601561268290,
    "line_item":11111,
    "status" : "ok",
    "ticket_type" : "club"
	}, {
		"name": "",
		"lastName": "",
		"number": 601561268291,
    "line_item":11111,
    "status" : "ok",
    "ticket_type" : "general"
	}]
}
*/