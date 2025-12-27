
"use server";

export async function askKnowledgeBase(prompt: string) {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;
    const modelId = process.env.HF_MODEL_ID || "meta-llama/Llama-3.1-8B-Instruct";

    console.log(`--- AI Knowledge Base (Model: ${modelId}) ---`);

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
                model: modelId,
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

/**
 * Robust JSON extraction from LLM output
 */
function tryExtractJson(text: string) {
    try {
        // First try standard cleaning
        const clean = text.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        // Fallback: search for first { and last }
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            try {
                const inner = text.substring(start, end + 1);
                return JSON.parse(inner);
            } catch (e2) {
                console.error("Failed to parse extracted JSON block", e2);
                throw e2;
            }
        }
        throw e;
    }
}

/**
 * Validates clinical report data for inconsistencies or abnormal values.
 */
export async function validateReport(formData: any) {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;
    const modelId = process.env.HF_MODEL_ID || "meta-llama/Llama-3.1-8B-Instruct";

    if (!apiKey) return { success: false, error: "Clé API manquante." };

    const prompt = `
    Rôle : Expert en Chirurgie Cardiaque et CEC.
    Tâche : Analyse les données du compte rendu opératoire suivant et identifie toute incohérence clinique, valeur hors normes ou risque potentiel.
    
    DONNÉES DU RAPPORT :
    ${JSON.stringify(formData, null, 2)}

    RÈGLES D'ANALYSE :
    1. Vérifie la concordance entre les gaz du sang (pH, pO2, pCO2, Lactates).
    2. Vérifie si le débit de pompe est adapté à la surface corporelle (BSA).
    3. Identifie les déséquilibres de la balance hydrique.
    4. Signale toute anomalie flagrante (Ex: Température < 20°C ou > 39°C, pH < 7.20, etc.).

    FORMAT DE RÉPONSE ATTENDU (JSON UNIQUEMENT) :
    {
      "alerts": [
        { "type": "warning" | "error" | "info", "message": "Description concise de l'alerte" }
      ],
      "summary": "Résumé global de la cohérence clinique"
    }

    Si tout est cohérent, renvoie une liste d'alertes vide.
    Réponds IMPÉRATIVEMENT UNIQUEMENT avec l'objet JSON, sans aucun texte introductif ou conclusif ("Voici le JSON", etc.). Le non-respect de cette consigne rendra la réponse inutilisable. JSON UNIQUEMENT.
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
                model: modelId,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1500,
                temperature: 0.1
            }),
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();
        const rawJson = data.choices?.[0]?.message?.content;
        const parsed = tryExtractJson(rawJson);

        return { success: true, data: parsed };
    } catch (error: any) {
        console.error('Report Validation Error:', error);
        return { success: false, error: "Erreur lors de l'analyse IA." };
    }
}

/**
 * Generates a professional clinical conclusion based on report data.
 */
export async function generateObservations(formData: any) {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;
    const modelId = process.env.HF_MODEL_ID || "meta-llama/Llama-3.1-8B-Instruct";

    if (!apiKey) return { success: false, error: "Clé API manquante." };

    const prompt = `
    Rôle : Perfusionniste expert.
    Tâche : Rédige une conclusion professionnelle et structurée (Observations) pour un compte rendu de CEC à partir des données fournies.
    
    DONNÉES :
    ${JSON.stringify(formData, null, 2)}

    CONSIGNES :
    1. Sois synthétique et factuel.
    2. Mentionne les points clés (Durées, Température, Protection myocardique, Bilan entrées/sorties).
    3. Utilise un ton médical approprié.
    4. Réponds UNIQUEMENT avec le texte des observations.
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
                model: modelId,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1000,
                temperature: 0.3
            }),
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content;

        return { success: true, data: aiResponse.trim() };
    } catch (error: any) {
        console.error('Observations Generation Error:', error);
        return { success: false, error: "Erreur lors de la génération des observations." };
    }
}

/**
 * Analyzes multiple reports to provide global dashboard insights.
 */
export async function getDashboardInsights(reports: any[]) {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN;
    const modelId = process.env.HF_MODEL_ID || "meta-llama/Llama-3.1-8B-Instruct";

    if (!apiKey) return { success: false, error: "Clé API manquante." };

    // Simplify reports to keep the prompt manageable
    const simplifiedReports = reports.slice(0, 10).map(r => ({
        id: r.id,
        date: r.date_cec,
        intervention: r.intervention,
        duree_cec: r.duree_cec,
        duree_clampage: r.duree_clampage,
        bloodGasesCount: r.bloodGases?.length || 0,
        age: r.age,
        poids: r.poids
    }));

    const prompt = `
    Rôle : Consultant expert en Qualité et Sécurité en Chirurgie Cardiaque (Standards EACTS/AMSECT).
    Tâche : Analyse cet échantillon de rapports récents et génère des "Insights" stratégiques pour le service.
    
    DONNÉES (10 derniers cas) :
    ${JSON.stringify(simplifiedReports, null, 2)}

    INSIGHTS RECHERCHÉS :
    1. TENDANCE : Evolution des temps ou complexité.
    2. RISQUE SYSTEMIQUE : Anomalies récurrentes ou oublis potentiels.
    3. SUGGESTION : Améliorer un protocole spécifique.

    FORMAT DE RÉPONSE ATTENDU (JSON UNIQUEMENT) :
    {
      "insights": [
        { 
          "category": "Performance" | "Sécurité" | "Protocole", 
          "level": "info" | "warning" | "success",
          "title": "Titre court",
          "content": "Description détaillée de l'insight" 
        }
      ]
    }
    Si tout est cohérent, renvoie une liste d'insights vide.
    Réponds IMPÉRATIVEMENT UNIQUEMENT avec l'objet JSON, sans aucun texte introductif ou conclusif ("Voici les insights", etc.). Le non-respect de cette consigne rendra la réponse inutilisable. JSON UNIQUEMENT.
    `;

    try {
        if (!reports || reports.length === 0) {
            return { success: false, error: "Aucune donnée disponible pour l'analyse." };
        }

        const url = "https://router.huggingface.co/v1/chat/completions";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: modelId,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1500,
                temperature: 0.1
            }),
        });

        if (!response.ok) {
            if (response.status === 429) return { success: false, error: "Quota IA atteint (429). Réessayez plus tard." };
            if (response.status === 401) return { success: false, error: "Erreur d'authentification IA (401)." };
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        const rawJson = data.choices?.[0]?.message?.content;

        if (!rawJson) return { success: false, error: "L'IA a renvoyé une réponse vide." };

        try {
            const parsed = tryExtractJson(rawJson);
            return { success: true, data: parsed };
        } catch (parseError) {
            console.error("Dashboard Insights Parsing Error:", parseError, "Raw content:", rawJson);
            return { success: false, error: "Format de réponse IA invalide. Réessayez." };
        }
    } catch (error: any) {
        console.error('Dashboard Insights Error:', error);
        return { success: false, error: `Erreur d'analyse : ${error.message || "Serveur inaccessible"}` };
    }
}
