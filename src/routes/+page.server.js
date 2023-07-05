/** @type {import('./$types').Actions} */
import { writeFile } from 'fs/promises';
// import { createWorker } from 'tesseract.js';
import { convert } from 'pdf-img-convert';
import { createWorker } from 'tesseract.js';
import waifu2x from "waifu2x"
import Jimp from "jimp"
import sharp from 'sharp'
import path from 'path';

import { OPENAI_API_KEY } from '$env/static/private';

import { ChatGPTAPI } from 'chatgpt'

const api = new ChatGPTAPI({
    apiKey: OPENAI_API_KEY
})

const convertImage = (imageSrc) => {
    const data = atob(imageSrc.split(',')[1])
          .split('')
          .map((c) => c.charCodeAt(0));

    return new Uint8Array(data);
}

async function logTesseract(file, name) {
    console.log("inicio funcion ocr")
    const worker = await createWorker();
    await worker.loadLanguage('spa');
    await worker.initialize('spa');
    const { data: { imageBinary } } = await worker.recognize(file, {rotateAuto: true}, {imageBinary: true});

    await writeFile(`./images/${name}-binary.png`, convertImage(imageBinary))
    console.log("inicio ocr")
    const { data: { text } } = await worker.recognize(`./images/${name}-binary.png`)
    console.log("creando")
    await worker.terminate();
    console.log("fin ocr")
    let textocr = text.replace(/\n/g, ' ')

    return textocr
}

export const actions = {
	submit: async ({ request }) => {
        console.log("iniciar")
        const data = await request.formData()
        let res
        for (const [key, value] of data.entries()) {
            if (value instanceof File) {
                console.log("iniciar arch")
                let file = Buffer.from(await value.arrayBuffer(), 'base64')
                const ext = path.extname(value.name).slice(1)
                if (ext === 'pdf') {
                    console.log("pdf")
                    await writeFile(`./pdf/${value.name}`, await file)
                    let image = convert(`./pdf/${value.name}`,{
                        width: 2000,
                        height: 2000,
                        page_numbers: [1],
                    })
                    await writeFile(`./images/${value.name}.png`, await image)
                    console.log("guardado")
                } else {
                    console.log("png")
                    await writeFile(`./images/${value.name}.png`, await file)
                    console.log("guardado")
                }
                const imageedit = await sharp(`./images/${value.name}.png`).sharpen({ sigma: 2 }).gamma(3).toBuffer();
                await writeFile(`./images-edited/${value.name}-sharp.png`, await imageedit)
                console.log("sharp guardado")
                await waifu2x.upscaleImage(`./images-edited/${value.name}-sharp.png`, `./images-upscaled/${value.name}.png`, {scale: 2, upscaler: "real-esrgan"})
                console.log("upscaled")
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
                console.log("edicion")
                console.log("ocr")
                res = await logTesseract(`./images-edited/${value.name}.png`, value.name)
                console.log("terminado")
            }
        }
        return { text: res, status: 'done' };
    },
    chat: async ({ request }) => {
        const data = await request.formData();
        for (let field of data) {
        const [key, value] = field;
            data[key] = value;
        }
        let query = `Sos un asistente respetuoso, lo siguiente que te voy a mandar va a ser un CV, es decir, un curriculum vitae, donde voy a hacerte preguntas sobre el o los curriculums compartidos, y vas a tener que responderme como si fueras un asistente resposable, y confiable. Si son varios Curriculums, van a tener un separador, que es:  " <| TERMINACION DE CV |> " , al ver que hay eso, tenes que interpretar que termino un cv, y arranca otro. Voy a mandarte los cvs luego de un 'INICIO |', y, al mandarte '| FINAL', no habra mas cvs. Los curriculum que tenes que que leer son: INICIO | ${data.text} | FINAL. Ahora, viene la pregunta del usuario que va a estar luego de un ' PREGUNTA | ', que debes responder con la informacion de los cvs que te envie. Al responder, no respondas con nada que yo te haya dicho, si no, como si solamnte hubieras hablado con el usuario. Al responder, debes hacerlo usando Markdown, y que quede de una manera atractiva, usando sus espaciados, titulos, etc. Al responder, siempre debes hacerlo en español, y no simplemente dar la respuesta. Al responder, tenes que hacer la referencia sobre el nombre de la persona sobre la que es el curriculum, no referirte en si al, por ejemplo, 'primer' curriculum:  PREGUNTA | ${data.input}`
        console.log(query)
        let res
        if (data.id) {
            console.log("tiene id")
            console.log(data.id)
            res = await api.sendMessage(query, {
                parentMessageId: data.id
            })
        } else {
            console.log("no tiene id")
            res = await api.sendMessage(query)
        }
        console.log(res)
        return { answer: res.text, userinput: data.input, id: res.id  };
    },
};