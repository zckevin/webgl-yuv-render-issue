import yuvFile from "./yuv-file.js";
import WebGLPlayer from "./wasm-video-player-webgl.js";

const canvasId = "WasmVideoPlayer";
var canvas = document.getElementById(canvasId);
if (!canvas) {
    throw new Error("No Canvas with id " + canvasId + "!");
}
const webglPlayer = new WebGLPlayer(canvas, {
    preserveDrawingBuffer: false
});

fetch(yuvFile.url).then(resp => {
    return resp.arrayBuffer();
}).then(arrayBuffer => {
    const data = new Uint8Array(arrayBuffer);
    webglPlayer.renderFrame(
        data,
        yuvFile.width,
        yuvFile.height,
        yuvFile.uOffset,
        yuvFile.vOffset
    );
});
