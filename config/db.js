require('dotenv').config();

module.exports = {
// verifica se vou rodar o server no local ou no server (eu acho)
    mongoURI: process.env.NODE_ENV === 'production' ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV
};
