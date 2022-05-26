const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { is } = require("express/lib/request");
require("dotenv").config();
const app = express();
const stripe = require("stripe")(process.env.PK);
app.use(cors());

app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.rph41.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader;
  jwt.verify(token, process.env.PK, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const myProductcollection = client.db("menufeture").collection("products");
    const usercollection = client.db("menufeture").collection("users");
    const ordercollection = client.db("menufeture").collection("orders");
    const reviwscollection = client.db("menufeture").collection("reviews");
    //Verify Admin
    
    app.get("/", (req, res) => {
      res.send("Server is working");
      
    });
    // User
    app.get("/users", async (req, res) => {
      const querry = {};
      const result = await usercollection.find(querry).toArray();
      res.send(result);
    });
    app.post("/updateprofile", async (req, res) => {
      const data = req.body;
      console.log(data);
      const querry = { _id: ObjectId(data._id) };
      const updateDoc = {
        $set: {
          name: data.name,
          location: data.location,
          linkdin: data.linkdin,
          phone: data.phone,
          education: data.education,
        },
      };
      const result = await usercollection.updateOne(querry, updateDoc);
      console.log(updateDoc);
      res.send(result);
    });
    app.post("/login", async (req, res) => {
      const data = req.body;
      const querry = { email: data.email };
      const result = await usercollection.findOne(querry);
      const responseData = jwt.sign({email:result.email,role:result.role}, process.env.PK)
      res.send({token:responseData,id:result._id});
    });
    app.post("/user", async (req, res) => {
      const data = { ...req.body, role: "user" };
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
    app.post("/makeadmin", async (req, res) => {
      const data = req.body;
      console.log(data);
      const querry = { email: data.email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await usercollection.updateOne(querry, updateDoc);
      res.send(result);
    });
    app.post("/isadmin",verifyJWT, async (req, res) => {
      const data = req.body;
      const querry = { _id: ObjectId(data._id) };

      const result = await usercollection.findOne(querry);
      const isadmin = result.role==="admin";
      res.send({result:isadmin});
    });
    // products
    // Product add or Update
    app.post("/addproduct",verifyJWT, async (req, res) => {
      const data = req.body;
      const querry = { _id: ObjectId(data._id) };
      const option = { upsert: true };

      const insertdata = {
        catagory: data.catagory,
        description: data.description,
        img: data.img,
        introduction: data.introduction,
        price: data.price,
        quan: data.quan,
        tittle: data.tittle,
      };
      console.log(insertdata);
      const updateDoc = {
        $set: insertdata,
      };
      console.log(insertdata);
      const result = await myProductcollection.updateOne(
        querry,
        updateDoc,
        option
      );
      res.send(result);
    });
    //Get product
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
    // Remove a product
    app.post("/removeproduct", async (req, res) => {
      const data = req.body;
      const querry = { _id: ObjectId(data._id) };
      const result = await myProductcollection.deleteOne(querry);
      res.send(result);
    });
    //Payments
    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      const price = order.price;
      const amount = price * 100;
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: price,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    // Order manage section
    app.post("/order", async (req, res) => {
      const data = { ...req.body, payment: false };
      const result = await ordercollection.insertOne(data);
      //We have to reduce Prduct Quantity;
      res.send(result);
    });
    app.post("/payment", async (req, res) => {
      const data = req.body;
      const querry = { _id: ObjectId(data._id) };
      const updateDoc = {
        $set: { payment: true },
      };
      const result = await ordercollection.updateOne(querry, updateDoc);
      res.send(result);
    });
    app.get("/orders", async (req, res) => {
      let querry = {};
      const id = req.query.id;
      if (id) querry = { userid: id };
      const result = await ordercollection.find(querry).toArray();
      res.send(result);
    });
    app.post("/delorder", async (req, res) => {
      const data = req.body;
      console.log(data);
      const querry = { _id: ObjectId(data._id) };
      const result = await ordercollection.deleteOne(querry);

      res.send(result);
    });
    //Handel Reviews
    app.post("/postreviews", async (req, res) => {
      const data = req.body;
      const result = await reviwscollection.insertOne(data);
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const paymentId = req.query.paymentId;
      const productId = req.query.productId;
      let querry = {};
      if (paymentId) {
        querry = { paymentid: paymentId };
        const Singleresult = await reviwscollection.findOne(querry);
        res.send(Singleresult);
      } else if(productId){
        querry = { paymentid: productId };
        const productresult = await reviwscollection.find(querry);
        res.send(productresult);
      
      }else {
        querry = {};
        const result = await reviwscollection.find(querry).toArray();
        console.log(result);
        res.send(result);
      }
    });
  } finally {
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log("Server is working");
});
