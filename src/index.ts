import express, { Request, Response, Application } from 'express';
import multer from "multer";
import compareImages from "./imgService";

const app: Application = express();
const PORT: number = 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 10MB por imagen (ajusta si quieres)
});

app.post(
  "/compare",
  upload.fields([
    { name: "img1", maxCount: 1 },
    { name: "img2", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

      const f1 = files?.img1?.[0];
      const f2 = files?.img2?.[0];

      if (!f1 || !f2) {
        return res.status(400).json({ error: "Debes enviar img1 y img2 como archivos (multipart/form-data)." });
      }
      const result = await compareImages(f1, f2);

        if (!result.ok) return res.status(500).json(result);

        return res.json({ distance: result.distance });
    } catch (e: any) {
      return res.status(500).json({ error: "Error interno", details: e?.message ?? String(e) });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});