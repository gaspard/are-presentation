import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function PixelShader({ vert, frag }: { vert: string; frag: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(rect.width, rect.height);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        time: { value: 0 },
        resolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 1;

    let startTime;
    const animate = (time) => {
      if (!startTime) {
        startTime = time;
      }
      material.uniforms.time.value = (startTime - time) / 1000;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      // Cleanup
      renderer.dispose();
    };
  }, [canvasRef.current]);

  return <canvas className="w-full" ref={canvasRef} />;
}

export default PixelShader;
