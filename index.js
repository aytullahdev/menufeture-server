const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()
const app = express();

app.use(cors())

app.use(express.json())
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.rph41.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const mydb = client.db("menufeture").collection('products');
        app.get('/',(req,res)=>{
            res.send("Server is working");
        })
        // products 
        app.post('/addproduct',async(req,res)=>{
            const data = req.body;
            const insertdata = {name:data.productName,price:data.productPrice,quan:data.productQuantity,img:data.productImg,desc:data.productDesc}
            console.log(insertdata);
            const result = await mydb.insertOne(insertdata);
            res.send(result);
        });

    }finally{

    }
}
run().catch(console.dir);
app.listen(port,()=>{
    console.log("Server is working");
    
})