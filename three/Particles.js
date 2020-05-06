import * as THREE from "three";
import webgl from "./App";

const fragmentShader = `
 #include <packing>
    uniform sampler2D tMask;
    varying float vDepth;
    uniform vec2 uResolution;	
			float readDepth( sampler2D depthSampler, vec2 coord ) {
				float fragCoordZ = texture2D( depthSampler, coord ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, 1.,1000.);
				return viewZToOrthographicDepth( viewZ, 1.,1000.);
			}
    void main() {
      vec3 color = vec3(1.);
      float mask = 1.-readDepth(tMask,  gl_FragCoord.xy / uResolution);
      if(mask >= vDepth){
        discard;
      }
      gl_FragColor = vec4(color,1.);
    }
    `;
const vertexShader = `
 #include <packing>
attribute vec3 aPosition;
    varying float vDepth;
void main() {
  vec3 pos = position.xyz;
  pos += aPosition;
  vec4 mvPosition =  modelViewMatrix * vec4(pos,1.);
  gl_Position = projectionMatrix *mvPosition;
      vDepth = 1.-viewZToOrthographicDepth(mvPosition.z, 1., 1000.);
}`;

class Particles {
  constructor() {
    let grid = 10;
    this.grid = grid;
  }
  init() {
    let geometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);
    let material = new THREE.ShaderMaterial({
      uniforms: {
        uResolution: webgl.uResolution,
        tMask: webgl.tDepth,
      },
      fragmentShader,
      vertexShader,
    });

    let instanced = new THREE.InstancedBufferGeometry().copy(geometry);

    let separation = 50;

    instanced.maxInstancedCount = this.grid * this.grid * this.grid;
    let aPositions = [];
    let colors = [];
    let aColor = [];
    for (let y = 0; y < this.grid; y++) {
      for (let x = 0; x < this.grid; x++) {
        for (let z = 0; z < this.grid; z++) {
          aPositions.push(x * separation, y * separation, z * separation);
        }
      }
    }

    let gridSize = (this.grid - 1) * separation;

    instanced.setAttribute(
      "aPosition",
      new THREE.InstancedBufferAttribute(new Float32Array(aPositions), 3, false)
    );

    let mesh = new THREE.Mesh(instanced, material);
    mesh.position.x += -gridSize / 2;
    mesh.position.y += -gridSize / 2;
    mesh.position.z += -gridSize / 2;

    let parent = new THREE.Object3D();

    parent.add(mesh);
    parent.rotation.y = Math.PI / 4;
    mesh.matrixAutoUpdate = false;
    parent.matrixAutoUpdate = false;
    // mesh.updateMatrixWorld();
    parent.updateMatrix();
    mesh.updateMatrix();

    mesh.frustumCulled = false;
    parent.frustumCulled = false;

    webgl.scene.add(parent);
  }
}

export default new Particles();
