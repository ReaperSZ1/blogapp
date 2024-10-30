const localStr = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs') // comparar as senhas
const passport = require('passport')
require('../models/usuario')
const usuario = mongoose.model('usuarios')

// autenticação
    module.exports = function(passport){

        passport.use(new localStr({usernameField: 'email', passwordField: 'senha'}, (email, senha, done) => {

            usuario.findOne({email: email}).then((usuario) => {

                if(!usuario){
                    return done(null, false, {message: 'essa conta não existe'})
                }
                // aparentemente ele verifica se as senhas batem
                bcrypt.compare(senha, usuario.senha, (erro, ok) => {

                    if(ok){
                        return done(null, usuario)
                    } else {
                        return done(null, false, {message: 'Senha incorreta'})
                    }
                })
            })
        }))
    }

//salvando os dados do usuario na sessão
    passport.serializeUser((usuario,done)=>{
        done(null, usuario.id)
    })
    
    passport.deserializeUser((id, done)=>{

        usuario.findById(id).then((usuario)=>{
            done(null, usuario)
        }).catch((err)=>{
             done(null, false, {message:'algo deu errado'})
        })

    })