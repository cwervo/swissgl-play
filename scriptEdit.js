document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('c');
    const glsl = SwissGL(canvas);

    const PARAMS = {
        worldExtent: 15,
        repulsion: 2.0,
        inertia: 0.1,
        dt: 0.1
    };

    const pane = new Tweakpane.Pane();
    pane.addInput(PARAMS, 'dt', { min: 0, max: 0.5, step: 0.01 });
    pane.addInput(PARAMS, 'repulsion', { min: 0, max: 10, step: 0.1 });
    pane.addInput(PARAMS, 'worldExtent', { min: 10, max: 50, step: 0.1 });
    pane.addInput(PARAMS, 'inertia', { min: 0, max: 1, step: 0.01 });

    const K = 6;
    const F = glsl({ K, FP: `
        float(I.x==I.y) + 0.1*float(I.x==(I.y+1)%int(K))`},
        { size: [K, K], format: 'r16f', tag: 'F' });
    const points = glsl({}, { size: [30, 10], story: 3, format: 'rgba32f', tag: 'points' });

    for (let i = 0; i < 2; ++i) {
        glsl({K, seed: 123, FP: `
            vec2 pos = (hash(ivec3(I, seed)).xy-0.5)*10.0;
            float color = floor(UV.x*K);
            FOut = vec4(pos, 0.0, color);`},
            points);
    }

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function render(t) {
        t /= 1000;

        const { worldExtent, repulsion, inertia, dt } = PARAMS;

        glsl({ K, worldExtent, points: points[0], Grid: points[0].size, Aspect: 'fit', Blend: 'd*(1-sa)+s*sa', VP: `vec4 d = points(ID.xy); varying vec3 color = cos((d.w/K+vec3(0,0.33,0.66))*TAU)*0.5+0.5; VPos.xy = 2.0*(d.xy+XY/8.0)/worldExtent;`, FP: `color, smoothstep(1.0, 0.6, length(XY))` });

        glsl({ F, worldExtent, repulsion, inertia, dt, past: points[1], FP: `vec3 wrap(vec3 p) { return (fract(p/worldExtent+0.5)-0.5)*worldExtent; } void fragment() { FOut = Src(I); vec3 force = vec3(0); for (int y = 0; y < ViewSize.y; ++y) for (int x = 0; x < ViewSize.x; ++x) { vec4 data1 = Src(ivec2(x,y)); vec3 dpos = wrap(data1.xyz - FOut.xyz); float r = length(dpos); if (r > 3.0) continue; dpos /= r + 1e-8; float rep = max(1.0 - r, 0.0) * repulsion; float f = F(ivec2(FOut.w, data1.w)).x; float inter = f * max(1.0 - abs(r - 2.0), 0.0); force += dpos * (inter - rep); } vec3 vel = wrap(FOut.xyz - past(I).xyz) * pow(inertia, dt); FOut.xyz = wrap(FOut.xyz + vel + 0.5 * force * (dt * dt)); }` }, points);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});
