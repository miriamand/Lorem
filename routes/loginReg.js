var express = require('express');
var router = express.Router();
var {client, dbName} = require('../db/mongo');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var bcrypt = require('bcrypt');
let {validarUser} = require('./schemas');
var ObjectId = require('mongodb').ObjectId

passport.use(new LocalStrategy(
  async function(username, password, done) {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('usuarios');
    await collection.findOne({ email: username }, function (err, user) {
      if (err) {return done(err);}
      if (!user) {return done(null, false);}

      bcrypt.compare(password,user.pass, function(err, res) {
        if(err){
          console.log(err)
        } else {return done(null, user);}
        return done(null, false);
      });
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

router.get('/', function(req, res, next) {
    res.render('login/loginReg', { titP: 'Inicio de Sesión y Registro',
    titH: 'Lorem.net - Login/Register',
    descripP: 'Mayor personalización a tu alcance', 
    imgP: 'imgP_login' });
});

router.get('/editar', function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login')
  }}, async function(req, res, next) {
    await client.connect();
    const db = client.db(dbName);
    const collUs = db.collection('usuarios');
    const collCont = db.collection('contras');
    let usuario = await collUs.findOne({"email": req.user.email});
    let contra = await collCont.findOne({"_id": ObjectId(usuario._id)});

    res.render('login/editarUsuario', { titP: 'Ajustes del Usuario',
    titH: 'Lorem.net - Ajustes',
    descripP: 'Mayor personalización a tu alcance', 
    imgP: 'imgP_login',
    session: req.user,
    contra: contra.pwd});
});

router.post('/editar', function(req, res, next){
  editUser(req.body)
  .then(()=>{
    res.redirect('/')
  })
  .catch((err)=>{
    console.log(err);
  })
  .finally(()=>{
    client.close();
  })
})
  
router.post('/register', function(req, res, next){
    regUser(req.body)
    .then(async function(){
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('usuarios');
      let usuario = await collection.findOne({email: req.body.emailUser});
      var user = {
        _id: ObjectId(usuario._id),
        username: usuario.email
      };
      req.login(user, function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
    })
    .catch((err)=>{
        console.log(err);
        res.redirect('/login')
    })
    .finally(()=>{
        client.close();
    })
});

router.post('/entrar',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    if(req.user.profile==="admin"){
      res.redirect('/admin/cotizaciones')
    }else{
      res.redirect('/');
    }
  });

router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
});

async function regUser(datos){
  if (datos.passUser !== datos.confPass) {
    throw false
  } else {
    var respuesta = validarUser(datos)
    if(respuesta.error){
      console.log(respuesta.error.details);
      throw false
    }else{
      var pwd = datos.passUser
      var hashpass = await bcrypt.hash(datos.passUser,10);

      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('usuarios');
      await collection.insertOne({
          nomUser: datos.nomUser,
          apUser: datos.apUser,
          email: datos.emailUser,
          pass: hashpass,
          cel: datos.celUser,
          ciudad: datos.ciudadUser,
          profile: "user"
      });

      let usuario = await collection.findOne({email: datos.emailUser});
      
      const collection2 = db.collection('contras');
      await collection2.insertOne({
        _id: usuario._id,
        pwd: pwd
      });
    }
  }  
}

async function editUser(datos){
  if (datos.passEdit !== datos.confPassEdit) {
    throw 'Las contraseñas no coinciden'
  }else{
    let pwd = datos.passEdit
    var hashpass = await bcrypt.hash(datos.passEdit,10);

    await client.connect();
    const db = client.db(dbName);
    const collUs = db.collection('usuarios');
    const collCont = db.collection('contras');
    let usuario = await collUs.findOne({ email: datos.emailEdit })
    let pass = await collCont.findOne({ _id: usuario._id})
    
    await collUs.updateOne({ email: datos.emailEdit },
      {$set:
        {nomUser: datos.nomUser,
        apUser: datos.apUser,
        pass: hashpass,
        cel: datos.celUser,
        ciudad: datos.ciudadUser}
      })

      await collCont.updateOne({_id: ObjectId(pass._id)},
      {$set: {
        pwd: pwd
      }})
  }};

module.exports = router;