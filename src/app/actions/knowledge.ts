
"use server";

export async function askKnowledgeBase(prompt: string) {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;

    console.log('--- AI Knowledge Base (HF Router API) ---');

    if (!apiKey) {
        return { success: false, error: "Clé API Hugging Face manquante (HUGGINGFACE_API_KEY)." };
    }

    try {
        const url = "https://router.huggingface.co/v1/chat/completions";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [
                    {
                        role: "system",
                        content: `Tu es un assistant expert en Chirurgie Cardiaque et Circulation Extra-Corporelle (CEC). 
Ta mission est de fournir des conseils cliniques précis, factuels et de haut niveau basés sur les derniers standards internationaux (EACTS, SCTS, AMSECT, AHA/ACC).

RÈGLES DE RÉPONSE :
1. Précision : Sois expert dans tes termes techniques.
2. Basé sur les Preuves : Base-toi sur les lignes directrices (guidelines) et la littérature scientifique récente.
3. Clarté : Structure tes réponses de manière lisible pour un clinicien dans un bloc opératoire ou en réanimation.
4. Humilité : Si une recommandation est débattue ou sujette à controverse, précise-le.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`HF Router Error Status: ${response.status}`, errorData);

            let userFriendlyError = "L'IA n'a pas pu répondre.";
            if (response.status === 401) userFriendlyError = "Clé API invalide.";
            if (response.status === 404) userFriendlyError = "Modèle non trouvé ou endpoint incorrect.";
            if (response.status === 429) userFriendlyError = "Limite de requêtes atteinte.";

            return {
                success: false,
                error: `${userFriendlyError} (${errorData.error?.message || response.statusText || response.status})`
            };
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content;

        if (!aiResponse) {
            console.error('Unexpected HF Router response format:', data);
            return { success: false, error: "Format de réponse inattendu du serveur." };
        }

        console.log('AI Response Success');
        return { success: true, data: aiResponse.trim() };

    } catch (error: any) {
        console.error('HF Router Fatal Error:', error);
        return { success: false, error: `Erreur de connexion : ${error.message || "Serveur inaccessible"}` };
    }
}

/**
 * Extracts structured training data from medical protocol text.
 * Asks the LLM to generate JSON-formatted cases.
 */
export async function extractTrainingData(docContent: string) {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;
    if (!apiKey) return { success: false, error: "Clé API manquante." };

    const prompt = `
    Rôle : Expert en extraction de données médicales pour machine learning et analyse de protocoles de CEC.
    Tâche : Analyse le protocole clinique ci-dessous. 
    
    1. IDENTIFICATION : Détermine si ce document contient des règles pour :
       - "transfusion" (seuils d'hématocrite, hgb, poids, age)
       - "perfusion" (cibles de débit, index cardiaque, BSA, température)
       - "balance" (seuils de bilan hydrique, hémofiltration, entrées/sorties)

    2. EXTRACTION : Pour CHAQUE domaine identifié, génère exactement 20 cas cliniques structurés.
    
    IMPORTANT : Diversifie les cas ! Inclus des cas extrêmes et des cas limites.

    FORMAT JSON ATTENDU :
    {
      "domains": ["transfusion", "perfusion"],
      "data": {
        "transfusion": [
          { "features": { "poids": 75, "taille": 175, "age": 65, "hematocrite": 22 }, "labels": { "transfusion": 1 } },
          ...
        ],
        "perfusion": [
          { "features": { "bsa": 1.8, "target_ci": 2.4, "temp": 34 }, "labels": { "target_flow": 4.32 } },
          ...
        ],
        "balance": [
          { "features": { "balance": 800, "duree_cec": 90 }, "labels": { "action": "monitor" } },
          { "features": { "balance": 1500, "duree_cec": 150 }, "labels": { "action": "hemofiltration" } },
          ...
        ]
      }
    }

    RÈGLE DU PROTOCOLE :
    ${docContent.substring(0, 6000)}

    Réponds UNIQUEMENT avec l'objet JSON complet, sans texte avant ou après.
    `;

    try {
        const url = "https://router.huggingface.co/v1/chat/completions";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 3000,
                temperature: 0.1
            }),
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();
        const rawJson = data.choices?.[0]?.message?.content;

        // Basic JSON cleanup (sometimes LLMs include markdown blocks)
        const cleanJson = rawJson.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(cleanJson);

        return { success: true, data: parsedData };
    } catch (error: any) {
        console.error('Data Extraction Error:', error);
        return { success: false, error: "Impossible de générer les données d'entraînement." };
    }
}
