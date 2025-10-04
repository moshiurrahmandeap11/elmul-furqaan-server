import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function createAboutRoutes(db) {
  const aboutCollection = db.collection("about");

  // 📥 Get about us content (sections array)
  router.get("/", async (req, res) => {
    try {
        const result = await aboutCollection.find().toArray();
        res.send(result)
    } catch  {
      console.error("Error fetching about us:", error);
    }
  });



  return router;
}