var express = require('express');
var router = express.Router();
const db = require('./baseDatos').db;
var variables= require("../app")

router.get('/', function (req, res, next) {
 
  if(!req.session.turno){
    req.session.turno=variables.turno
    variables.turno++;
  }
  if (req.session.usuario)
    res.render('turno', { titulo: 'Turno', iniciar: "none", cerrar: "block", iniciada: "block", perm: "block", nombre: req.session.usuario,turno:req.session.turno});
  else
    res.render('turno', { titulo: 'Turno', iniciar: "block", cerrar: "none", iniciada: "none", perm: "none", nombre: "",turno:req.session.turno});
})

module.exports = router;
