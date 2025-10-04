import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function createcontactRoutes(db) {
  const contactCollection = db.collection("contact");

  // GET all contacts (with pagination and sorting)
  router.get("/", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const contacts = await contactCollection
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await contactCollection.countDocuments();

      res.json({
        contacts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // GET single contact by ID
  router.get("/:id", async (req, res) => {
    try {
      const contactId = req.params.id;

      if (!ObjectId.isValid(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }

      const contact = await contactCollection.findOne({
        _id: new ObjectId(contactId),
      });

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  // POST - Create new contact
  router.post("/", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      // Validation
      const errors = {};
      if (!name || !name.trim()) {
        errors.name = "Name is required";
      }
      if (!email || !email.trim()) {
        errors.email = "Email is required";
      } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.email = "Invalid email format";
      }
      if (!subject || !subject.trim()) {
        errors.subject = "Subject is required";
      }
      if (!message || !message.trim()) {
        errors.message = "Message is required";
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      // Create contact object
      const newContact = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        status: "unread", // unread, read, replied
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await contactCollection.insertOne(newContact);

      res.status(201).json({
        message: "Contact message sent successfully",
        contactId: result.insertedId,
      });
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to send contact message" });
    }
  });

  // PUT - Update contact (mark as read/replied or edit)
  router.put("/:id", async (req, res) => {
    try {
      const contactId = req.params.id;

      if (!ObjectId.isValid(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }

      const { name, email, subject, message, status } = req.body;

      const updateFields = {
        updatedAt: new Date(),
      };

      // Update only provided fields
      if (name && name.trim()) updateFields.name = name.trim();
      if (email && email.trim()) {
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          return res.status(400).json({ error: "Invalid email format" });
        }
        updateFields.email = email.trim().toLowerCase();
      }
      if (subject && subject.trim()) updateFields.subject = subject.trim();
      if (message && message.trim()) updateFields.message = message.trim();
      if (status && ["unread", "read", "replied"].includes(status)) {
        updateFields.status = status;
      }

      const result = await contactCollection.updateOne(
        { _id: new ObjectId(contactId) },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({ message: "Contact updated successfully" });
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  // PATCH - Update contact status only (quick update)
  router.patch("/:id/status", async (req, res) => {
    try {
      const contactId = req.params.id;
      const { status } = req.body;

      if (!ObjectId.isValid(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }

      if (!status || !["unread", "read", "replied"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Invalid status. Must be: unread, read, or replied" });
      }

      const result = await contactCollection.updateOne(
        { _id: new ObjectId(contactId) },
        {
          $set: {
            status: status,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({ message: "Contact status updated successfully" });
    } catch (error) {
      console.error("Error updating contact status:", error);
      res.status(500).json({ error: "Failed to update contact status" });
    }
  });

  // DELETE - Delete contact by ID
  router.delete("/:id", async (req, res) => {
    try {
      const contactId = req.params.id;

      if (!ObjectId.isValid(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }

      const result = await contactCollection.deleteOne({
        _id: new ObjectId(contactId),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // DELETE - Delete multiple contacts
  router.delete("/", async (req, res) => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Contact IDs array is required" });
      }

      // Validate all IDs
      const validIds = ids.filter((id) => ObjectId.isValid(id));
      if (validIds.length === 0) {
        return res.status(400).json({ error: "No valid contact IDs provided" });
      }

      const objectIds = validIds.map((id) => new ObjectId(id));

      const result = await contactCollection.deleteMany({
        _id: { $in: objectIds },
      });

      res.json({
        message: "Contacts deleted successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting contacts:", error);
      res.status(500).json({ error: "Failed to delete contacts" });
    }
  });

  // GET - Search contacts
  router.get("/search/:query", async (req, res) => {
    try {
      const query = req.params.query;

      if (!query || query.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "Search query must be at least 2 characters" });
      }

      const searchRegex = new RegExp(query, "i");

      const contacts = await contactCollection
        .find({
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { subject: searchRegex },
            { message: searchRegex },
          ],
        })
        .sort({ createdAt: -1 })
        .toArray();

      res.json({
        contacts,
        count: contacts.length,
      });
    } catch (error) {
      console.error("Error searching contacts:", error);
      res.status(500).json({ error: "Failed to search contacts" });
    }
  });

  // GET - Get contacts by status
  router.get("/status/:status", async (req, res) => {
    try {
      const status = req.params.status;

      if (!["unread", "read", "replied"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Invalid status. Must be: unread, read, or replied" });
      }

      const contacts = await contactCollection
        .find({ status: status })
        .sort({ createdAt: -1 })
        .toArray();

      res.json({
        contacts,
        count: contacts.length,
      });
    } catch (error) {
      console.error("Error fetching contacts by status:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  return router;
}