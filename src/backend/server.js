import express from "express";
import cors from "cors";
import pkg from "aws-jwt-verifier";
const { JwtVerifier } = pkg;

// ---- Firebase Project Number ----
const FIREBASE_PROJECT_NUMBER = "579116463043";

const issuer = `https://fpnv.googleapis.com/projects/${FIREBASE_PROJECT_NUMBER}`;
const audience = `https://fpnv.googleapis.com/projects/${FIREBASE_PROJECT_NUMBER}`;
const jwksUri = "https://fpnv.googleapis.com/v1beta/jwks";

// Create verifier instance
const fpnvVerifier = JwtVerifier.create({
  issuer,
  audience,
  jwksUri,
});

const app = express();
app.use(cors());
app.use(express.json());

// ---- Verify Token API ----
app.post("/verifiedPhoneNumber", async (req, res) => {
  const token = req.body?.token;

  if (!token) {
    return res.status(400).json({ error: "Missing token in request body" });
  }

  try {
    const verifiedPayload = await fpnvVerifier.verify(token);
    const verifiedPhoneNumber = verifiedPayload.sub;

    console.log("Verified phone number:", verifiedPhoneNumber);

    return res.status(200).json({
      success: true,
      verifiedPhoneNumber,
    });
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(400).json({ error: "Invalid token" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
