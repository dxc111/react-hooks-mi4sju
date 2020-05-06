import App from "./App";
import * as THREE from "three";
import events from "./events";

let smallOutline = new THREE.Vector3(1.1, 1.1, 1.1);
let bigOutline = new THREE.Vector3(1.5, 1.5, 1.5);

// I can probably dot he outline with render order isntead of mask
// Nah doesnt quite work

// The cubes are perfect, but the borders are't
// I want them to hide the far away ones, but not hide the close ones
// Just by adding 0.01 to the depth texture before the check does the trick. Hides the far away, but lets you see in the clos eones
class Waypoints {
  constructor() {
    this.waypoints = [];
    this.outlines = [];

    this.activeIndex = 0;

    this.raycaster = new THREE.Raycaster();

    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this.isOverWaypoint = this.isOverWaypoint.bind(this);
  }
  isOverWaypoint(point) {
    this.raycaster.setFromCamera(point, App.camera);

    let intersections = this.raycaster.intersectObjects(this.waypoints);

    if (intersections != null && intersections.length > 0) {
      return intersections[0];

      // update the active index
      // set the new index
      // this.outlines[this.activeIndex].scale.copy(bigOutline);
    }
    return null;
  }
  update() {
    // for (let i = 0; i < this.outlines.length; i++) {
    //   let target = i === this.activeIndex ? bigOutline : smallOutline;
    //   let mesh = this.outlines[i];
    //   if (mesh.scale.x === target.x) continue;
    //   mesh.scale.lerp(target, 0.15);
    // }
  }
  init() {
    const fragmentShader2 = `
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
      float mask = 1.-readDepth(tMask,  gl_FragCoord.xy / uResolution);
      if(mask + 0.01  >= vDepth){
        discard;
      }
      gl_FragColor = vec4(1.);
    }`;
    const vertexShader = `
    #include <packing>
    varying float vDepth;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position,1.);
      gl_Position = projectionMatrix * mvPosition;
      vDepth = 1.-viewZToOrthographicDepth(mvPosition.z, 1., 1000.);
    }`;
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
      if(1.-readDepth(tMask,  gl_FragCoord.xy / uResolution) >= vDepth){
        discard;
      }
      gl_FragColor = vec4(1.);
    }`;

    const outlineVertexShader = `
    #include <packing>
    varying float vDepth;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position,1.);
      gl_Position = projectionMatrix * mvPosition;
      vDepth = 1.-viewZToOrthographicDepth(mvPosition.z, 1., 1000.);
    }`;
    this.depthMaskMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        tMask: new THREE.Uniform(App.depthTarget.depthTexture),
        uResolution: App.uResolution,
      },
      // depthTest: false,
      fragmentShader: fragmentShader2,
      vertexShader,
    });

    this.outlineMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        tMask: new THREE.Uniform(App.depthTarget.depthTexture),
        uResolution: App.uResolution,
      },
      fragmentShader,
      vertexShader: outlineVertexShader,
    });
    // this.outlineMaterial.side = THREE.BackSide;

    this.depthMaterial = new THREE.MeshBasicMaterial({
      side: THREE.FrontSide,
    });

    this.waypointGeometry = new THREE.BoxBufferGeometry(7, 7, 7);
    this.connectionGeometry = new THREE.BoxBufferGeometry(1, 1, 1);

    this.addWaypoint(new THREE.Vector3(0, 0, 0));
    this.addWaypoint(new THREE.Vector3(-80, 0, 0));
    this.addConnection(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-80, 0, 0)
    );
    this.addWaypoint(new THREE.Vector3(0, 0, -90));
    this.addConnection(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -90)
    );

    this.addWaypoint(new THREE.Vector3(-140, 0, -57));
    this.addConnection(
      new THREE.Vector3(-80, 0, 0),
      new THREE.Vector3(-80, 0, -57)
    );
    this.addConnection(
      new THREE.Vector3(-79.5, 0, -57),
      new THREE.Vector3(-140, 0, -57)
    );
    this.addWaypoint(new THREE.Vector3(60, 0, -30));
    this.addConnection(new THREE.Vector3(0, 0, 0), new THREE.Vector3(60, 0, 0));
    this.addConnection(
      new THREE.Vector3(60, 0, 0.5),
      new THREE.Vector3(60, 0, -30)
    );
    this.addWaypoint(new THREE.Vector3(-20, 0, -155));
    this.addConnection(
      new THREE.Vector3(0, 0, -90),
      new THREE.Vector3(0, 0, -155)
    );
    this.addConnection(
      new THREE.Vector3(0.5, 0, -155),
      new THREE.Vector3(-20, 0, -155)
    );
    this.addWaypoint(new THREE.Vector3(-80, 0, 57));
    this.addConnection(
      new THREE.Vector3(-80, 0, 0),
      new THREE.Vector3(-80, 0, 57)
    );

    // events.on("tick", this.update);
  }
  addConnection(from, to) {
    let size = Math.abs(from.x - to.x);
    let geometry = this.connectionGeometry;
    let material = this.depthMaskMaterial;
    let mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = -1;

    let xScale = from.x - to.x;
    let yScale = from.y - to.y;
    let zScale = from.z - to.z;

    mesh.scale.x = Math.max(1, Math.abs(xScale));
    mesh.scale.y = Math.max(1, Math.abs(yScale));
    mesh.scale.z = Math.max(1, Math.abs(zScale));
    mesh.position.copy(from);
    mesh.position.x += -xScale / 2;
    mesh.position.y += -yScale / 2;
    mesh.position.z += -zScale / 2;

    mesh.matrixAutoUpdate = false;
    // mesh.updateMatrixWorld();
    mesh.updateMatrix();
    App.scene.add(mesh);
  }
  addWaypoint(position) {
    let geometry = this.waypointGeometry;
    // let depthMaterial = ;
    let depthMesh = new THREE.Mesh(geometry, this.depthMaterial);
    depthMesh.userData.index = this.waypoints.length;
    depthMesh.position.copy(position);
    App.depthScene.add(depthMesh);

    this.waypoints.push(depthMesh);

    depthMesh.matrixAutoUpdate = false;
    // mesh.updateMatrixWorld();
    depthMesh.updateMatrix();
    // Mask the outline with the mask
    // TODO:  Make this mask use depth too.

    let outlineMesh = new THREE.Mesh(geometry, this.outlineMaterial);
    outlineMesh.scale.set(1.2, 1.2, 1.2);
    outlineMesh.position.copy(position);
    this.outlines.push(outlineMesh);

    App.scene.add(outlineMesh);

    return depthMesh;
  }
}

export default new Waypoints();
