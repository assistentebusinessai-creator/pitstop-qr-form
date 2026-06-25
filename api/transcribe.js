import OpenAI, { toFile } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { audioBase64, mimeType } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "Audio mancante" });
    }

    const buffer = Buffer.from(audioBase64, "base64");

    const file = await toFile(buffer, "voce-officina.webm", {
      type: mimeType || "audio/webm",
    });

    const transcription = await client.audio.transcriptions.create({
      model: "gpt-4o-mini-transcribe",
      file,
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
        error: err.message,
        dettaglio: err,
      });
    }
}