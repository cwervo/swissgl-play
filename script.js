const STEP = 2;

// load basic gradient code if step is 0 in a switch statement
switch (STEP) {
    case 0:
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

        function render(t) {
                t /= 1000; // ms to sec
                glsl({t, // pass uniform 't' to GLSL
                    Mesh:[10, 10],  // draw a 10x10 tessellated plane mesh
                    // Vertex shader expression returns vec4 vertex position in
                    // WebGL clip space. 'XY' and 'UV' are vec2 input vertex 
                    // coordinates in [-1,1] and [0,1] ranges.
                    // VP:`XY*0.8+sin(t+XY.yx*2.0)*0.2,0,1`,
                    VP:`XY,0,1`,
                    // Fragment shader returns 'RGBA'
                    FP:`UV*0.8+sin(t*5.+XY.yx*2.0)*0.2,0.5,1`});
                requestAnimationFrame(render);
            }

        requestAnimationFrame(render);

        });
        break;
    case 1:
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

            // Create WebGL2 context and SwissGL 
            const glsl = SwissGL(canvas);

            function render(t) {
                t /= 1000; // ms to sec
                glsl({
                    t, // Pass uniform 't' to GLSL
                    Mesh: [50, 50],  // Draw a 50x50 tessellated plane mesh
                    // Vertex shader expression returns vec4 vertex position in
                    // WebGL clip space. 'XY' and 'UV' are vec2 input vertex 
                    // coordinates in [-1,1] and [0,1] ranges.
                    VP: `XY, 0, 1`, 
                    // Fragment shader returns 'RGBA'
                    FP: `
                    #ifdef GL_ES
                    precision highp float;
                    #endif

                    uniform vec2 iResolution;

                    float sdfSphere(vec3 p, float r) {
                        return length(p) - r;
                    }

                    vec3 sdfGradient(vec3 p) {
                        const float eps = 0.001;
                        return normalize(vec3(
                            sdfSphere(p + vec3(eps, 0.0, 0.0), 0.5) - sdfSphere(p - vec3(eps, 0.0, 0.0), 0.5),
                            sdfSphere(p + vec3(0.0, eps, 0.0), 0.5) - sdfSphere(p - vec3(0.0, eps, 0.0), 0.5),
                            sdfSphere(p + vec3(0.0, 0.0, eps), 0.5) - sdfSphere(p - vec3(0.0, 0.0, eps), 0.5)
                        ));
                    }

                    void fragment() {
                        vec2 uv = gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0;
                        uv.x *= iResolution.x / iResolution.y; // Correct aspect ratio

                        vec3 p = vec3(uv, 0.0); // Use uv instead of XY
                        float radius = 0.5 * min(iResolution.x, iResolution.y) / max(iResolution.x, iResolution.y) - sin(t * 0.5); // Adjust radius
                        float sdfDist = sdfSphere(p, radius);
                        vec3 color = mix(vec3(1.0, 0.6, 0.4), vec3(0.2), sdfDist);
                        FOut = vec4(color, 1.0);
                    }`,
                    iResolution: [canvas.width, canvas.height]
                });
                requestAnimationFrame(render);
            }
            requestAnimationFrame(render);
            });
            break;
    case 2:
        // ===== Add Tweakpane for sphere radius =====
        const pane = new Tweakpane.Pane();
        const PARAMS = {
            sphereRadius: 0.5
        };
        pane.addInput(
            PARAMS, 'sphereRadius',
            {min: -10, max: 10, step: 0.01}
        );

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

            // Create WebGL2 context and SwissGL 
            const glsl = SwissGL(canvas);

            function render(t) {
                t /= 1000; // ms to sec
                glsl({
                    t, // Pass uniform 't' to GLSL
                    Mesh: [50, 50],  // Draw a 50x50 tessellated plane mesh
                    // Vertex shader expression returns vec4 vertex position in
                    // WebGL clip space. 'XY' and 'UV' are vec2 input vertex 
                    // coordinates in [-1,1] and [0,1] ranges.
                    VP: `XY, 0, 1`, 
                    // Fragment shader returns 'RGBA'
                    FP: `
                    #ifdef GL_ES
                    precision highp float;
                    #endif

                    uniform vec2 iResolution;

                    float sdfSphere(vec3 p, float r) {
                        return length(p) - r;
                    }

                    vec3 sdfGradient(vec3 p) {
                        const float eps = 0.001;
                        return normalize(vec3(
                            sdfSphere(p + vec3(eps, 0.0, 0.0), 0.5) - sdfSphere(p - vec3(eps, 0.0, 0.0), 0.5),
                            sdfSphere(p + vec3(0.0, eps, 0.0), 0.5) - sdfSphere(p - vec3(0.0, eps, 0.0), 0.5),
                            sdfSphere(p + vec3(0.0, 0.0, eps), 0.5) - sdfSphere(p - vec3(0.0, 0.0, eps), 0.5)
                        ));
                    }

                    void fragment() {
                        vec2 uv = gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0;
                        uv.x *= iResolution.x / iResolution.y; // Correct aspect ratio

                        vec3 p = vec3(uv, 0.0); // Use uv instead of XY
                        float radius = sphereRadius * min(iResolution.x, iResolution.y) / max(iResolution.x, iResolution.y) - sin(t * 0.5); // Adjust radius
                        float sdfDist = sdfSphere(p, radius);
                        vec3 color = mix(vec3(1.0, 0.6, 0.4), vec3(0.2), sdfDist);
                        FOut = vec4(color, 1.0);
                    }`,
                    iResolution: [canvas.width, canvas.height],
                    sphereRadius: PARAMS.sphereRadius
                });
                requestAnimationFrame(render);
            }
            requestAnimationFrame(render);
            });
    default:
        console.log('Doing nothing?')
        break;
}
