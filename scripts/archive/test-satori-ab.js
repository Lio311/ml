const satori = require('satori').default || require('satori');
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');

async function main() {
    // 1. Get font
    const fontData = fs.readFileSync('../../../../public/fonts/Narkiss Block Regular.ttf');

    // 2. Fetch the actual Weserv image
    const res = await fetch('https://images.weserv.nl/?url=fimgs.net%2Fmdimg%2Fperfume-thumbs%2Fdark-375x500.102896.avif&w=640&q=80&output=jpg');
    const imgBuf = await res.arrayBuffer();

    console.log('Image buffer size:', imgBuf.byteLength);

    // 3. Render with width: 'auto'
    const svg1 = await satori(
        {
            type: 'div',
            props: {
                style: { display: 'flex', width: 600, height: 600, background: 'white' },
                children: [
                    {
                        type: 'img',
                        props: {
                            src: imgBuf,
                            style: { height: 280, width: 'auto' }
                        }
                    }
                ]
            }
        },
        {
            width: 600,
            height: 600,
            fonts: [{ name: 'Font', data: fontData }]
        }
    );

    fs.writeFileSync('test1.svg', svg1);

    // 4. Render with width: 210
    const svg2 = await satori(
        {
            type: 'div',
            props: {
                style: { display: 'flex', width: 600, height: 600, background: 'white' },
                children: [
                    {
                        type: 'img',
                        props: {
                            src: imgBuf,
                            style: { height: 280, width: 210 }
                        }
                    }
                ]
            }
        },
        {
            width: 600,
            height: 600,
            fonts: [{ name: 'Font', data: fontData }]
        }
    );

    fs.writeFileSync('test2.svg', svg2);
}

main().catch(console.error);
