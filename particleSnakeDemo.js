const pane = new Tweakpane.Pane();

const PARAMS = {
    worldSize: 15,
    repulsion: 2.0,
    inertia: 0.1,
    dt: 0.1
};

pane.addInput(
    PARAMS, 'dt',
    {min: 0, max: 0.5, step: 0.01}
);

pane.addInput(
    PARAMS, 'repulsion',
    {min: 0, max: 10, step: 0.1}
);
 
pane.addInput(
    PARAMS, 'inertia',
    {min: 0, max: 1, step: 0.01}
);

// `min` and `max`: slider
pane.addInput(
  PARAMS, 'worldSize',
  {min: 10, max: 50, step: 0.1}
);

// ====== Reizing code =====

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('c');
    if (canvas) {
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        // Initial resize
        resizeCanvas();

        // Resize canvas when the window is resized
        window.addEventListener('resize', resizeCanvas);
    }

// ===== Begin SwissGL code =====

// create WebGL2 context end SwissGL 
const glsl = SwissGL(canvas);

const K = 6; // number of particle types
const F = glsl({K, FP:
    `float(I.x==I.y) + 0.1*float(I.x==(I.y+1)%int(K))`},
    {size:[K,K], format:'r16f', tag:'F'});

const points = glsl({}, {size:[30,30], story:3, format:'rgba32f', tag:'points'});
for (let i=0; i<2; ++i) {
    glsl({K, seed:123, FP:`
        vec2 pos = (hash(ivec3(I, seed)).xy-0.5)*10.0;
        float color = floor(UV.x*K);
        FOut = vec4(pos, 0.0, color);`},
        points);
}

function render(t) {
    t /= 1000; // ms to sec

    var {worldSize, repulsion, inertia, dt} = PARAMS;
    glsl({K, worldSize, // uniforms
        // reading the last state of 'points' texture
        points: points[0],
        // render a quad instance for every 'points' texel
        Grid: points[0].size,
        // preserve the scale of xy-axes by fitting
        // [-1..1]x[-1..1] box into the view
        Aspect:'fit', 
        // blend primitives using alpha transparency
        Blend: 'd*(1-sa)+s*sa', 
        // vertex shader that defines where to draw
        // the quad primitives
        VP:`
        // fetch the current particle data
        vec4 d = points(ID.xy);
        // populate color varying to use in fragment shader
        varying vec3 color = cos((d.w/K+vec3(0,0.33,0.66))*TAU)*0.5+0.5;
        // set the clip-space vertex position, 'vec2 XY' contains
        // coordinates of the quad vertex in -1..1 range
        VPos.xy = 2.0*(d.xy+XY/8.0)/worldSize;`, 
        // Set the the fragment color and transparency 
        // depending on the distance from the quad center.
        // Interpolated XY values are also available 
        // in the fragment shader.
        FP:`color, smoothstep(1.0, 0.6, length(XY))`});
        // 'target' argument is omitted, so rendering to canvas

        glsl({F, worldSize, repulsion, inertia, dt, // uniforms
            // The current state of the system is implicitly
            // available to the shader as 'Src' uniform if
            // the target has history (is an array of textures).
            // Here we explicitly pass the state one step at the past
            past:points[1], FP:`
      // this function wraps positions and velocities to
      // [-worldSize/2, worldSize/2] range
      vec3 wrap(vec3 p) {
          return (fract(p/worldSize+0.5)-0.5)*worldSize;
      }
      void fragment() {
          // read the current particle state
          FOut = Src(I);
          vec3 force=vec3(0); // force accumulator
          // iterate over particles
          for (int y=0; y<ViewSize.y; ++y)
          for (int x=0; x<ViewSize.x; ++x) {
              // reading the state of another particle
              vec4 data1 = Src(ivec2(x,y));
              vec3 dpos = wrap(data1.xyz-FOut.xyz);
              // calculate distance
              float r = length(dpos);
              if (r>3.0) continue;
              dpos /= r+1e-8;
              // calculate repulsion and interaction forces
              float rep = max(1.0-r, 0.0)*repulsion;
              float f = F(ivec2(FOut.w, data1.w)).x;
              float inter = f*max(1.0-abs(r-2.0), 0.0);
              force += dpos*(inter-rep);
          }
          // fetch the past state to compute velocity
          vec3 vel = wrap(FOut.xyz-past(I).xyz)*pow(inertia, dt);
          // update particle position
          FOut.xyz = wrap(FOut.xyz+vel+0.5*force*(dt*dt));
      }
      `}, points);  // using 'points' as the target

    requestAnimationFrame(render);
}

requestAnimationFrame(render);

});
