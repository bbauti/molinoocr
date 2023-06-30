/** @type {import('./$types').Actions} */
import { writeFile } from 'fs/promises';
import { createWorker } from 'tesseract.js';
import { convert } from 'pdf-img-convert';


async function logTesseract(file) {
    const worker = await createWorker({
        logger: (m) => console.log(m)
    });

    (async () => {
        await worker.loadLanguage('spa');
        await worker.initialize('spa');
        const {
            data: { text }
        } = await worker.recognize(file);
        await worker.terminate();
        console.log(text)
        return text
    })();
}

export const actions = {
	submit: async ({ request }) => {
        const data = await request.formData()
        for (const [key, value] of data.entries()) {
            let file = Buffer.from(await value.arrayBuffer(), 'base64')
            await writeFile(`./pdf/${value.name}`, await file)
            let image = convert(`./pdf/${value.name}`,{
                width: 2000,
                height: 2000,
                page_numbers: [1],
            })
            await writeFile(`./images/${value.name}.png`, await image)
            let text = await logTesseract(`./images/${value.name}.png`)
            return text;
          }
        return { file: image };
    },
};