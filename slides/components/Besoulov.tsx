import { observe, tilia } from "@tilia/react";
import * as React from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeKernel, randomBelousov } from "../functional/belousov";
import { Cellular } from "../functional/cellular";
import { SettingsView } from "./lib/SettingsView";

const cellular = randomBelousov(400, 400);

const settings = tilia({
  live: {
    Du: 0.49, // Diffusion rate for u (activator)
    Dv: 0.03, // Diffusion rate for v (inhibitor)
    f: 0.035, // Feed rate
    k: 0.06, // Kill rate
    dt: 0.1, // Time step
  },
});

const range = {
  live: {
    Du: [0, 1, 0.001],
    Dv: [0, 1, 0.001],
    f: [0, 1, 0.001],
    k: [0, 1, 0.001],
    dt: [0, 1, 0.001],
  },
};

type Range = Record<string, number[]>;

observe(settings, ({ live }) => {
  // live changes
  cellular.step = makeKernel(live);
});

export function Besoulov() {
  const domElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domElem.current) return;
    const scene = setupScene(domElem.current);
    const sim = displayPoints(scene);
    scene.start(sim.step);

    setTimeout(() => {
      clickAction(sim, cellular);
    }, 100);

    // Cleanup on unmount
    return () => {
      sim.cleanup();
      scene.cleanup();
    };
  }, []);

  return (
    <>
      <div
        ref={domElem}
        style={{
          width: "800px",
          height: "800px",
          display: "block",
        }}
      />
      <SettingsView settings={settings.live} range={range.live} />
    </>
  );
}

export type Simulation = {
  mesh: THREE.Mesh;
  scene: Scene;
  step: (elapsed: number) => void;
  cleanup: () => void;
};

function displayPoints(scene: Scene, scale: number = 1): Simulation {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const height = cellular.grid.n;
  const width = cellular.grid.m;

  const data = cellular.g[0].values;

  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGFormat, // Only using red and green channels
    THREE.FloatType
  );
  texture.needsUpdate = true;

  const uniforms = {
    uTime: { value: 0.0 },
    uData: { value: texture },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uData;
      varying vec2 vUv;
  
      void main() {
        float u = texture2D(uData, vUv).r;
        float v = texture2D(uData, vUv).g;
        vec3 color = vec3(u, v, 0.0);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.scene.add(mesh);

  function step(time: number) {
    const grid = cellular.next(time);
    // Ensure the data is a Float32Array
    texture.image.data = grid.values;
    uniforms.uTime.value = time;
    texture.needsUpdate = true;
  }

  return {
    scene,
    mesh,
    step,
    cleanup() {},
  };
}

function setupScene(elem: HTMLDivElement): Scene {
  // Create scene
  const scene = new THREE.Scene();

  // Set up camera
  const width = elem.clientWidth || 800;
  const height = elem.clientHeight || 800;
  const aspect = width / height;

  // Orthographic camera that fits the plane
  const camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
  camera.position.z = 1; // Move camera back so it can see the plane

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  elem.appendChild(renderer.domElement);

  // Render function
  let run = false;

  function start(update: (time: number) => void) {
    if (run === false) {
      run = true;
      let prevTime: number | undefined;
      function animate(time: number) {
        if (run) {
          requestAnimationFrame(animate);
          if (prevTime === undefined) {
            prevTime = time;
          }
          update((time - prevTime) / 1000);
          renderer.render(scene, camera);
        }
      }
      requestAnimationFrame(animate);
    }
  }

  function stop() {
    run = false;
  }

  // Handle window resize for orthographic camera
  function resize() {
    const w = elem.clientWidth || 800;
    const h = elem.clientHeight || 800;
    const aspect = w / h;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener("resize", resize);

  function cleanup() {
    window.removeEventListener("resize", resize);
    renderer.dispose();
  }

  return {
    scene,
    renderer,
    camera,
    cleanup,
    start,
    stop,
  };
}

interface Scene {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.OrthographicCamera;
  cleanup: () => void;
  start: (update: (time: number) => void) => void;
  stop: () => void;
}

function clickAction(
  { scene: { renderer, camera }, mesh }: Simulation,
  cellular: Cellular
) {
  const { grid, g } = cellular;
  function onMove(event) {
    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Raycast from camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Intersect with your plane mesh
    const intersects = raycaster.intersectObject(mesh);
    if (intersects.length > 0) {
      const point = intersects[0].point; // 3D point on the plane

      // Map point to grid coordinates (assuming plane covers [-1,1] x [-1,1])
      const x = Math.floor(((point.x + 1) / 2) * grid.m);
      const y = Math.floor((1 - (point.y + 1) / 2) * grid.n);

      // Update your simulation state
      const i = grid.m * x + y;
      const v0 = 1.0 - g[0].output[i][0];
      const v1 = 1.0 - g[0].output[i][1];
      g[0].output[i][0] = v1;
      g[1].output[i][1] = v0;
    }
  }
  renderer.domElement.addEventListener("mousemove", onMove, false);
}
