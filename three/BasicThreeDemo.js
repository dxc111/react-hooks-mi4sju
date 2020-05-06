import * as THREE from "three";
import Stats from "stats.js";
import events from "./events";

export class BasicThreeDemo {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      stencil: false,
    });
    this.containerWidth = container.offsetWidth;
    this.containerHeight = container.offsetHeight;
    this.renderer.setSize(this.containerWidth, this.containerHeight, false);
    this.pixelRatio = Math.min(1.5, window.devicePixelRatio);
    this.renderer.setPixelRatio(this.pixelRatio);

    container.append(this.renderer.domElement);

    this.stats = new Stats();

    document.body.appendChild(this.stats.dom);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.containerWidth / this.containerHeight,
      1,
      1000
    );
    this.camera.position.z = 50;
    this.scene = new THREE.Scene();

    this.clock = new THREE.Clock();

    this.helpers = [];

    this.assets = {};
    this.disposed = false;
    this.tick = this.tick.bind(this);
    this.init = this.init.bind(this);
    this.setSize = this.setSize.bind(this);
  }
  createLight(lightType, { debug = false, helperSize = 5 } = {}, ...rest) {
    let light = new THREE[lightType](...rest);
    if (debug) {
      let helper = new THREE[lightType + "Helper"](light, helperSize);
      // helper.matrixAutoUpdate = true;

      this.helpers.push(helper);

      this.scene.add(helper);
    }
    return light;
  }
  loadAssets() {
    return new Promise((resolve, reject) => {
      // const manager = new THREE.LoadingManager(resolve);
      // this.text.load(manager);
    });
  }
  init() {
    this.tick();
  }
  getViewSizeAtDepth(depth = 0) {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      (this.camera.position.z - depth) * Math.tan(fovInRadians / 2) * 2
    );
    return { width: height * this.camera.aspect, height };
  }
  setSize(width, height, updateStyle) {
    this.renderer.setSize(width, height, false);
  }
  onResize() {}
  dispose() {
    this.disposed = true;
  }
  update() {}
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  tick() {
    let delta = this.clock.getDelta();
    if (this.disposed) return;
    if (resizeRendererToDisplaySize(this.renderer, this.setSize)) {
      const canvas = this.renderer.domElement;
      this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this.camera.updateProjectionMatrix();
      this.onResize();
    }
    this.stats.begin();
    // events.emit("tick");
    this.update();
    this.render();
    this.stats.end();
    requestAnimationFrame(this.tick);
  }
}

function resizeRendererToDisplaySize(renderer, setSize) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    setSize(width, height, false);
  }
  return needResize;
}
