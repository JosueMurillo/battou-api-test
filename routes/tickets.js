var api = require('../apiUtils.js');
var express = require('express');
var router = express.Router();
var config = require("../config/config.json");
const axios = require('axios'); 
const { check, validationResult } = require('express-validator/check');

router.get('/all', [
    check('status').isString()
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    var promises = [];
    var status = req.query.status;
    var orders = {};
    var finalList = [];
      
    //Get all the orders with a certain status
    api.getData('/admin/orders.json?status='+status).then(response => {
      var ordersData =response.orders;
      ordersData.forEach(order => {
        promises.push(api.getData('/admin/orders/'+order.id+'/metafields.json'));

        shopifyOrderOb = {
          orderId:            order.id,
          dateCreated:        order.created_at,
          orderNumber:        order.name,
          totalPrice:         order.total_price,
          fullfillmentStatus: order.fulfillment_status,
          willCall:           "",
          isGift:             "",
          giftName:           "",
          giftMail:           "",
          giftMessage:        "",
          ticketNumber:       "",
          ticketStatus:       "",
          ticketName:         "",
          ticketLastname:     "",
          ticketType:         "",
          ticketLineItem:     ""
        };

        orders[order.id] = shopifyOrderOb;
      });
        
      Promise.all(promises).then(results => {
        for (var i = 0; i < results.length; i++) {
          var metafieldsData = results[i].metafields;
          var orderId = metafieldsData[i].owner_id;;
          //Iterate throught the metafields and map every metafield.
          for (var j = 0; j < metafieldsData.length; j++) {
            if(metafieldsData[j].key == "will_call"){
              orders[orderId].willCall = metafieldsData[j].value;
            }
            if(metafieldsData[j].key == "is_gift"){
              orders[orderId].isGift = metafieldsData[j].value;
            }
            if(metafieldsData[j].key == "gift_mail"){
              orders[orderId].giftMail = metafieldsData[j].value;
            }
            if(metafieldsData[j].key == "gift_name"){
              orders[orderId].giftName = metafieldsData[j].value;
            }
            if(metafieldsData[j].key == "gift_message"){
              orders[orderId].giftMessage = metafieldsData[j].value;
            }
          }
          //Iterate through the ticket list to create a row for each ticket on the ticket list metafield
          for (var j = 0; j < metafieldsData.length; j++) {
            if(metafieldsData[j].key == "ticket_list"){
                var ticket_list = JSON.parse(metafieldsData[j].value);
                for (var k = 0; k < ticket_list.length; k++) {
                  var newOrder = {};
                  newOrder.orderId            = orders[orderId].orderId;
                  newOrder.dateCreated        = orders[orderId].dateCreated;
                  newOrder.orderNumber        = orders[orderId].orderNumber;
                  newOrder.totalPrice         = orders[orderId].totalPrice;
                  newOrder.fullfillmentStatus = orders[orderId].fullfillmentStatus;
                  newOrder.willCall           = orders[orderId].willCall;
                  newOrder.isGift             = orders[orderId].isGift;
                  newOrder.giftMail           = orders[orderId].giftMail;
                  newOrder.giftName           = orders[orderId].giftName;
                  newOrder.giftMessage        = orders[orderId].giftMessage;

                  newOrder.ticketNumber   = ticket_list[k].number;
                  newOrder.ticketStatus   = ticket_list[k].status;
                  newOrder.ticketName     = ticket_list[k].name;
                  newOrder.ticketLastname = ticket_list[k].lastName;
                  newOrder.ticketType     = ticket_list[k].ticket_type;
                  newOrder.ticketLineItem = ticket_list[k].line_item;
                  finalList.push(newOrder);
                }
            }
          }
        }
        res.send(finalList);
      }).catch(error => {
        res.status(400).send(error.response.data);
      });
    });
});

module.exports = router; 

