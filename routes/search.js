import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function createSearchRoutes(db) {
  const blogsCollection = db.collection("blogs");
  const videoCollection = db.collection("video");
  const qnaCollection = db.collection("qna");

  // =====================
  //  Global Search
  // =====================
  router.get("/", async (req, res) => {
    try {
      const { q: searchTerm, type } = req.query;
      
      if (!searchTerm || searchTerm.trim() === "") {
        return res.status(400).json({ error: "Search term is required" });
      }

      const searchRegex = new RegExp(searchTerm.trim(), "i");
      const results = {};

      // Search in blogs
      if (!type || type === "blogs") {
        const blogResults = await blogsCollection.find({
          $or: [
            { title: searchRegex },
            { content: searchRegex },
            { tags: searchRegex }
          ]
        }).toArray();
        results.blogs = blogResults;
      }

      // Search in videos
      if (!type || type === "videos") {
        const videoResults = await videoCollection.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { tags: searchRegex }
          ]
        }).toArray();
        results.videos = videoResults;
      }

      // Search in Q&A
      if (!type || type === "qna") {
        const qnaResults = await qnaCollection.find({
          $or: [
            { question: searchRegex },
            { answer: searchRegex }
          ]
        }).toArray();
        results.qna = qnaResults;
      }

      res.json({
        searchTerm: searchTerm.trim(),
        results,
        totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
      });

    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  return router;
}