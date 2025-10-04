import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function createVideoRoutes(db) {
  const videoCollection = db.collection("video");

  //  Get all videos
  router.get("/", async (req, res) => {
    try {
      const videos = await videoCollection.find().sort({ createdAt: -1 }).toArray();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  //  Add new video
  router.post("/", async (req, res) => {
    try {
      const { title, description, thumbnail, videoUrl, tags } = req.body;
      
      // Basic validation
      if (!title || !description || !thumbnail || !videoUrl) {
        return res.status(400).json({ error: "Title, description, thumbnail, and video URL are required" });
      }

      const newVideo = {
        title,
        description,
        thumbnail,
        videoUrl,
        tags: tags || [], // Expect array of strings
        createdAt: new Date(),
      };

      const result = await videoCollection.insertOne(newVideo);
      res.status(201).json({ insertedId: result.insertedId });
    } catch (error) {
      console.error("Error adding video:", error);
      res.status(500).json({ error: "Failed to add video" });
    }
  });

  //  Update video by ID
  router.put("/:id", async (req, res) => {
    try {
      const videoId = req.params.id;
      const updateData = {
        $set: {
          title: req.body.title,
          description: req.body.description,
          thumbnail: req.body.thumbnail,
          videoUrl: req.body.videoUrl,
          tags: req.body.tags || [],
          updatedAt: new Date(),
        },
      };

      const result = await videoCollection.updateOne(
        { _id: new ObjectId(videoId) },
        updateData
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json({ message: "Video updated successfully" });
    } catch (error) {
      console.error("Error updating video:", error);
      res.status(500).json({ error: "Failed to update video" });
    }
  });

  //  Get single video by ID (for details/edit)
  router.get("/:id", async (req, res) => {
    try {
      const videoId = req.params.id;
      const video = await videoCollection.findOne({ _id: new ObjectId(videoId) });
      
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  //  Delete video by ID
  router.delete("/:id", async (req, res) => {
    try {
      const videoId = req.params.id;
      const result = await videoCollection.deleteOne({ _id: new ObjectId(videoId) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  return router;
}