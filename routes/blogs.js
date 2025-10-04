import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function createBlogsRoutes(db) {
  const blogsCollection = db.collection("blogs");

  // =====================
  //  GET all blogs
  // =====================
  router.get("/", async (req, res) => {
    try {
      const blogs = await blogsCollection.find().toArray();
      res.json(blogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch blogs" });
    }
  });

  // =====================
  //  GET single blog by ID
  // =====================
  router.get("/:id", async (req, res) => {
    try {
      const blog = await blogsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (!blog) return res.status(404).json({ error: "Blog not found" });
      res.json(blog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch blog" });
    }
  });

  // =====================
  //  POST create new blog
  // =====================
  router.post("/", async (req, res) => {
    try {
      const newBlog = req.body; // { title, content, author, tags, createdAt }
      newBlog.createdAt = new Date(); // auto timestamp
      const result = await blogsCollection.insertOne(newBlog);
      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create blog" });
    }
  });

  // =====================
  //  PUT update blog by ID
  // =====================
  router.put("/:id", async (req, res) => {
    try {
      const updatedBlog = req.body;
      const result = await blogsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updatedBlog }
      );
      if (result.matchedCount === 0)
        return res.status(404).json({ error: "Blog not found" });
      res.json({ message: "Blog updated successfully", result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update blog" });
    }
  });

  // =====================
  //  DELETE blog by ID
  // =====================
  router.delete("/:id", async (req, res) => {
    try {
      const result = await blogsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      if (result.deletedCount === 0)
        return res.status(404).json({ error: "Blog not found" });
      res.json({ message: "Blog deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete blog" });
    }
  });

  return router;
}
