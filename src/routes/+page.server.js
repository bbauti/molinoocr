/** @type {import('./$types').Actions} */
import { writeFile } from 'fs/promises';
// import { createWorker } from 'tesseract.js';
import { convert } from 'pdf-img-convert';
import { createWorker } from 'tesseract.js';
import {main} from 'magica'

const convertImage = (imageSrc) => {
    const data = atob(imageSrc.split(',')[1])
          .split('')
          .map((c) => c.charCodeAt(0));

    return new Uint8Array(data);
}

async function logTesseract(file, name) {
    const worker = await createWorker();
    await worker.loadLanguage('spa');
    await worker.initialize('spa');
    const { data: { imageGrey, imageBinary } } = await worker.recognize(file, {rotateAuto: true}, {imageGrey: true, imageBinary: true});

    console.log('Guardando foto');

    await writeFile(`./images/${name}-grey.png`, await convertImage(imageGrey)).then(console.log("guardado"))
    await writeFile(`./images/${name}-binary.png`, await convertImage(imageBinary)).then(console.log("guardado"))

    await worker.terminate();
}

async function upscale(file, name) {

    const result = await main({
        debug: true,
        command: `convert ${file} -scale 50% ${file}-upscaled.png`,
        inputFiles: [ file ]
    })
    result.outputFiles.forEach(async f => await writeFile(`./images/${f.name}`, f.content))
}

export const actions = {
	submit: async ({ request }) => {
        const data = await request.formData()
        for (const [key, value] of data.entries()) {
            let file = Buffer.from(await value.arrayBuffer(), 'base64')
            await writeFile(`./pdf/${value.name}`, await file)
            console.log("pdf guardado")
            let image = convert(`./pdf/${value.name}`,{
                page_numbers: [1],
            })
            // width: 4000,
            // height: 4000,
            await writeFile(`./images/${value.name}.png`, await image)
            console.log("foto guardada")
            upscale(`./images/${value.name}.png`, value.name)
            // logTesseract(`./images/${value.name}.png`, value.name)
            console.log("texto")
        }
        return { sucess: true };
    },
};