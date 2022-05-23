const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const app = express();

app.use(cors());

app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.rph41.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const myProductcollection = client.db("menufeture").collection("products");
    const usercollection = client.db("menufeture").collection("users");
    app.get("/", (req, res) => {
      res.send("Server is working");
      const querry = { email: data.email };
    });
    // User
    app.post("/login", async (req, res) => {
      const data = req.body;
      const querry = { email: data.email };
      const result = await usercollection.findOne(querry);
      res.send(result);
    });
    app.post("/user", async (req, res) => {
      const data = req.body;
      console.log(data);
      const querry = { email: data.email };
      const option = { upsert: true };
      const updateDoc = {
        $set: data,
      };
      const result = await usercollection.updateOne(querry, updateDoc, option);
      res.send(result);
    });
    app.get("/user/:id", async (req, res) => {
      if (!ObjectId.isValid(req.params.id)) {
        res.status(404).send({ message: "Object id not valid" });
      } else {
        const querry = { _id: ObjectId(req.params.id) };
        const result = await usercollection.findOne(querry);
        if (result) {
          res.send(result);
        } else {
          res.status(404).send({ message: "User Information not founded" });
        }
      }
    });
    // products
    app.post("/addproduct", async (req, res) => {
      const data = req.body;

      const insertdata = {
        name: data.productName,
        price: parseInt(data.productPrice),
        quan: parseInt(data.productQuantity),
        img: data.productImg,
        desc: data.productDesc,
      };
      console.log(insertdata);
      const result = await myProductcollection.insertOne(insertdata);
      res.send(result);
    });
    app.get("/products", async (req, res) => {
      const querry = {};
      const lim = parseInt(req.query.limit);
      const page = parseInt(req.query.page);
      let cursor = myProductcollection.find(querry);
      if (lim) {
        if (page) {
          cursor = myProductcollection
            .find(querry)
            .skip(lim * page)
            .limit(lim);
        } else {
          cursor = myProductcollection.find(querry).limit(lim);
        }
      }
      const products = await cursor.toArray();
      res.send(products);
    });
    // Get Single Products
    app.get("/products/:id", async (req, res) => {
      const querry = { _id: ObjectId(req.params.id) };
      const result = await myProductcollection.findOne(querry);

      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log("Server is working");
});
