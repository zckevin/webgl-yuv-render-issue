const YUVCanvas = require('yuv-canvas');
const YUVBuffer = require('yuv-buffer');

import yuvFile from "./yuv-file.js";

const canvasId = "YUVCanvas";
var canvas = document.getElementById(canvasId);
if (!canvas) {
    throw new Error("No Canvas with id " + canvasId + "!");
}

// force YUVCanvas using WebGLFrameSink instead of SoftwareFrameSink which is 2D canvas
const yuv = YUVCanvas.attach(canvas, {
    webGL: true,
});

const format = YUVBuffer.format({
    width: yuvFile.width,
    height: yuvFile.height,
    chromaWidth: yuvFile.width / 2,
    chromaHeight: yuvFile.height / 2,
});
const frame = YUVBuffer.frame(format);

fetch(yuvFile.url).then(resp => {
    return resp.arrayBuffer();
}).then(arrayBuffer => {
    const arr = new Uint8Array(arrayBuffer);
    frame.y.bytes = arr.slice(0, yuvFile.uOffset);
    frame.u.bytes = arr.slice(yuvFile.uOffset, yuvFile.uOffset + yuvFile.vOffset);
    frame.v.bytes = arr.slice(yuvFile.uOffset + yuvFile.vOffset, arr.length);
    yuv.drawFrame(frame);
});