const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7xkdi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // const database = client.db("insertDB");
    // const haiku = database.collection("haiku");
    const movieCollection = client.db("movieDB").collection("movie");
    const favoritesCollection = client.db("movieDB").collection("favorites");

    app.get("/movies", async (req, res) => {
      const cursor = movieCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/top-rated-movies", async (req, res) => {
      try {
        const topMovies = await movieCollection
          .find()
          .sort({ rating: -1 })
          .limit(6)
          .toArray();
        res.send(topMovies);
      } catch (error) {
        console.error("Error fetching top-rated movies:", error);
        res.status(500).send({ message: "Failed to fetch top-rated movies" });
      }
    });

    app.get("/movies/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const movie = await movieCollection.findOne(query);
      res.send(movie);
    });

    app.get("/favorites", async (req, res) => {
      const { email } = req.query;

      const result = await favoritesCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });
    // add new movie
    app.post("/movies", async (req, res) => {
      const newMovie = req.body;
      console.log("Adding new movie", newMovie);
      const result = await movieCollection.insertOne(newMovie);
      res.send(result);
    });
    app.post("/favorites", async (req, res) => {
      const favorite = req.body;
      const result = await favoritesCollection.insertOne(favorite);
      res.send(result);
    });
   

    app.put("/movies/:id", async (req, res) => {
      const { id } = req.params;
      const updatedMovie = req.body;

      try {
        const result = await movieCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedMovie }
        );
        res.send({ modifiedCount: result.modifiedCount });
      } catch (error) {
        console.error("Error updating movie:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });



    app.delete("/movies/:id", async (req, res) => {
      const id = req.params.id;
      
      try{
        const movieResult = await movieCollection.deleteOne({ _id: new ObjectId(id)});
        const favoritesResult = await favoritesCollection.deleteOne({ movieId: id});

        if (movieResult.deletedCount > 0) {
          res.send({
            success: true,
            message: 'Movie deleted successfully',
            deletedMovie: movieResult,
            deletedFavorites: favoritesResult,
          })
        }else{
          res.status(404).send({ success: false, message: 'Movie not found'});

        }
      } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(404).send({ success: false, message: 'Failed to delete movie'});

        
      }
    });

    app.delete('/favorites/:id', async (req, res) => {
      const {id} = req.params;
      const result = await favoritesCollection.deleteOne({_id: new ObjectId(id)});
      res.json(result);
     

    });
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Movie Portal server is running");
});

app.listen(port, () => {
  console.log(`server is running in port: ${port}`);
});
