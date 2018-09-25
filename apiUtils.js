var config = require('./config/config.json');
var exports = module.exports = {};

const axios = require('axios'); 
const ROOT_URL = config.shopify.apiUrl;

exports.putData = function(url, payload) {
  return new Promise((resolve, reject) => {
    axios.put(`${ROOT_URL}${url}`, payload, {'content-type':'application/json'})
      .then(response => {
        var result;

        if (response.status !== 200) {
          reject(response);
        } else {
          try {
            resolve(response.data);
          } 
          catch(e) {
            reject(response.data);
          }
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}
exports.getData = function(url, payload) {
  return new Promise((resolve, reject) => {
    axios.get(`${ROOT_URL}${url}`, payload, {'content-type':'application/json'})
      .then(response => {
        var result;

        if (response.status !== 200) {
          reject(response);
        } else {
          try {
            resolve(response.data);
          } 
          catch(e) {
            reject(response.data);
          }
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}
exports.deleteData = function(url, payload) {
  return new Promise((resolve, reject) => {
    axios.delete(`${ROOT_URL}${url}`, payload, {'content-type':'application/json'})
      .then(response => {
        var result;

        if (response.status !== 200) {
          reject(response);
        } else {
          try {
            resolve(response.data);
          } 
          catch(e) {
            reject(response.data);
          }
        }
      })
      .catch(error => {
        reject(error);
      });
  });
}