import App from "./App";
import Waypoints from "./Waypoints";
import Particles from "./Particles";
import createInputEvents from "simple-input-events";
// console.clear();
import "./styles.css";

/**
 * [ ] Turn Antialias on
 *
 *
 */

// const container = document.getElementById("app");
// console.log("Container", container);
// const myApp = new App(container);
App.loadAssets()
  .then(App.init)
  .then(() => {
    Waypoints.init();
    Particles.init();
    let events = createInputEvents(document.getElementById("app"));
    events.on("down", ({ position }) => {
      let point = {
        x: (position[0] / window.innerWidth) * 2 - 1,
        y: -(position[1] / window.innerHeight) * 2 + 1,
      };
      let intersection = Waypoints.isOverWaypoint(point);
      if (
        intersection !== null &&
        Waypoints.activeIndex !== intersection.object.userData.index
      ) {
        // set last scale to be correct
        // this.outlines[this.activeIndex].scale.copy(smallOutline);
        Waypoints.activeIndex = intersection.object.userData.index;
        App.controls.target.copy(intersection.object.position);
        App.controls.avoidSnap = true;
        App.controls.setScale();
        App.controls.snapRotate();
      }
      console.log("down");
    });

    events.on("move", ({ position }) => {
      let point = {
        x: (position[0] / window.innerWidth) * 2 - 1,
        y: -(position[1] / window.innerHeight) * 2 + 1,
      };
      let intersection = Waypoints.isOverWaypoint(point);
      if (
        intersection === null ||
        intersection.object.userData.index === Waypoints.activeIndex
      ) {
        document.body.style.cursor = "default";
        return;
      }
      document.body.style.cursor = "pointer";
    });
  });

if (module && module.hot) {
  // module.hot.accept((a, b) => {
  //   // For some reason having this function here makes dat gui work correctly
  //   // when using hot module replacement
  // });
  module.hot.dispose(() => {
    if (App) App.dispose();
  });
}
