function Texture(gl) {
    this.gl = gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

Texture.prototype.bind = function (n, program, name) {
    var gl = this.gl;
    gl.activeTexture([gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2][n]);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(program, name), n);
};

Texture.prototype.fill = function (width, height, data) {
    var gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
};

export default function WebGLPlayer(canvas, options) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    this.initGL(options);
}

WebGLPlayer.prototype.initGL = function (options) {
    if (!this.gl) {
        console.log("[ER] WebGL not supported.");
        return;
    }

    var gl = this.gl;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    var program = gl.createProgram();
    var vertexShaderSource = [
        "attribute mediump vec4 aVertexPosition;",
        "attribute vec2 aTextureCoord;",
        "varying highp vec2 vTextureCoord;",
        "void main(void) {",
        " gl_Position = aVertexPosition;",
        " vTextureCoord = aTextureCoord;",
        "}"
    ].join("\n");
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    var fragmentShaderSource = [
        "precision mediump float;",
        "varying lowp vec2 vTextureCoord;",
        "uniform sampler2D YTexture;",
        "uniform sampler2D UTexture;",
        "uniform sampler2D VTexture;",
        "const vec3 offset = vec3(-0.0627451017, -0.501960814, -0.501960814);",
        "const mat3 YUV2RGB = mat3",
        "(",
        " 1.1644,  1.1644,   1.1644,",
        " -0.0000, -0.2132,   2.1124,",
        " 1.7927, -0.5330,   0.000",
        ");",
        "void main(void) {",
        " mediump vec3 yuv;",
        " lowp vec3 rgb;",
        " yuv.x = texture2D(YTexture, vTextureCoord).r;",
        " yuv.y = texture2D(UTexture, vTextureCoord).r;",
        " yuv.z = texture2D(VTexture, vTextureCoord).r;",
        " yuv += offset;",
        " rgb = YUV2RGB * yuv;",
        " gl_FragColor = vec4(rgb, 1);",
        "}"
    ].join("\n");

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("[ER] Shader link failed.");
    }
    var vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    var textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
    gl.enableVertexAttribArray(textureCoordAttribute);

    var verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    gl.y = new Texture(gl);
    gl.u = new Texture(gl);
    gl.v = new Texture(gl);
    gl.y.bind(0, program, "YTexture");
    gl.u.bind(1, program, "UTexture");
    gl.v.bind(2, program, "VTexture");
}

WebGLPlayer.prototype.renderFrame = function (videoFrame, width, height, uOffset, vOffset) {
    if (!this.gl) {
        console.log("[ER] Render frame failed due to WebGL not supported.");
        return;
    }

    var gl = this.gl;
    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    gl.y.fill(width, height, videoFrame.subarray(0, uOffset));
    gl.u.fill(width >> 1, height >> 1, videoFrame.subarray(uOffset, uOffset + vOffset));
    gl.v.fill(width >> 1, height >> 1, videoFrame.subarray(uOffset + vOffset, videoFrame.length));

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

WebGLPlayer.prototype.fullscreen = function () {
	  var canvas = this.canvas;
    if (canvas.RequestFullScreen) {
        canvas.RequestFullScreen();
    } else if (canvas.webkitRequestFullScreen) {
        canvas.webkitRequestFullScreen();
    } else if (canvas.mozRequestFullScreen) {
        canvas.mozRequestFullScreen();
    } else if (canvas.msRequestFullscreen) {
        canvas.msRequestFullscreen();
    } else {
        alert("This browser doesn't supporter fullscreen");
    }
};

WebGLPlayer.prototype.exitfullscreen = function (){
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else {
        alert("Exit fullscreen doesn't work");
    }
}
