var api = require('../apiUtils.js');
var express = require('express');
var router = express.Router();
var config = require("../config/config.json");
const axios = require('axios'); 
const { check, validationResult } = require('express-validator/check');

router.get('/all', [
    check('status').isString(),
    check('ticketType').isString()
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    var promises = [];
    var status = req.query.status;
    var ticketType = req.query.ticketType;
    var orders = {};
    var finalList = [];
      
    //Get all the orders with a certain status
    api.getData('/admin/orders.json?status='+status).then(response => {
      var ordersData =response.orders;
      ordersData.forEach(order => {
        var fullfillDate= "-";

        for (i in order.fulfillments){
          fullfillDate = order.fulfillments[i].created_at;
        }
        promises.push(api.getData('/admin/orders/'+order.id+'/metafields.json'));

        shopifyOrderOb = {
          orderId:            order.id,
          dateCreated:        order.created_at,
          orderNumber:        order.name,
          totalPrice:         order.total_price,
          fullfillmentStatus: order.fulfillment_status,
          fullfillDate:       fullfillDate,
          name:               order.billing_address.first_name,
          lastname:           order.billing_address.last_name,
          willCall:           "",
          notes:              "",
          isGift:             "",
          giftName:           "",
          giftMail:           "",
          giftMessage:        "",
          ticketNumber:       "",
          ticketStatus:       "",
          ticketName:         "",
          ticketLastname:     "",
          ticketType:         "",
          ticketLineItem:     "",
          ticketId:           ""
        };

        orders[order.id] = shopifyOrderOb;
      });
        
      Promise.all(promises).then(results => {
        for (var i in results) {
          var metafieldsData = results[i].metafields; 
          var orderId;
          //Iterate throught the metafields and map every metafield.
          for (var j in metafieldsData) {
            orderId = metafieldsData[j].owner_id;
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
            if(metafieldsData[j].key == "notes"){
              orders[orderId].notes = metafieldsData[j].value;
            }
          }
          //Iterate through the ticket list to create a row for each ticket on the ticket list metafield
          for (var j in metafieldsData) {
            if(metafieldsData[j].key == "ticket_list"){
                var ticket_list = JSON.parse(metafieldsData[j].value);
                var order_list = [];
                var min=0;
                var max=0;
                var totalTickets=0;
                var newOrder;
                for (var k in ticket_list) {      
                  if (ticketType == ticket_list[k].ticket_type || ticketType == "any") {
                    if( k == 0 ){
                      min = ticket_list[k].number;
                    }
                    if(ticket_list[k].number < min){
                      min = ticket_list[k].number;
                    }
                    if(ticket_list[k].number > max){
                      max = ticket_list[k].number;
                    }
                    totalTickets++;
                    if(k == ticket_list.length - 1){
                      newOrder = {
                      orderId:              orders[orderId].orderId,
                      orderNumber:          orders[orderId].orderNumber,
                      name:                 orders[orderId].name,
                      lastname:             orders[orderId].lastname,
                      totalTickets:         totalTickets,
                      minNumber:            min,
                      maxNumber:            max,
                      dateCreated:          orders[orderId].dateCreated,
                      fullfillmentStatus:   orders[orderId].fullfillmentStatus,
                      fullfillDate:         orders[orderId].fullfillDate,                  
                      willCall:             orders[orderId].willCall,
                      notes:                orders[orderId].notes
                      }; 
                    }    
                  } 
                }
                if (newOrder !== undefined) {
                      finalList.push(newOrder);
                      newOrder=undefined;
                }
            }
          }
        }
        res.send(finalList);
      }).catch(error => {
        console.log(error);
        res.status(400).send(error.response.data);
      });
    });
});


//Get the data of a specific order.
router.get('/ticketdata', [
    check('status').isString(),
    check('orderId').isInt()
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    var promises = [];
    var status = req.query.status;
    var orderId= req.query.orderId;
    //Get all the orders with a certain status
    api.getData('/admin/orders/'+ orderId +'.json?status='+status).then(response => {
      var order = response.order;

      api.getData('/admin/orders/'+orderId+'/metafields.json').then(response => {
        shopifyOrderOb = {
          orderId:            order.id,
          dateCreated:        order.created_at,
          orderNumber:        order.name,
          totalPrice:         order.total_price,
          fullfillmentStatus: order.fulfillment_status,
          name:               order.billing_address.first_name,
          lastname:           order.billing_address.last_name,
          willCall:           "",
          isGift:             "",
          giftName:           "",
          giftMail:           "",
          giftMessage:        "",
          ticketList:         [],
        }; 

      
          var metafieldsData = response["metafields"];
          //Iterate throught the metafields and map every metafield.
        for (var j in metafieldsData) {
          if(metafieldsData[j].key == "will_call"){
            shopifyOrderOb.willCall = metafieldsData[j].value;
          }
          if(metafieldsData[j].key == "is_gift"){
            shopifyOrderOb.isGift = metafieldsData[j].value;
          }
          if(metafieldsData[j].key == "gift_mail"){
            shopifyOrderOb.giftMail = metafieldsData[j].value;
          }
          if(metafieldsData[j].key == "gift_name"){
            shopifyOrderOb.giftName = metafieldsData[j].value;
          }
          if(metafieldsData[j].key == "gift_message"){
            shopifyOrderOb.giftMessage = metafieldsData[j].value;
          }
          if(metafieldsData[j].key == "ticket_list"){
            var ticket_list = JSON.parse(metafieldsData[j].value);
            for (var k in ticket_list) {
              var newTicket = {
                ticketNumber:   ticket_list[k].number,
                ticketStatus:   ticket_list[k].status,
                ticketName:     ticket_list[k].name,
                ticketLastname: ticket_list[k].lastName,
                ticketType:     ticket_list[k].ticket_type,
                ticketLineItem: ticket_list[k].line_item,
                ticketId:       ticket_list[k].ticket_id,
                ticketTitle:    ticket_list[k].ticket_title,
              }
              shopifyOrderOb.ticketList.push(newTicket); 
            }
          }
        }
        res.send(shopifyOrderOb);
      }).catch(error => {
        res.status(400).send(error.response.data);
      });
    }).catch(error => {
        res.status(400).send(error.response.data);
    });

});


router.put('/metadata', [
    check('metadata').isJSON()
  ], (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    var promises = [];
    var metadata = JSON.parse(req.body.metadata);
    var orderId = metadata.orderId
    //Get the metadata of a certain order
    api.getData('/admin/orders/' + orderId + '/metafields.json').then(response => {
      var ordersMetadata = response.metafields;
      ordersMetadata.forEach(metafield => {
        var shopifyMetaOb = {
                metafield: {
                  id: "",
                  value: ""
                }
        }

        if (metafield.key == "is_gift" && metafield.value != metadata.is_gift) {
          shopifyMetaOb = {
            metafield: {
              id: metafield.id,
              value: metadata.isGift
            }
          }
          api.putData('/admin/metafields/' + metafield.id + '.json',shopifyMetaOb).then(response => {
          }).catch(error => {
              res.status(400).send(error.response.data);
            });         
        }

        if (metafield.key == "will_call" && metafield.value != metadata.will_call) {
          shopifyMetaOb = {
            metafield: {
              id: metafield.id,
              value: metadata.willCall
            }
          }
          api.putData('/admin/metafields/' + metafield.id + '.json',shopifyMetaOb).then(response => {
          }).catch(error => {
              res.status(400).send(error.response.data);
            }); 
        }

        if (metafield.key == "gift_name" && metafield.value != metadata.gift_name) {
            shopifyMetaOb = {
              metafield: {
                id: metafield.id,
                value: metadata.giftName
              }
            }
            api.putData('/admin/metafields/' + metafield.id + '.json',shopifyMetaOb).then(response => {
            }).catch(error => {
                res.status(400).send(error.response.data);
              }); 
        }

        if (metafield.key == "gift_mail" && metafield.value != metadata.gift_mail) {
            shopifyMetaOb = {
              metafield: {
                id: metafield.id,
                value: metadata.giftMail
              }
            }
            api.putData('/admin/metafields/' + metafield.id + '.json',shopifyMetaOb).then(response => {
            }).catch(error => {
                res.status(400).send(error.response.data);
              }); 
        }

        if (metafield.key == "gift_message" && metafield.value != metadata.gift_message) {
            shopifyMetaOb = {
              metafield: {
                id: metafield.id,
                value: metadata.giftMessage
              }
            }
            api.putData('/admin/metafields/' + metafield.id + '.json',shopifyMetaOb).then(response => {
            }).catch(error => {
                res.status(400).send(error.response.data);
              }); 
        }

        if (metafield.key == "ticket_list") {

          var ticketList = JSON.parse(metafield.value);
          var newTicketList = [];
          ticketList.forEach(ticket => {
            if (ticket.ticket_id == metadata.ticketId && ticket.number   != metadata.ticketNumber) {
              ticket.number   = metadata.ticketNumber;
            }
            if (ticket.ticket_id == metadata.ticketId && ticket.name     != metadata.ticketName) {
              ticket.name     = metadata.ticketName;
            }
            if (ticket.ticket_id == metadata.ticketId && ticket.lastName != metadata.ticketLastname) {
              ticket.lastName = metadata.ticketLastname;
            }
            if (ticket.ticket_id == metadata.ticketId && ticket.status   != metadata.ticketStatus) {
              ticket.status   = metadata.ticketStatus;
            }

            newTicketList.push(ticket);
          });  
          shopifyMetaOb = {
            metafield: {
              id: metafield.id,
              value: JSON.stringify(newTicketList)
            }
          }
          
         api.putData('/admin/metafields/' + metafield.id + '.json',shopifyMetaOb).then(response => {
          }).catch(error => {
              res.status(400).send(error.response.data);
             });     
        }
      });//end of the forEach ordersMetadata metafield
      res.send(metadata);
    }).catch(error => {
        res.status(400).send(error.response.data);
      });    
});


module.exports = router; 

