import express from "express";

const router = express.Router();

export default function createLogoRoutes(db) {
  const logoCollection = db.collection("logo");

  router.get("/", async(req, res) => {
    try {
        const logo = await logoCollection.findOne({});
        if (!logo) return res.status(404).json({ error: "Logo not found" });
        res.json(logo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logo" });
    }
  });

  router.post("/", async(req, res) => {
    try {
        const newLogo = req.body;
        
        // Delete all existing logos first
        await logoCollection.deleteMany({});
        
        // Insert the new logo
        const result = await logoCollection.insertOne(newLogo);
        
        res.status(201).json({ 
          success: true, 
          message: "Logo saved successfully",
          data: result 
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: "Failed to create logo" });
    }
  });

  return router;
}