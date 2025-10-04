import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import createLogoRoutes from "./routes/logo.js";
import createBannerRoutes from "./routes/banner.js";
import createBlogsRoutes from "./routes/blogs.js";
import createVideoRoutes from "./routes/videos.js";
import createAboutRoutes from "./routes/about.js";
import createqnaRoutes from "./routes/qna.js";
import createcontactRoutes from "./routes/contact.js";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔹 MongoDB Credentials
const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

console.log(user, pass);

const uri = `mongodb+srv://${user}:${pass}@cluster0.hl3zetv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// 🔹 Connect to MongoDB
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB Atlas");

    // Example Collection
    const db = client.db("elmulDB");
    // 🔹 Import and Use Routes
    const logoRoutes = (await import("./routes/logo.js")).default;
    const bannerRoutes = (await import("./routes/banner.js")).default;
    const blogsRoutes = (await import("./routes/blogs.js")).default;
    const videosRoutes = (await import("./routes/videos.js")).default;
    const aboutRoutes = (await import("./routes/about.js")).default;
    const qnaRoutes = (await import("./routes/qna.js")).default;
    const contactRoutes = (await import("./routes/contact.js")).default;

    
    app.use("/api/logo", createLogoRoutes(db));
    app.use("/api/banner", createBannerRoutes(db));
    app.use("/api/blogs", createBlogsRoutes(db));
    app.use("/api/videos", createVideoRoutes(db));
    app.use("/api/about", createAboutRoutes(db));
    app.use("/api/qna", createqnaRoutes(db));
    app.use("/api/contact", createcontactRoutes(db))
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
}
run().catch(console.dir);

// 🔹 Basic Route
app.get("/", (req, res) => {
  res.send(" Express + MongoDB Server Running...");
});

// 🔹 Start Server
app.listen(PORT, () => {
  console.log(` Server running at: http://localhost:${PORT}`);
});
