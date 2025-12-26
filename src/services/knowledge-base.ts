
import { openDB, IDBPDatabase } from 'idb';

export interface KnowledgeDocument {
    id: string;
    name: string;
    content: string;
    type: 'pdf' | 'text' | 'markdown';
    addedAt: number;
}

const DB_NAME = 'cecpilot-knowledge';
const STORE_NAME = 'documents';

export class KnowledgeBaseService {
    private db: Promise<IDBPDatabase>;

    constructor() {
        this.db = openDB(DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            },
        });
    }

    async addDocument(name: string, content: string, type: KnowledgeDocument['type'] = 'text'): Promise<KnowledgeDocument> {
        const id = Math.random().toString(36).substring(7);
        const doc: KnowledgeDocument = {
            id,
            name,
            content,
            type,
            addedAt: Date.now()
        };

        const db = await this.db;
        await db.put(STORE_NAME, doc);
        return doc;
    }

    async getDocuments(): Promise<KnowledgeDocument[]> {
        const db = await this.db;
        return db.getAll(STORE_NAME);
    }

    async deleteDocument(id: string): Promise<void> {
        const db = await this.db;
        await db.delete(STORE_NAME, id);
    }

    /**
     * Finds the most relevant snippets for a query.
     * For now, this is a simple keyword-based search.
     * We can improve this with embeddings later.
     */
    async findRelevantContext(query: string, limit: number = 8): Promise<string> {
        const docs = await this.getDocuments();
        if (docs.length === 0) return "";

        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const normalizedQuery = normalize(query);
        const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length >= 3);

        let allExcerpts: { text: string; score: number; docName: string }[] = [];

        for (const doc of docs) {
            const normalizedContent = normalize(doc.content);
            // Multi-level chunking: split by paragraphs, but if any is too long, split further or use sliding window
            const rawChunks = doc.content.split(/\n+/);
            const normalizedRawChunks = normalizedContent.split(/\n+/);

            // Create overlapping chunks of ~500 chars if content is dense
            for (let i = 0; i < rawChunks.length; i++) {
                const chunk = rawChunks[i].trim();
                const normChunk = normalizedRawChunks[i].trim();

                if (chunk.length < 15) continue;

                let score = 0;
                let matches = 0;
                for (const term of queryTerms) {
                    if (normChunk.includes(term)) {
                        score += 3;
                        matches++;
                    }
                }

                // Bonus for matching multiple distinct query terms
                if (matches > 1) score += matches * 2;

                if (score > 0) {
                    allExcerpts.push({ text: chunk, score, docName: doc.name });
                }
            }

            // If the document is very long and has few newlines, use a simple window
            if (rawChunks.length < 5 && doc.content.length > 1000) {
                const words = doc.content.split(/\s+/);
                const normWords = normalizedContent.split(/\s+/);
                const windowSize = 50;
                const step = 25;

                for (let i = 0; i < words.length; i += step) {
                    const window = words.slice(i, i + windowSize).join(" ");
                    const normWindow = normWords.slice(i, i + windowSize).join(" ");

                    let score = 0;
                    for (const term of queryTerms) {
                        if (normWindow.includes(term)) score += 1;
                    }
                    if (score >= 2) {
                        allExcerpts.push({ text: window, score: score * 2, docName: doc.name });
                    }
                }
            }
        }

        if (allExcerpts.length === 0) {
            return docs
                .sort((a, b) => b.addedAt - a.addedAt)
                .slice(0, 2)
                .map(d => `[Dernier Document: ${d.name}]\n${d.content.substring(0, 1500)}...`)
                .join("\n\n---\n\n");
        }

        // De-duplicate and sort
        return allExcerpts
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(e => `[DOCUMENT SOURCE: ${e.docName}]\nEXTRAIT: ${e.text}`)
            .join("\n\n---\n\n");
    }
}

export const knowledgeBaseService = new KnowledgeBaseService();
