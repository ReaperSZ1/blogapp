// esse helper so permite a entrada de usuarios admin
module.exports = {
    eAdmin: function(req, res, next){
        if(req.isAuthenticated() && req.user.eAdmin == 1){
            return next()
        }
        req.flash('errorMsg', 'Acesso Exclusivo para Administradores')
        res.redirect('/')
    }
}