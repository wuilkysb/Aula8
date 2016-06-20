'use strict';

/*
 * Module dependencies.
 */

// Note: We can require users, articles and other cotrollers because we have
// set the NODE_PATH to be ./app/controllers (package.json # scripts # start)

const users = require('../app/controllers/users');
const sections = require('../app/controllers/Section');
const sessions = require('../app/controllers/Session');
const subjects = require('../app/controllers/Subject');
const subjectusers = require('../app/controllers/SubjectUser');
const question = require('../app/controllers/Question');
const auth = require('./middlewares/authorization');
const port = process.env.PORT || 3000;
var numUsuarios = 0;
var ROOMS = {};
var CLIENTS = {};

for (var i = 0; i < 3; i++)
{
  ROOMS["room"+i] = "room" + i;
}
ROOMS["room"+3] = "room" + 3;

/**
 * Expose routes
 */

module.exports = function (app, passport) {

  // user routes
  const io = require('socket.io').listen(app.listen(port));
  app.post('/create/user', users.create);
  app.post('/create/section', sections.create);
  app.post('/create/session', sessions.create);
  app.post('/create/subject', subjects.create);
  app.post('/create/subjectuser', subjectusers.create);
  app.post('/auth/login', users.login);
  app.get('/private', auth.ensureAuthenticated);
  //app.get('/users/subject', users.subject);
  app.get('/users/:username', users.findUser);

  console.log('Express app started on port ' + port);


  io.on('connection', function(socket) {  
      console.log('Un cliente se ha conectado');

    socket.on('credentials', function(data) {  
        console.log(data);
    });

    var usuarioAñadido = false;

    socket.on('room', function (room)
      {
        if(String(room.split("\"")[1]) === "undefined")
        {
          console.log("user conectado en la sala ", room );
          socket.room = room;
        }else{
          console.log("user conectado en la sala ", room.split("\"")[1] );
          socket.room = room.split("\"")[1];
        }
        socket.join (room);
      }

    );

    socket.on('send_audio', function(data)
    {
        client.broadcast.emit('get_audio', data);
        console.log('recibiendo audio');
    });

    socket.on('nuevo mensaje', function (data) {
      console.log("nuevo mensaje de ", socket.username, data, "en la sala ", socket.room);
      socket.broadcast.to(socket.room).emit('nuevo mensaje', {
        nombre_Usuario: socket.username,
        mensaje: data
      });
    });


    socket.on('agregar usuario', function (nombre_Usuario) {
      if (usuarioAñadido) return;


      socket.username = nombre_Usuario;
      ++numUsuarios;
      usuarioAñadido = true;
      socket.emit('iniciar sesion', {
        numUsuarios: numUsuarios
      });

      socket.broadcast.to(socket.room).emit('usuario unido', {
        nombre_Usuario: socket.username,
        numUsuarios: numUsuarios
      });

      console.log('Alguien se conectó con Aula 8', socket.request.connection._peername);
    });


    socket.on('escribiendo', function ()
    {
      socket.broadcast.to(socket.room).emit('escribiendo', {
        nombre_Usuario: socket.username
      });
    });


    socket.on('no escribiendo', function () {
      socket.broadcast.to(socket.room).emit('no escribiendo', {
        nombre_Usuario: socket.username
      });
    });

    socket.on('enviar imagen', function (data) {
      socket.broadcast.to(socket.room).emit('enviar imagen', {
        nombre_Usuario: socket.username,
        img_Codificada: data
      });
    });

    socket.on("pintar", function(data)
    {
        client.broadcast.emit("pintar",data);
        console.log(data);
    });

    socket.on("borrar todo", function()
    {
        client.broadcast.emit("borrar todo");
        console.log("Borrar todo");
    });


    socket.on('disconnect', function () {
      if (usuarioAñadido) {
        --numUsuarios;

        console.log('Alguien se desconectó de Aula 8', socket.request.connection._peername);

        socket.broadcast.to(socket.room).emit('usuario desconectado', {
          nombre_Usuario: socket.username,
          numUsuarios: numUsuarios
        });
      }
    });

  });
};
