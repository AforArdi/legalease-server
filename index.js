const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});


const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const db = client.db('legaleasedb');
        const userCollection = db.collection('user');
        const lawyerCollection = db.collection('lawyer');
        const serviceCollection = db.collection('service');

        // user role set on register
        app.patch('/users/role', async (req, res) => {
            try {
                const { email, role } = req.body;
                if (!email || !role) {
                    return res.status(400).send({ message: "Email and role are required" });
                }

                const result = await userCollection.updateOne(
                    { email },
                    { $set: { role } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).send({ message: "User not found" });
                }

                res.send({ message: "Role updated successfully", result });
            } catch (error) {
                res.status(500).send({ message: "Error updating role", error: error.message });
            }
        });

        // lawyer api operation
        app.get('/lawyers', async (req, res) => {
            try {
                const { random, limit } = req.query;
                let lawyers;

                if (random === 'true') {
                    const size = limit ? parseInt(limit) : 6;
                    lawyers = await lawyerCollection.aggregate([{ $sample: { size } }]).toArray();
                } else {
                    let query = lawyerCollection.find();
                    if (limit) query = query.limit(parseInt(limit));
                    lawyers = await query.toArray();
                }

                res.send(lawyers);
            } catch (error) {
                res.status(500).send({ message: "Error getting lawyers", error: error.message });
            }
        });
        app.get('/lawyers/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const lawyer = await lawyerCollection.findOne({ _id: new ObjectId(id) });
                res.send(lawyer);
            } catch (error) {
                res.status(500).send({ message: "Error getting lawyer", error: error.message });
            }
        })

        // user api operation

        // admin api operation


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});