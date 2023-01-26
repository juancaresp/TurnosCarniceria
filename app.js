var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');

/*
*   Proyecto de Juan Carlos Calleja
*
*   Ejecutar desde /Carniceria y la app.js
*   Usuarios:   Pass:
* - carnicero   carnicero
* - admin       admin
*/

//Base de datos
var db = require("./routes/baseDatos").db;

// Se cargan las rutas
var panelRouter = require('./routes/panel');
var turnoRouter = require('./routes/turno');
var loginRouter = require('./routes/login');
var inicioRouter = require('./routes/inicio');
var logoutRouter = require('./routes/logout');
var instaladorRouter = require('./routes/instalador');
var usuRouter = require('./routes/usuarios');

const { application } = require('express');
const { request } = require('http');
const perm = require("./permissions");
//const { watch } = require('fs/promises');

var app = express();
var expressWs = require('express-ws')(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: "Contraseña", 
        cookie: { maxAge: 10*60*1000 }, 
        saveUninitialized: false,
        resave: false
    })
)



// Listado de las páginas que se pueden ver sin autentificación
const public_pages = [
    "/",
    "/login",
    "/instalador",
    "/turno",
    "/turno/.websocket"
];

// Listado de páginas que requieren algún tipo de autorización especial
const private_pages = {
    "/logout":[perm.USER,perm.ADMIN],
    "/panel":[perm.USER,perm.ADMIN],
    "/panel/.websocket":[perm.USER,perm.ADMIN],
    "/usuarios":[perm.ADMIN]
};

// Control de sesión iniciada

app.use((req, res, next) => {
    // Se verifica que el usuario haya iniciado sesión
    
    //Cortamos las peticiones get
    let url=req.url.split("?")[0];

    console.log("control Sesion " + url)

    if(req.session.usuario) {
        if(url==="/login"){
            res.redirect("/")
        }
        if(public_pages.includes(url)){
            next()
        }else if(url in private_pages && private_pages[url].includes(req.session.permiso)){
            next()
        }else{
            next(createError(403))
        }
    } else {
            // Si el usuario no ha iniciado sesión, se verifica que la página es pública
        if(public_pages.includes(url))
            next()
        else if(private_pages[url])
            res.redirect('/login')
        else
            next(createError(404)) // Not found
    }
})



// Se asignan las rutas a sus funciones middleware

app.use('/panel', panelRouter);
app.use('/turno', turnoRouter);
app.use('/login', loginRouter);
app.use('/', inicioRouter);
app.use('/logout', logoutRouter);
app.use('/instalador', instaladorRouter)
app.use('/usuarios',usuRouter)

//WebSockets 
let sockets=[]
let turno=1
let turnoActual=0

app.ws('/turno', function (ws, req) {
    console.log("llega a el socket")

    sockets.push(ws)
    
    ws.on('message', function (msg) {
        if(msg=="Abrir"){
            enviado=turnoActual
            ws.send(enviado)
        }else{
            enviado=++turnoActual

            for(let n = 0; n < sockets.length; n++) {
                sockets[n].send(enviado)
            }
        }
        
        
    });

    ws.on('close', () => {
        console.log('Socket cerrado')
        for(let n = 0; n < sockets.length; n++) {
            if(sockets[n] == ws) {
                console.log('Borrando el socket de la lista')
                sockets.splice(n, 1)
            }
        }
    })


});



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


app.listen(8080)

//El archivo www no va para el ws
//module.exports = app;
exports.turno=turno;
exports.turnoActual=turnoActual;
exports.sockets=sockets;