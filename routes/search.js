import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

export default function createSearchRoutes(db) {
  const blogsCollection = db.collection("blogs");
  const videoCollection = db.collection("video");
  const qnaCollection = db.collection("qna");

  // Language mapping for better search
  const languageMapping = {
    // English to other languages
    'prayer': ['সালাত', 'الصلاة'],
    'quran': ['কুরআন', 'القرآن'],
    'hadith': ['হাদিস', 'الحديث'],
    'islam': ['ইসলাম', 'الإسلام'],
    'allah': ['আল্লাহ', 'الله'],
    'prophet': ['নবী', 'النبي'],
    'fasting': ['রোজা', 'الصوم'],
    'charity': ['যাকাত', 'الزكاة'],
    'pilgrimage': ['হজ্জ', 'الحج'],
    
    // Bengali to other languages
    'সালাত': ['prayer', 'الصلاة'],
    'কুরআন': ['quran', 'القرآن'],
    'হাদিস': ['hadith', 'الحديث'],
    'ইসলাম': ['islam', 'الإسلام'],
    'আল্লাহ': ['allah', 'الله'],
    'নবী': ['prophet', 'النبي'],
    'রোজা': ['fasting', 'الصوم'],
    'যাকাত': ['charity', 'الزكاة'],
    'হজ্জ': ['pilgrimage', 'الحج'],
    
    // Arabic to other languages
    'الصلاة': ['prayer', 'সালাত'],
    'القرآن': ['quran', 'কুরআন'],
    'الحديث': ['hadith', 'হাদিস'],
    'الإسلام': ['islam', 'ইসলাম'],
    'الله': ['allah', 'আল্লাহ'],
    'النبي': ['prophet', 'নবী'],
    'الصوم': ['fasting', 'রোজা'],
    'الزكاة': ['charity', 'যাকাত'],
    'الحج': ['pilgrimage', 'হজ্জ']
  };

  // =====================
  //  Enhanced Global Search
  // =====================
  router.get("/", async (req, res) => {
    try {
      const { q: searchTerm, type } = req.query;
      
      if (!searchTerm || searchTerm.trim() === "") {
        return res.status(400).json({ error: "Search term is required" });
      }

      const trimmedTerm = searchTerm.trim();
      
      // Get related terms in other languages
      const relatedTerms = languageMapping[trimmedTerm.toLowerCase()] || [];
      const allSearchTerms = [trimmedTerm, ...relatedTerms];
      
      // Create search queries for all terms
      const searchQueries = allSearchTerms.map(term => ({
        $or: [
          { title: new RegExp(term, "iu") },
          { content: new RegExp(term, "iu") },
          { description: new RegExp(term, "iu") },
          { question: new RegExp(term, "iu") },
          { answer: new RegExp(term, "iu") },
          { tags: new RegExp(term, "iu") },
          { "tags_multi.en": new RegExp(term, "iu") },
          { "tags_multi.bn": new RegExp(term, "iu") },
          { "tags_multi.ar": new RegExp(term, "iu") }
        ]
      }));

      const results = {};

      // Search in blogs
      if (!type || type === "blogs") {
        const blogResults = await blogsCollection.find({
          $or: searchQueries
        }).toArray();
        results.blogs = blogResults;
      }

      // Search in videos
      if (!type || type === "videos") {
        const videoResults = await videoCollection.find({
          $or: searchQueries
        }).toArray();
        results.videos = videoResults;
      }

      // Search in Q&A
      if (!type || type === "qna") {
        const qnaResults = await qnaCollection.find({
          $or: searchQueries
        }).toArray();
        results.qna = qnaResults;
      }

      res.json({
        searchTerm: trimmedTerm,
        relatedTerms,
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