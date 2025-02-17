const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 30125;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const serverName = req.params.servername;
    const folderPath = path.join(__dirname, "uploads", serverName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, req.params.imageName || file.originalname);
  },
});

const upload = multer({ storage });

app.post("/createimage/:servername/:imageName", upload.single("image"), (req, res) => {
  res.status(201).json({ message: "Image enregistrée avec succès !" });
});

app.get("/getimage/:servername/:imageName", (req, res) => {
  const { servername, imageName } = req.params;
  const imagePath = path.join(__dirname, "uploads", servername, imageName);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: "Image introuvable" });
  }
});

app.get("/getimages/:servername", (req, res) => {
  const { servername } = req.params;
  const folderPath = path.join(__dirname, "uploads", servername);

  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath);
    const fileUrls = files.map((file) => ({
      fileName: file,
      url: `http://localhost:${port}/getimage/${servername}/${file}`,
    }));
    res.status(200).json({ files: fileUrls });
  } else {
    res.status(404).json({ error: "Aucun fichier trouvé pour ce serveur." });
  }
});

app.post("/upload/:servername/:outfitId", upload.single("files[]"), (req, res) => {
    const { servername, outfitId } = req.params;
  
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu." });
    }
  
    const folderPath = path.join(__dirname, "uploads", servername);
    const newFileName = `outfit_${outfitId}.jpg`;
  
    fs.mkdirSync(folderPath, { recursive: true });
  
    const oldPath = req.file.path;
    const newPath = path.join(folderPath, newFileName);
  
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        return res.status(500).json({ error: "Impossible de renommer l'image." });
      }
  
      res.status(201).json({
        message: "Image uploadée avec succès !",
        fileUrl: `http://localhost:${port}/getimage/${servername}/${newFileName}`,
      });
    });
  });
  

app.delete("/deleteimage/:servername/:imageName", (req, res) => {
  const { servername, imageName } = req.params;
  const imagePath = path.join(__dirname, "uploads", servername, imageName);

  if (fs.existsSync(imagePath)) {  
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Erreur lors de la suppression :", err);
        return res.status(500).json({ error: "Erreur lors de la suppression de l'image." });
      }
      res.status(200).json({ message: "Image supprimée avec succès !" });
    });
  } else {  
    res.status(404).json({ error: "Image introuvable." });
  }
});


app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});
