import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function createBannerRoutes(db) {
  const bannerCollection = db.collection("banner");

  // 📥 Get all banners (includes image and text fields)
  router.get("/", async (req, res) => {
    try {
      const banners = await bannerCollection.find().toArray();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch banners" });
    }
  });

  // ➕ Add new banner (with image and text fields)
  router.post("/", async (req, res) => {
    try {
      const newBanner = {
        image: req.body.image,
        heading: req.body.heading || "Default Heading", // e.g., "بسم الله الرحمن الرحيم\nWelcome to Elmufurqaan"
        subheading: req.body.subheading || "Default subheading text",
        button1Text: req.body.button1Text || "Explore Blogs",
        button1Link: req.body.button1Link || "/blogs",
        button2Text: req.body.button2Text || "Watch Videos",
        button2Link: req.body.button2Link || "/videos",
        createdAt: new Date(),
      };
      const result = await bannerCollection.insertOne(newBanner);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to add banner" });
    }
  });

  // ✏️ Update banner text by ID
  router.put("/:id", async (req, res) => {
    try {
      const bannerId = req.params.id;
      const updateData = {
        $set: {
          image: req.body.image,
          heading: req.body.heading,
          subheading: req.body.subheading,
          button1Text: req.body.button1Text,
          button1Link: req.body.button1Link,
          button2Text: req.body.button2Text,
          button2Link: req.body.button2Link,
          updatedAt: new Date(),
        },
      };
      const result = await bannerCollection.updateOne(
        { _id: new ObjectId(bannerId) },
        updateData
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json({ message: "Banner updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update banner" });
    }
  });

  // ❌ Delete banner by ID
  router.delete("/:id", async (req, res) => {
    try {
      const result = await bannerCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Banner not found" });
      }
      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete banner" });
    }
  });

  return router;
}