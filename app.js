var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var ordersRouter = require('./routes/orders');
var productsRouter = require('./routes/products');
var ticketsRouter = require('./routes/tickets');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});*/

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/orders', ordersRouter);
app.use('/products', productsRouter);
app.use('/tickets', productsRouter);

module.exports = app;
