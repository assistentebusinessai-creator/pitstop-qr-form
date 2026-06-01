import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const { testo } = req.body || {};

  if (!testo) {
    return res.status(400).json({ error: "Testo mancante" });
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Estrai i dati da una frase detta da un meccanico.

Rispondi SOLO con JSON valido, senza testo extra.

Formato obbligatorio:
{
  "nome": "",
  "cognome": "",
  "telefono": "",
  "marca": "",
  "modello": "",
  "targa": "",
  "problema": "",
  "via": "",
  "cap": "",
  "localita": "",
  "provincia": "",
  "email": "",
  "cf_piva": "",
  "km": "",
  "data_immatricolazione": ""
}

Regole:
- Non inventare dati mancanti.
- Se un dato non è presente, lascia stringa vuota.
- "marca" deve contenere solo la marca se chiara.
- "via" deve contenere solo l'indirizzo se detto.
- "cap" deve contenere solo il CAP se detto.
- "provincia" deve contenere solo la sigla provincia (es. TO, MI, RM).
- "email" deve contenere solo l'indirizzo email se detto.
- "cf_piva" deve contenere solo codice fiscale o partita IVA se detti.
- "km" deve contenere solo il numero dei chilometri se detto.
- "data_immatricolazione" deve contenere la data di immatricolazione se detta.
- - Se senti parole come "immatricolata", "immatricolazione", "data immatricolazione", devi compilare SEMPRE "data_immatricolazione".
- Esempi:
  "immatricolata 2018" → "data_immatricolazione": "2018"
  "immatricolata maggio 2018" → "data_immatricolazione": "05/2018"
  "immatricolata il primo maggio 2018" → "data_immatricolazione": "1/5/2018"
- "localita" deve contenere la città/località se detta.
- Esempi:
  "a Torino" → "localita": "TORINO"
  "di Rivoli" → "localita": "RIVOLI"
  "cliente di Moncalieri" → "localita": "MONCALIERI"
- "modello" deve contenere modello/cilindrata se presenti.
- "problema" deve contenere solo il lavoro o problema richiesto.
- "km" deve contenere solo il numero dei chilometri se detto.
- Targa in maiuscolo senza spazi.`
        },
        { role: "user", content: testo }
      ],
      temperature: 0.1,
    });

    const raw = response.choices?.[0]?.message?.content?.trim();
    const parsed = JSON.parse(raw);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Errore estrai-form:", err);
    return res.status(500).json({ error: "Errore estrazione dati" });
  }
}