var images = ["hat_2"]; //"monk", "Sea",
var imNum = 0;
// onclick = () => {
//   imNum++;
//   imNum = imNum % images.length;
//   document.body.innerHTML = "";
//   init();
// };

init();
async function init() {
  var img = new Image();
  img.src = images[imNum] + ".png";
  await new Promise((r) => (img.onload = r));

  var depth = new Image();
  depth.src = images[imNum] + "_depth.png";
  await new Promise((r) => (depth.onload = r));

  var back = new Image();
  back.src = images[imNum] + "_back.png";
  await new Promise((r) => (back.onload = r));

  var norm = new Image();
  norm.src = images[imNum] + "_normal.png";
  await new Promise((r) => (norm.onload = r));

  var canvas = document.createElement("canvas");
  canvas.height = img.height;
  canvas.width = img.width;
  canvas.style.display = "block";

  document.body.style.margin = "0";
  //document.body.style.background = "green";

  Object.assign(canvas.style, {
    margin: "auto",
    width: "100vw",
    height: "100vh",
    objectFit: "contain",
    display: "block",
  });

  var gl = canvas.getContext("webgl");
  document.body.appendChild(canvas);

  var vertices = [-1, -1, -1, 1, 1, -1, 1, 1];

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  var vshader = `
    attribute vec2 pos;
    varying vec2 vpos;

    void main() {
        vpos = pos*-0.5 + vec2(0.5);
        gl_Position = vec4(pos, 0.0, 1.0);
    }
    `;

  var vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vshader);
  gl.compileShader(vs);

  var message = gl.getShaderInfoLog(vs);

  if (message.length > 0) {
    /* message may be an error or a warning */
    throw message;
  }

  var fshader = `
    precision highp float;
    uniform sampler2D img;
    uniform sampler2D depth;
    uniform sampler2D back;
    uniform sampler2D norm;

    uniform vec2 mouse;

    

    varying vec2 vpos;
    
    void main() {
      


        float scale = 0.02;
        float dp = -0.5 + texture2D(depth, vpos).x;
        dp = clamp(dp, -.01, 1.) - 0.2;

        vec3 normal = texture2D(norm, vpos + mouse * scale * dp).xyz;
        normal = normalize(normal);
        vec3 light_dir = normalize(vec3(0.25*vec2(mouse.x + 1., 1.*(mouse.y + 0.75) + 0.4) + 0.5*vec2(.5), 1.));
        float diff = max(dot(normal, light_dir), 0.0);
        diff *= diff;    
        diff *= diff;

        diff = max(diff, .95);

        
        
        vec4 col = texture2D(img, vpos + mouse * scale * dp);

        vec3 rgb = col.rgb;
        vec3 light = vec3(diff) * vec3(.78, .78, .75) + vec3(.15);

        gl_FragColor = vec4(rgb*light, col.a);
        
        if(gl_FragColor.a < 0.25)
        {
          gl_FragColor = texture2D(back, vpos + mouse * scale * 0.5);
        }
      
        //gl_FragColor = vec4(light, 1.);
        
        gl_FragColor.a = 1.;
        
    }
  `;

  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fshader);
  gl.compileShader(fs);

  var program = gl.createProgram();
  gl.attachShader(program, fs);
  gl.attachShader(program, vs);
  gl.linkProgram(program);
  gl.useProgram(program);

  function setTexture(im, name, num) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + num);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    gl.uniform1i(gl.getUniformLocation(program, name), num);
  }

  setTexture(img, "img", 0);
  setTexture(depth, "depth", 1);
  setTexture(back, "back", 2);
  setTexture(norm, "norm", 3);

  loop();

  function loop() {
    gl.clearColor(0.25, 0.65, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(loop);
  }

  var mouseLoc = gl.getUniformLocation(program, "mouse");

  canvas.addEventListener("mousemove", (evt) => {
    var rect = canvas.getBoundingClientRect();

    var mpos = [
      -0.5 + (evt.clientX - rect.left) / rect.width,
      -(-0.5 + (evt.clientY - rect.top) / rect.height),
    ];
    gl.uniform2fv(mouseLoc, new Float32Array(mpos));
  });
}
