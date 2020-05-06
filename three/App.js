import "./styles.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BasicThreeDemo } from "./BasicThreeDemo";
import { createOnBeforeCompile } from "./shaders";
// import { OrbitControls } from "./utils/OrbitControls";
import { OrbitControls } from "./utils/OrbitControls";
// import TextureDebugger from "./TextureDebugger";

let miniSceneURL = require("./SmallTown-Unity-userdata-2.glb");
let toneSrc = require("./threeTone.jpg");
let buildingURL = require("./Buildings/Buildings.gltf");

// Removied like 600 draw calls still slow. They help but the issue doesn't seem to be there

let DEBUG_LIGHTS = false;
export class App extends BasicThreeDemo {
  constructor(container) {
    console.log(miniSceneURL);
    super(container);
    this.camera.position.z = 150;
    this.scene.fog = new THREE.Fog(0x031929, 200, 700);
    THREE.UniformsLib["fog"].fogColor.value = this.scene.fog.color;
    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
      this.scene
    );
    // this.scene.overrideMaterial = new THREE.MeshBasicMaterial({});
    this.controls.minDistance = 10;
    this.controls.maxDistance = 300;
    this.controls.enablePan = false;
    this.controls.zoomSpeed = 5;
    // this.controls.enableDamping = true;
    this.camera.rotation.x = 0.1;
    this.camera.lookAt(this.scene.position);
    this.depthTarget = new THREE.WebGLRenderTarget(
      this.containerWidth * this.pixelRatio,
      this.containerHeight * this.pixelRatio,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
        stencilBuffer: false,
        type: THREE.UnsignedByteType,
      }
    );

    this.depthTarget.depthTexture = new THREE.DepthTexture({
      width: this.containerWidth * this.pixelRatio,
      height: this.containerHeight * this.pixelRatio,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    // this.depthTarget.depthTexture.magFilter = THREE.LinearFilter;
    // this.depthTarget.depthTexture.minFilter = THREE.LinearFilter;

    this.scene.background = new THREE.Color(0x031929);

    // this.renderer.setClearColor(new THREE.Color(0x031929), 1);

    // 10 - 150

    this.depthScene = new THREE.Scene();
    this.depthScene.background = new THREE.Color(0x000000);
    console.log(this.depthTarget.depthTexture);
    this.tDepth = new THREE.Uniform(this.depthTarget.depthTexture);

    this.uResolution = new THREE.Uniform(
      new THREE.Vector2(
        this.containerWidth * this.pixelRatio,
        this.containerHeight * this.pixelRatio
      )
    );
    console.log(this.containerWidth, this.pixelRatio);
  }
  onResize() {
    this.containerWidth = this.container.offsetWidth;
    this.containerHeight = this.container.offsetHeight;
    this.uResolution.value.set(
      this.containerWidth * this.pixelRatio,
      this.containerHeight * this.pixelRatio
    );
  }
  loadAssets() {
    let projectVertex = `
  vec4 mvPosition = modelViewMatrix * vec4(transformed,1.);
          float size = 1000. - 1.;
          float depth = 1.-clamp((abs(mvPosition.z) - 1.)/size, 0., 1.);
  gl_Position = projectionMatrix * mvPosition;
  vDepth = depth;
    
    `;
    let projectVertex_pars = `
			
 
	precision highp float;
      varying float vDepth;
    uniform sampler2D tDepth;
    uniform vec2 uResolution;	
    uniform float cameraNear;
			uniform float cameraFar;

      void main() {
    `;
    let projectFragment_pars = `
			
 
	precision highp float;
      varying float vDepth;
    uniform sampler2D tDepth;
    uniform vec2 uResolution;	
    uniform float cameraNear;
			uniform float cameraFar;



			float readDepth( sampler2D depthSampler, vec2 coord ) {
				float fragCoordZ = texture2D( depthSampler, coord ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear,cameraFar);
				return viewZToOrthographicDepth( viewZ, cameraNear,cameraFar);
			}

      void main() {
    `;
    let colorFragment = `
          float depth = 1.-readDepth(tDepth, gl_FragCoord.xy / uResolution);
          
          if(depth   <= vDepth){
            discard;
          }
	// diffuseColor = vec4( vec3(1.-depth), opacity ); // The actual color

    `;
    THREE.MeshStandardMaterial.prototype.onBeforeCompile = (material) => {
      material.uniforms.tDepth = this.tDepth;
      material.uniforms.uResolution = this.uResolution;
      material.uniforms.cameraNear = new THREE.Uniform(1);
      material.uniforms.cameraFar = new THREE.Uniform(1000);

      material.vertexShader = material.vertexShader.replace(
        "void main() {",
        projectVertex_pars
      );
      material.vertexShader = material.vertexShader.replace(
        "#include <project_vertex>",
        projectVertex
      );
      material.fragmentShader = material.fragmentShader.replace(
        "void main() {",
        projectFragment_pars
      );
      material.fragmentShader = material.fragmentShader.replace(
        "#include <color_fragment>",
        colorFragment
      );
    };
    return new Promise((resolve, reject) => {
      const manager = new THREE.LoadingManager(resolve);

      let texLoader = new THREE.TextureLoader(manager);
      let tone = texLoader.load(toneSrc);
      tone.minFilter = THREE.NearestFilter;
      tone.magFilter = THREE.NearestFilter;

      var loader = new GLTFLoader(manager);

      loader.load(miniSceneURL, (obj) => {
        this.scene.add(obj.scene);
        console.log(obj);
        // this.logChildrenMaterials(obj.scene);
        obj.scene.position.y += -34;
        obj.scene.position.x += -20;
        obj.scene.position.z += -7;
        // need to calculate the matrix world of the parent before the chidlren
        obj.scene.updateMatrixWorld();
        obj.scene.traverse((o) => {
          o.matrixAutoUpdate = false;
          // o.matrixWorldNeedsUpdate = true;
          // o.updateMatrix();
          o.updateMatrixWorld();
          if (o.isLight) {
            obj.scene.remove(o);
          }
          // if (o.isMesh) {
          //   o.material = new THREE.MeshBasicMaterial({});
          // }
        });
      });
      manager.itemStart("a");
      manager.itemEnd("a");
    });
  }
  addWaypoint() {
    let geometry = new THREE.BoxBufferGeometry(5, 5, 5);
    let material = new THREE.MeshBasicMaterial({});

    let mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    return mesh;
  }
  initLights() {
    // ADD LIGHTS
    let directional1 = this.createLight(
      "DirectionalLight",
      { debug: DEBUG_LIGHTS },
      0xfafafa,
      0.75
    );
    directional1.position.z = 5;
    directional1.position.y = -2;
    directional1.position.x = -10;
    this.scene.add(directional1);

    let hemisphere1 = this.createLight(
      "HemisphereLight",
      { debug: DEBUG_LIGHTS },
      0xffffbb,
      0x080820,
      1
    );
    // hemisphere1.position.x += 5;
    this.scene.add(hemisphere1);
  }

  init() {
    const water = new THREE.PlaneBufferGeometry(1500, 1500);
    const waterMat = new THREE.MeshBasicMaterial({
      depthWrite: false,
      depthTest: false,
      color: 0x042641,
    });
    let waterMesh = new THREE.Mesh(water, waterMat);
    waterMesh.renderOrder = -10;
    waterMesh.position.y += -13;
    waterMesh.position.y = -100;
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.matrixAutoUpdate = false;
    // mesh.updateMatrixWorld();
    waterMesh.updateMatrix();
    this.scene.add(waterMesh);

    const fragmentShader = `
    #define USE_FOG;
 #include <packing>

  ${THREE.ShaderChunk["common"]}
  ${THREE.ShaderChunk["fog_pars_fragment"]}
    uniform sampler2D tMask;
    varying float vDepth;
    uniform vec2 uResolution;	
    uniform vec3 uColor;
			float readDepth( sampler2D depthSampler, vec2 coord ) {
				float fragCoordZ = texture2D( depthSampler, coord ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, 1.,1000.);
				return viewZToOrthographicDepth( viewZ, 1.,1000.);
			}
    void main() {
      float mask = 1.-readDepth(tMask,  gl_FragCoord.xy / uResolution);
      if(mask <= vDepth){
        discard;
      }
      gl_FragColor = vec4(uColor,1.);
    ${THREE.ShaderChunk["fog_fragment"]}
    }
    `;
    const vertexShader = `
    #define USE_FOG;
    ${THREE.ShaderChunk["fog_pars_vertex"]}
 #include <packing>
    varying float vDepth;
void main() {
  vec3 pos = position.xyz;
  vec4 mvPosition =  modelViewMatrix * vec4(pos,1.);
  gl_Position = projectionMatrix *mvPosition;
      vDepth = 1.-viewZToOrthographicDepth(mvPosition.z, 1., 1000.);

    ${THREE.ShaderChunk["fog_vertex"]}
}`;
    console.log(THREE.UniformsLib["fog"]);
    const waterMat2 = new THREE.ShaderMaterial({
      uniforms: {
        uResolution: this.uResolution,
        tMask: this.tDepth,
        uColor: new THREE.Uniform(new THREE.Color(0x042641)),
        ...THREE.UniformsLib["fog"],
      },
      fragmentShader,
      vertexShader,
    });

    let waterMesh2 = new THREE.Mesh(water, waterMat2);
    waterMesh2.renderOrder = -9;
    waterMesh2.position.y += -13;
    waterMesh2.rotation.x = -Math.PI / 2;
    this.scene.add(waterMesh2);
    waterMesh2.matrixAutoUpdate = false;
    // mesh.updateMatrixWorld();
    waterMesh2.updateMatrix();
    // this.scene.add(wireframe);

    // this.scene.add(TextureDebugger.group);
    // TextureDebugger.addTexture(this.depthTarget.texture);
    // TextureDebugger.addTexture(this.depthTarget.depthTexture);

    // TextureDebugger.addDepthTexture(this.depthTarget.texture);
    // TextureDebugger.addDepthTexture(this.depthTarget.depthTexture);

    // this.debugTexture = TextureDebugger.screenMeshes[3];

    // this.depthScene.add(mesh);

    this.initLights();

    this.tick();
  }
  update() {
    if (window.a == null) {
      window.a = true;

      console.log(this.renderer.info);
    }
    this.controls.tick();
    this.controls.update();
    if (this.scene.fog.far !== THREE.UniformsLib["fog"].fogFar.value)
      THREE.UniformsLib["fog"].fogFar.value = this.scene.fog.far;
    if (this.scene.fog.near !== THREE.UniformsLib["fog"].fogNear.value)
      THREE.UniformsLib["fog"].fogNear.value = this.scene.fog.near;

    let renderer = this.renderer;
    // let currentTarget = renderer.RenderTarget;
    renderer.setRenderTarget(this.depthTarget);
    renderer.render(this.depthScene, this.camera);
    renderer.setRenderTarget(null);

    // TextureDebugger.update(this.camera, this);
    // this.debugTexture.mesh.material.uniforms.uMap.value = this.depthTarget.depthTexture;
    // this.renderer.render(this.depthScene, this.camera, this.depthTarget);
  }
  // render() {
  //   this.renderer.render(this.depthScene, this.camera);
  // }
  dispose() {
    this.disposed = true;
  }
}

export default new App(document.getElementById("app"));
