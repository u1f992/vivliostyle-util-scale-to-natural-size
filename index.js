// @ts-check

import { isElement } from "hast-util-is-element";
import { Jimp } from "jimp";
import { visit } from "unist-util-visit";

import path from "node:path";
import util from "node:util";

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
      const srcProp = String(elem.properties["src"]);
      const srcPath = srcProp.startsWith("data:image/")
        ? srcProp
        : path.posix.join(mdDir, srcProp);
      let width = 0;
      try {
        width = (await Jimp.read(srcPath)).bitmap.width;
      } catch (e) {
        console.warn(e);
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
