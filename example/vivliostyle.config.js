// @ts-check

import { VFM } from "@vivliostyle/vfm";

import { scaleToNaturalSize } from "@u1f992/vivliostyle-util-scale-to-natural-size";

/** @type {import('@vivliostyle/cli').VivliostyleConfigSchema} */
const vivliostyleConfig = {
  title: "Principia", // populated into 'publication.json', default to 'title' of the first entry or 'name' in 'package.json'.
  author: "Isaac Newton", // default to 'author' in 'package.json' or undefined
  // language: 'la',
  // readingProgression: 'rtl', // reading progression direction, 'ltr' or 'rtl'.
  // size: 'A4',
  theme: "./css", // .css or local dir or npm package. default to undefined
  image: "ghcr.io/vivliostyle/cli:8.18.0",
  entry: [
    // **required field**
    "manuscript.md",
    // 'introduction.md', // 'title' is automatically guessed from the file (frontmatter > first heading)
    // {
    //   path: 'epigraph.md',
    //   title: 'おわりに', // title can be overwritten (entry > file),
    //   theme: '@vivliostyle/theme-whatever' // theme can be set individually. default to root 'theme'
    // },
    // 'glossary.html' // html is also acceptable
  ], // 'entry' can be 'string' or 'object' if there's only single markdown file
  // entryContext: './manuscripts', // default to '.' (relative to 'vivliostyle.config.js')
  // output: [ // path to generate draft file(s). default to '{title}.pdf'
  //   './output.pdf', // the output format will be inferred from the name.
  //   {
  //     path: './book',
  //     format: 'webpub',
  //   },
  // ],
  workspaceDir: ".vivliostyle", // directory which is saved intermediate files.
  documentProcessor: (o, m) =>
    VFM(o, m).use(scaleToNaturalSize, {
      prescale: 0.8,
      allowAbbreviation: true,
    }),
  // toc: {
  //   title: 'Table of Contents',
  //   htmlPath: 'index.html',
  //   sectionDepth: 3,
  // },
  // cover: './cover.png', // cover image. default to undefined.
  // vfm: { // options of VFM processor
  //   replace: [ // specify replace handlers to modify HTML outputs
  //     {
  //       // This handler replaces {current_time} to a current local time tag.
  //       test: /{current_time}/,
  //       match: (_, h) => {
  //         const currentTime = new Date().toLocaleString();
  //         return h('time', { datetime: currentTime }, currentTime);
  //       },
  //     },
  //   ],
  //   hardLineBreaks: true, // converts line breaks of VFM to <br> tags. default to 'false'.
  //   disableFormatHtml: true, // disables HTML formatting. default to 'false'.
  // },
};

export default vivliostyleConfig;
