// @ts-check

import parseDataURL from "data-urls";
import { isElement } from "hast-util-is-element";
import { Jimp } from "jimp";
import { visit } from "unist-util-visit";
import { labelToName, decode } from "whatwg-encoding";
import { DOMParser } from "@xmldom/xmldom";

import fs from "node:fs";
import path from "node:path";
import util from "node:util";

/**
 * @param {string} content
 */
function getWidthFromSVG(content) {
  const svgDoc = new DOMParser().parseFromString(content, "text/xml");
  const svgElement = svgDoc.documentElement;

  if (!svgElement || svgElement.nodeName === "parsererror") {
    console.warn("Failed to parse SVG: No valid SVG element found.");
    return null;
  }

  if (svgElement.hasAttribute("width")) {
    const widthAttr = svgElement.getAttribute("width") || "";
    const widthValue = Number.parseFloat(widthAttr);

    if (Number.isNaN(widthValue)) {
      console.warn(`Invalid width attribute value: "${widthAttr}".`);
      return null;
    }
    return widthValue;
  }

  if (svgElement.hasAttribute("viewBox")) {
    const viewBoxString = svgElement.getAttribute("viewBox") || "";
    const viewBoxValues = viewBoxString.split(/\s+/).map(Number.parseFloat);

    if (
      viewBoxValues.length !== 4 ||
      viewBoxValues.some((val) => Number.isNaN(val))
    ) {
      console.warn(
        `Invalid viewBox attribute value: "${viewBoxString}". It must have four valid numbers.`
      );
      return null;
    }

    // viewBox: [ minX, minY, width, height ]
    const [, , width] = viewBoxValues;
    return width;
  }

  console.warn("No valid width or viewBox attribute found in SVG.");
  return null;
}

/**
 * @param {string} pathOrDataURL
 */
async function getWidthFromImage(pathOrDataURL) {
  try {
    return (await Jimp.read(pathOrDataURL)).bitmap.width;
  } catch (e) {
    console.warn(e);
    return null;
  }
}

/**
 * @typedef {{prescale?:number;allowAbbreviation?:boolean}} ScaleToNaturalSizeOptions
 */
export function scaleToNaturalSize(
  /** @type {ScaleToNaturalSizeOptions} */ { prescale, allowAbbreviation } = {}
) {
  prescale ??= 1;
  return async (
    /** @type {import("unist").Node} */ tree,
    /** @type {import("vfile").VFile|any} */ file
  ) => {
    const mdPosixStyleAbsPath = file.history.at(-1);
    if (typeof mdPosixStyleAbsPath === "undefined") {
      return;
    }
    const mdDir = path.posix.dirname(mdPosixStyleAbsPath);

    // https://github.com/syntax-tree/unist-util-visit-parents/issues/8#issuecomment-1413405543
    /** @type {import("hast").Element[]} */
    const elems = [];
    visit(tree, (elem) => {
      if (
        isElement(elem) &&
        ("dataScaleToNaturalSize" in elem.properties ||
          (allowAbbreviation && "dataNscale" in elem.properties)) &&
        "src" in elem.properties
      ) {
        elems.push(elem);
      }
    });

    for (const elem of elems) {
      /** @type {number|null} */
      let width = null;
      const srcProp = String(elem.properties["src"]);
      const parsed = parseDataURL(srcProp);
      if (parsed === null) {
        const srcPath = path.posix.join(mdDir, srcProp);
        if (path.posix.extname(srcPath).toLowerCase() === ".svg") {
          width = getWidthFromSVG(
            fs.readFileSync(srcPath, { encoding: "utf-8" })
          );
        } else {
          width = await getWidthFromImage(srcPath);
        }
      } else {
        if (parsed.mimeType.toString() === "image/svg+xml") {
          // https://github.com/jsdom/data-urls?tab=readme-ov-file#decoding-the-body
          const encodingName =
            labelToName(parsed.mimeType.parameters.get("charset") || "utf-8") ||
            "utf-8";
          const bodyDecoded = decode(parsed.body, encodingName);
          width = getWidthFromSVG(bodyDecoded);
        } else {
          width = await getWidthFromImage(srcProp);
        }
      }
      if (width === null) {
        continue;
      }

      const scaleRaw =
        allowAbbreviation && "dataNscale" in elem.properties
          ? elem.properties["dataNscale"]
          : elem.properties["dataScaleToNaturalSize"];
      if (
        typeof scaleRaw === "undefined" ||
        scaleRaw === null ||
        (typeof scaleRaw === "boolean" && !scaleRaw) ||
        Array.isArray(scaleRaw) ||
        (typeof scaleRaw === "string" &&
          scaleRaw !== "" &&
          (scaleRaw.endsWith("%")
            ? Number.isNaN(Number.parseFloat(scaleRaw.slice(0, -1)) / 100)
            : Number.isNaN(Number.parseFloat(scaleRaw))))
      ) {
        console.warn(
          `DataScaleToNaturalSizeParseError: data-scale-to-natural-size=${util.inspect(
            scaleRaw,
            { depth: null }
          )}, type:${typeof scaleRaw}`
        );
        continue;
      }
      const scale =
        prescale *
        (typeof scaleRaw === "number"
          ? scaleRaw
          : typeof scaleRaw === "string"
          ? scaleRaw === ""
            ? 1
            : scaleRaw.endsWith("%")
            ? Number.parseFloat(scaleRaw.slice(0, -1)) / 100
            : Number.parseFloat(scaleRaw)
          : 1);

      const newWidth = width * scale;
      elem.properties["width"] = newWidth;
    }
  };
}
