import * as React from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { randomLife } from "../functional/conway";

const cellular = randomLife(400, 400);

export function Cellular() {
  const domElem = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!domElem.current) return;
    const scene = setupScene(domElem.current);
    const sim = displayPoints(scene.scene);
    scene.start(sim.step);

    // Cleanup on unmount
    return () => {
      sim.cleanup();
      scene.cleanup();
    };
  }, []);

  return (
    <div
      ref={domElem}
      style={{
        width: "800px",
        height: "800px",
        display: "block",
      }}
    />
  );
}

export type Simulation = {
  step: (elapsed: number) => void;
  cleanup: () => void;
};

function displayPoints(scene: THREE.Scene, scale: number = 1): Simulation {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const height = cellular.grid.n;
  const width = cellular.grid.m;

  const data = cellular.g[0].values;

  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RedFormat, // Only using one channel
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
        float state = texture2D(uData, vUv).r;
        vec3 color = mix(vec3(0.0), vec3(1.0), state);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function step(time: number) {
    const grid = cellular.next();
    // Ensure the data is a Float32Array
    texture.image.data = grid.values;
    uniforms.uTime.value = time;
    texture.needsUpdate = true;
  }

  return {
    step,
    cleanup() {},
  };
}

function setupScene(elem: HTMLDivElement) {
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
    cleanup,
    start,
    stop,
  };
}
