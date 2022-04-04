var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('hbs')
var passport = require('passport');


var indexRouter = require('./routes/index')
var serviciosRouter = require('./routes/servicios')
var adminRouter = require('./routes/admin')
var loginRegRouter = require('./routes/loginReg')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-session')({ secret: 'L0r3Md07N3t', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'));

app.use('/', indexRouter);
app.use('/servicios', serviciosRouter);
app.use('/admin', adminRouter);
app.use('/login', loginRegRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
