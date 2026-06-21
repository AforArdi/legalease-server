const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const hiringReqCollection = db.collection('hiringReq');
        const paymentCollection = db.collection('payment');
        const commentCollection = db.collection('comment');

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
        app.post('/lawyers', async (req, res) => {
            try {
                const lawyerData = req.body;
                if (!lawyerData.email) {
                    return res.status(400).send({ message: "Email is required" });
                }
                const query = { email: lawyerData.email };
                const update = { $set: lawyerData };
                const result = await lawyerCollection.updateOne(query, update, { upsert: true });
                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error updating lawyer profile", error: error.message });
            }
        });

        app.get('/lawyers', async (req, res) => {
            try {
                const { random, limit, email } = req.query;
                let lawyers;

                if (random === 'true') {
                    const size = limit ? parseInt(limit) : 6;
                    lawyers = await lawyerCollection.aggregate([{ $sample: { size } }]).toArray();
                } else {
                    let queryObj = {};
                    if (email) queryObj.email = email;
                    let query = lawyerCollection.find(queryObj);
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
        app.patch('/lawyer/hiring/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const { status } = req.body;
                const filter = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: { status }
                };
                const result = await hiringReqCollection.updateOne(filter, updateDoc);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error updating hiring status", error: error.message });
            }
        })
        app.get('/lawyer/hiring', async (req, res) => {
            try {
                const { lawyerEmail } = req.query;
                const query = { lawyerEmail };
                const result = await hiringReqCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error getting lawyer hiring requests", error: error.message });
            }
        })

        // user api operation
        app.get('/user', async (req, res) => {
            try {
                const { email } = req.query;
                const query = { email };
                const user = await userCollection.findOne(query);
                res.send(user);
            } catch (error) {
                res.status(500).send({ message: "Error getting user profile", error: error.message });
            }
        })

        app.post('/user', async (req, res) => {
            try {
                const userData = req.body;
                if (!userData.email) {
                    res.status(400).send({ message: 'Email is required' })
                }
                const query = { email: userData.email };
                const update = { $set: userData }
                const result = await userCollection.updateOne(query, update, { upsert: true });
                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error updating user profile", error: error.message });
            }
        });

        app.get('/user/hiring', async (req, res) => {
            try {
                const { userEmail } = req.query;
                const query = { userEmail };
                const result = await hiringReqCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error getting user hiring requests", error: error.message });
            }
        })
        app.post('/user/hiring', async (req, res) => {
            const { userName, userEmail, lawyerName, lawyerEmail, fee, status, createdAt } = req.body;
            const hiringData = {
                userName,
                userEmail,
                lawyerName,
                lawyerEmail,
                fee,
                status,
                createdAt
            }
            // Only block new requests if there's currently an active (unpaid) request
            const isHiringExist = await hiringReqCollection.findOne({
                userEmail,
                lawyerEmail,
                status: { $in: ['Pending', 'Accepted'] }
            });
            if (isHiringExist) {
                return res.status(200).send({ message: `You already have an active ${isHiringExist.status.toLowerCase()} request for this lawyer.` });
            }
            const result = await hiringReqCollection.insertOne(hiringData);
            res.send({ message: "Hiring request sent successfully", result });
        })

        // comment related api
        app.post('/user/comment', async (req, res) => {
            const { userEmail, lawyerEmail, lawyerName, comment, createdAt } = req.body;
            const commentData = {
                userEmail,
                lawyerEmail,
                lawyerName,
                comment,
                createdAt
            }
            const result = await commentCollection.insertOne(commentData);
            res.send({ message: "Comment sent successfully", result });
        })
        app.get('/user/comment', async (req, res) => {
            try {
                const { userEmail } = req.query;
                const query = { userEmail };
                const result = await commentCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error getting user comments", error: error.message });
            }
        })
        app.get('/lawyer/comment', async (req, res) => {
            try {
                const { lawyerEmail } = req.query;
                const query = { lawyerEmail };
                const result = await commentCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Error getting lawyer comments", error: error.message });
            }
        })
        app.patch('/user/comment/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const { comment } = req.body;
                await commentCollection.updateOne({ _id: new ObjectId(id) }, { $set: { comment } });
                res.send({ message: "Comment updated successfully" });
            } catch (error) {
                res.status(500).send({ message: "Error updating comment", error: error.message });
            }
        })
        app.delete('/user/comment/:id', async (req, res) => {
            try {
                const id = req.params.id;
                await commentCollection.deleteOne({ _id: new ObjectId(id) });
                res.send({ message: "Comment deleted successfully" });
            } catch (error) {
                res.status(500).send({ message: "Error deleting comment", error: error.message });
            }
        });

        // admin api operation

        // stripe payment api
        app.post('/payment', async (req, res) => {
            const { lawyerEmail, userName, userEmail, fee, hiringReqId, transactionId } = req.body;

            // Prevent duplicate payments for the same hiring request
            if (hiringReqId) {
                const isExist = await paymentCollection.findOne({ hiringReqId });
                if (isExist) {
                    return res.json({ msg: "Payment already processed!" });
                }
            }

            await paymentCollection.insertOne({
                lawyerEmail,
                userEmail,
                userName,
                fee,
                hiringReqId,
                transactionId,
                status: 'Paid',
                createdAt: new Date(),
            });

            // Update the hiring request status
            if (hiringReqId) {
                await hiringReqCollection.updateOne(
                    { _id: new ObjectId(hiringReqId) },
                    { $set: { status: 'Paid' } }
                );
            }

            res.send({ message: "Payment successful!" });
        })


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