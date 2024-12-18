const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://rakibulrupom2001:iZC4jk9qq0e1qHaw@cluster0.ocbyg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let dbConnection;

const connectDB = async () => {
  try {
    await client.connect();

    const userDatabase = client.db("usersDB");
    const userCollection = userDatabase.collection("users");

    app.get("/users", async (req, res) => {
      if (!dbConnection) {
        return res.status(500).json({ error: "Database not connected!" });
      }
      const users = userCollection.find();
      const result = await users.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      if (!dbConnection) {
        return res.status(500).json({ error: "Database not connected!" });
      }

      const user = req.body;
      console.log("new user", user);
      const result = await userCollection.insertOne({ user });
      res.send(result);
    });

    const messageDatabase = client.db("messageDB");
    const messageCollection = messageDatabase.collection("messages");

    app.get("/messages", async (req, res) => {
      if (!dbConnection) {
        return res.status(500).json({ error: "Database not connected!" });
      }
      const messages = messageCollection.find();
      const result = await messages.toArray();
      res.send(result);
    });

    app.post("/messages", async (req, res) => {
      if (!dbConnection) {
        return res.status(500).json({ error: "Database not connected!" });
      }

      const message = req.body;
      console.log("new message", message);
      const result = await messageCollection.insertOne({ message });
      res.send(result);
    });

    const replyDatabase = client.db("replyDB");
    const replyCollection = replyDatabase.collection("replies");

    app.get("/replies/:messageId", async (req, res) => {
      const { messageId } = req.params;

      try {
        const replies = await replyCollection.find({ messageId }).toArray();
        res.json(replies);
      } catch (error) {
        console.error("Error fetching replies:", error);
        res.status(500).json({ error: "Failed to fetch replies." });
      }
    });

    app.get("/replies", async (req, res) => {
      try {
        const replies = await replyCollection.find({}).toArray();
        res.json(replies);
      } catch (error) {
        console.error("Error fetching all replies:", error);
        res.status(500).json({ error: "Error fetching replies" });
      }
    });

    app.post("/replies", async (req, res) => {
      if (!dbConnection) {
        return res.status(500).json({ error: "Database not connected!" });
      }

      const { messageId, reply, date } = req.body;

      try {
        const result = await replyCollection.insertOne({
          messageId,
          reply,
          date,
        });
        res.json({ success: true, result });
      } catch (error) {
        console.error("Error saving reply:", error);
        res.json({ success: false, error: "Failed to save reply." });
      }
    });

    app.get("/sent-replies/:email", async (req, res) => {
      const { email } = req.params;

      try {
        const messages = await messageCollection
          .find({ "message.sender": email })
          .toArray();

        const messageIds = messages.map((message) => message._id.toString());

        const replies = await replyCollection
          .find({ messageId: { $in: messageIds } })
          .toArray();

        res.json(replies);
      } catch (error) {
        console.error("Error fetching replies for the sender:", error);
        res.status(500).json({ error: "Failed to fetch replies." });
      }
    });

    dbConnection = client.db("garmentconnect");
    console.log("Connected to MongoDB and selected 'garmentconnect' database.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

app.get("/", (req, res) => {
  res.send("API is running...");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
