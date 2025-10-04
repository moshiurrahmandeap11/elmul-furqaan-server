import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function createqnaRoutes(db) {
  const qnaCollection = db.collection("qna");

  //  Get all Q&A (sorted by createdAt descending)
  router.get("/", async (req, res) => {
    try {
      const qnas = await qnaCollection.find().sort({ createdAt: -1 }).toArray();
      res.json(qnas);
    } catch (error) {
      console.error("Error fetching Q&A:", error);
      res.status(500).json({ error: "Failed to fetch Q&A" });
    }
  });

  //  Add new Q&A (user submits question, admin adds answer later)
  router.post("/", async (req, res) => {
    try {
      const { question, userName, userEmail, userIp } = req.body; // Optional user info
      
      // Basic validation
      if (!question || !question.trim()) {
        return res.status(400).json({ error: "Question is required" });
      }

      const newQna = {
        question: question.trim(),
        answer: null, // Initially no answer
        userName: userName || "Anonymous",
        userEmail: userEmail || null,
        userIp: userIp || "Unknown",
        createdAt: new Date(),
        updatedAt: null, // Set when admin replies
      };

      const result = await qnaCollection.insertOne(newQna);
      res.status(201).json({ message: "Question submitted successfully", insertedId: result.insertedId });
    } catch (error) {
      console.error("Error adding Q&A:", error);
      res.status(500).json({ error: "Failed to submit question" });
    }
  });

  //  Update Q&A (admin replies/updates answer)
  router.put("/:id", async (req, res) => {
    try {
      const qnaId = req.params.id;
      const { answer, question } = req.body; // Allow optional question edit

      if (!answer || !answer.trim()) {
        return res.status(400).json({ error: "Answer is required" });
      }

      const updateFields = {
        answer: answer.trim(),
        updatedAt: new Date(),
      };
      if (question && question.trim()) {
        updateFields.question = question.trim();
      }

      const result = await qnaCollection.updateOne(
        { _id: new ObjectId(qnaId) },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Q&A not found" });
      }

      res.json({ message: "Q&A updated successfully" });
    } catch (error) {
      console.error("Error updating Q&A:", error);
      res.status(500).json({ error: "Failed to update Q&A" });
    }
  });

  //  Delete Q&A by ID
  router.delete("/:id", async (req, res) => {
    try {
      const qnaId = req.params.id;
      const result = await qnaCollection.deleteOne({ _id: new ObjectId(qnaId) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Q&A not found" });
      }
      
      res.json({ message: "Q&A deleted successfully" });
    } catch (error) {
      console.error("Error deleting Q&A:", error);
      res.status(500).json({ error: "Failed to delete Q&A" });
    }
  });

  //  Get single Q&A by ID (for edit/view)
  router.get("/:id", async (req, res) => {
    try {
      const qnaId = req.params.id;
      const qna = await qnaCollection.findOne({ _id: new ObjectId(qnaId) });
      
      if (!qna) {
        return res.status(404).json({ error: "Q&A not found" });
      }
      
      res.json(qna);
    } catch (error) {
      console.error("Error fetching Q&A:", error);
      res.status(500).json({ error: "Failed to fetch Q&A" });
    }
  });

  return router;
}