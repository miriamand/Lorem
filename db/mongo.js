const { MongoClient } = require('mongodb');

// const url = 'mongodb://localhost:27017';
const url = 'mongodb+srv://miriam:miriamp@cluster0.9eucu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
const client = new MongoClient(url);

const dbName = 'LoremDB';

module.exports = {client, dbName};








