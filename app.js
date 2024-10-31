// Carregando modulos
    const express = require('express')
    const app = express()
    const handlebars = require('express-handlebars') 
    const bodyParser = require('body-parser')
    const mongoose = require('mongoose')
    const admin = require('./routes/admin') // carregando as rotas
    const usuarios = require('./routes/usuario') // carregando as rotas
    const path = require('path') // serve pra manipular pastas/diretórios
    const session = require("express-session")
    const MongoStore = require('connect-mongo');
    const flash = require("connect-flash") // o flash é um tipo de session que aparece só uma vez e some quando da f5 na pagina
    require('./models/postagens')
    const postagem = mongoose.model('postagens')
    require('./models/categoria')  // Isso executa o código dentro de categoria.js, mas não retorna nada
    const categoria = mongoose.model('categorias') 
    const passport = require('passport')
    require('./config/auth')(passport)
    require('dotenv').config();
// Settings
    // MongoURI
        // verifica se vou rodar o server no local ou no server (eu acho)
        const mongoURI = process.env.NODE_ENV === 'production' 
            ? process.env.MONGO_URI_PROD 
            : process.env.MONGO_URI_DEV;

        if (!mongoURI) {
            console.error("Error: MongoDB URI is not defined.");
            process.exit(1); // Interrompe a execução se a URI não estiver definida
        }
    // Body-Parser
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json()) 
    // Handlebars
        app.engine('handlebars', handlebars.engine({ 
            defaultLayout: 'main',
            runtimeOptions: { // config do each
                allowProtoPropertiesByDefault: true,
                allowProtoMethodsByDefault: true
            }
         }))
        app.set('views', path.join(__dirname, 'views')); // Defina o caminho absoluto para o diretório de views
        app.set('view engine', 'handlebars')
    // Public (mostrando onde é a pasta de arquivos estaticos para o express)
        app.use(express.static(path.join(__dirname, 'public'))) // path.join para encontrar o arquivo public 
    // Mongoose 
    // local: mongodb://localhost/nomedadb
        mongoose.connect(mongoURI) // esse mongouri determina se vai conectar pelo local ou pelo server
            .then(() => { console.log('conectado ao mongo'); })
            .catch((err) => { console.log('erro ao se conectar: ' + err); })
    // Session (siga essa orde recomendada)
        app.use(session({
            secret:'aicalica', // isso é usado para garantir que o ID da sessão seja seguro.
            resave: true, // salva a session automaticamente mesmo sem alterações
            saveUninitialized: true, // salva a session automaticamente mesmo sem dados ou que nao se iniciou
            store: MongoStore.create({
                mongoUrl: process.env.MONGODB_URI, // Use sua URI do MongoDB
                collectionName: 'sessions' // Nome da coleção onde as sessões serão armazenadas
            })
        }))
        app.use(passport.initialize()) // configurações do passport
        app.use(passport.session())
        app.use(flash()) // flash
    // MiddleWares (session)
        app.use((req, res, next) => {
            // res.locals cria uma variável global
            res.locals.successMsg = req.flash('successMsg')
            res.locals.errorMsg = req.flash('errorMsg')
            res.locals.error = req.flash('error') // flash error message do passport
            res.locals.user = req.user || null // vai armazenar dados do usuario, caso nao tenha usuario logado == null
            next() // o next serve pra ele após imprimir o txt, continuar o trafégo normal
        })
// Routes
    app.get('/', (req, res) => { 
        postagem.find().populate('categoria').sort({data: 'desc'}).then((postagens) => {
            res.render('index', {postagens:postagens})
        }).catch((err) => {
            req.flash('errorMsg', 'Houve um erro interno')
            res.redirect('/404') // error
        })
    })

    app.get('/404', (req, res) => {
        res.send('Erro 404!')
    })
    app.get("/postagem/:slug", (req, res) => {
        postagem.findOne({slug: req.params.slug}).populate('categoria').then((postagem) => {
            if(postagem){
                res.render('postagem/index', {postagem: postagem})
            } else {
                req.flash('errorMsg', 'Postagem não encontrada')
                res.redirect('/') 
            }
        }).catch((err) => {
            req.flash('errorMsg', 'Houve um erro interno')
            res.redirect('/') 
        })
    })
    app.get("/categorias", (req, res) => {
        categoria.find().then((categorias) => {
            res.render("categorias/index", {categorias:categorias})
        }).catch((err) => {
            req.flash('errorMsg', 'Houve um erro ao exibir as categorias')
            res.redirect('/') 
        })
    })
    app.get('/categorias/:slug', (req, res) => {
    //procurar as postagens que pertencem a uma categoria
        categoria.findOne({slug: req.params.slug}).then((categoria) => {
            if(categoria){
                postagem.find({categoria: categoria._id}).then((postagens) => {
                    res.render('categorias/postagens', {postagens: postagens, categoria: categoria})
                }).catch((err) => {
                    req.flash('errorMsg', 'Houve um erro ao listar as postagens')
                    res.redirect('/') 
                })
            } else {
                req.flash('errorMsg', 'essa categoria não existe')
                res.redirect('/') 
            }
        }).catch((err) => {
            req.flash('errorMsg', 'Houve um erro ao encontrar a categoria')
            res.redirect('/') 
        })
    })
    // ao criar novas rotas utilize isso
    app.use('/admin', admin) // linkando as rotas ao server, use /admin/nomedaRota
    app.use('/usuarios', usuarios)
// Outros
    const PORT = process.env.PORT || 8081 // fazer a conexão ou com heroku ou como local
    app.listen(PORT, () => { console.log('servidor do pai ta on \nacesse: http://localhost:8081'); })
    