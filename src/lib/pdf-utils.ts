export async function extractTextFromPdf(file: File): Promise<string> {
    // Force usage of the legacy build which is more compatible with bundlers
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');

    // Configure worker locally if not already set
    if (typeof window !== 'undefined') {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.legacy.js';
    }

    const arrayBuffer = await file.arrayBuffer();

    // In legacy mode, we pass the data directly
    const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
    });

    try {
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error('Error during PDF extraction:', error);
        throw error;
    }
}
