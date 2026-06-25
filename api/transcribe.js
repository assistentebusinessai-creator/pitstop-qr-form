import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      return res.status(400).json({ error: "File audio mancante" });
    }

    const transcription = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file: fs.createReadStream(audioFile.filepath),
      language: "it",
      prompt:
        "Trascrivi un vocale di un meccanico italiano che sta compilando un form officina. Può contenere nome, cognome, telefono, email, targa, marca, modello, km, indirizzo e descrizione del problema. Mantieni email, targhe e numeri nel modo più preciso possibile. Non inventare dati mancanti.",
    });

    return res.status(200).json({
      testo: transcription.text || "",
    });
  } catch (err) {
    console.error("Errore trascrizione:", err);

    return res.status(500).json({
      error: err.message || "Errore trascrizione audio",
    });
  }
}