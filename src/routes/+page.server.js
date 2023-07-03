/** @type {import('./$types').Actions} */
import { writeFile } from 'fs/promises';
// import { createWorker } from 'tesseract.js';
import { convert } from 'pdf-img-convert';
import { createWorker } from 'tesseract.js';
import waifu2x from "waifu2x"
import Jimp from "jimp"
import sharp from 'sharp'
import path from 'path';

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
    const { data: { imageBinary } } = await worker.recognize(file, {rotateAuto: true}, {imageBinary: true});

    await writeFile(`./images/${name}-binary.png`, convertImage(imageBinary))

    const { data: { text } } = await worker.recognize(`./images/${name}-binary.png`)

    await worker.terminate();

    let textocr = text.replace(/\n/g, ' ')

    return textocr
}


export const actions = {
	submit: async ({ request }) => {
        console.log('inicio submit')
        const data = await request.formData()
        let res
        for (const [key, value] of data.entries()) {
            if (value instanceof File) {
                let file = Buffer.from(await value.arrayBuffer(), 'base64')
                const ext = path.extname(value.name).slice(1)
                if (ext === 'pdf') {
                    await writeFile(`./pdf/${value.name}`, await file)
                    let image = convert(`./pdf/${value.name}`,{
                        width: 2000,
                        height: 2000,
                        page_numbers: [1],
                    })
                    await writeFile(`./images/${value.name}.png`, await image)
                } else {
                    await writeFile(`./images/${value.name}.png`, await file)
                }
                const imageedit = await sharp(`./images/${value.name}.png`).sharpen({ sigma: 2 }).gamma(3).toBuffer();
                await writeFile(`./images-edited/${value.name}-sharp.png`, await imageedit)
                await waifu2x.upscaleImage(`./images-edited/${value.name}-sharp.png`, `./images-upscaled/${value.name}.png`, {scale: 2, upscaler: "real-esrgan"})
                Jimp.read(`./images-upscaled/${value.name}.png`)
                .then((upscaled) => {
                    return upscaled
                    .quality(100) 
                    .greyscale() 
                    .write(`./images-edited/${value.name}.png`); // save
                })
                .catch((err) => {
                    console.error(err);
                });
                res = await logTesseract(`./images-edited/${value.name}.png`, value.name)
            }
        }
        console.log('fin submit')
        return { text: res, status: 'done' };
    },
    chat: async ({ request }) => {
        const data = await request.formData();
        for (let field of data) {
        const [key, value] = field;
            data[key] = value;
            console.log(value)
        }
        console.log(data)
        let query = `Sos un asistente respetuoso, lo siguiente que te voy a mandar va a ser un CV, es decir, un curriculum vitae, donde voy a hacerte preguntas sobre el o los curriculums compartidos, y vas a tener que responderme como si fueras un asistente resposable, y confiable. Si son varios Curriculums, van a tener un separador, que es:  <| TERMINACION DE CV |> , al ver que hay eso, tenes que interpretar que termino un cv, y arranca otro. Voy a mandarte los cvs luego de un 'INICIO |', y, al mandarte '| FINAL', no habra mas cvs. Lo que tenes que leer es: INICIO | ${data.text} | FINAL. Ahora, viene la pregunta del usuario que va a estar luego de un ' PREGUNTA | ', que debes responder con la informacion de los cvs que te envie. Al responder, no respondas con nada que yo te haya dicho, si no, como si solamnte hubieras hablado con el usuario:  PREGUNTA | ${data.input}`
        console.log(query)
        let answer='god'
        return { answer: answer };
    },
};