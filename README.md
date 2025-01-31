# vivliostyle-util-scale-to-natural-size

> 一般的に DTP ソフトでは、画像のプリントサイズ（画素数 ×dpi で求められる物理寸法）を 100%として、パーセンテージで指定します。
>
> それに対して CSS で%指定といえば、親要素を 100%とした指定です。もしくは物理寸法のミリやインチなどの指定になります。
>
> （中略）
>
> DTP 的（というか IT 書的？）には、本来の画像サイズを保って次のように貼りたいのです。
>
> ―― [CSS 組版と画像のサイズ指定 – リブロワークス – LibroWorks](https://libroworks.co.jp/?p=8277)

One of the main challenges in CSS typesetting is how to scale raster images. In book publishing, it's often preferable to keep images at a consistent ratio relative to their original size, as long as the page layout allows. However, CSS's relative sizing is based on the parent element rather than the image's intrinsic dimensions (which JavaScript may refer to as [`naturalWidth`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/naturalWidth) and [`naturalHeight`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/naturalHeight)). Manually specifying absolute `width` and `height` values for every image is impractical, creating an opportunity for JavaScript to step in.

This [unified](https://unifiedjs.com/) plugin targets HTML elements that have both the `data-scale-to-natural-size` attribute and a `src` attribute. It loads the referenced images and embeds absolute `width` attributes based on the images' natural sizes. Additionally, the `prescale: number` option lets you set a common scaling factor for all images in the document, simplifying the process.

```
data-scale-to-natural-size = <number> | <percentage>

![](emoji_u1f992.png){data-scale-to-natural-size=30%}

![](emoji_u1f992.png){data-scale-to-natural-size=0.2}

![](data:image/png;base64,iVBORw0KG ... ){data-scale-to-natural-size}
```
