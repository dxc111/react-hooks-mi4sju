export let projectVertex_pars = `
  uniform float uTime;
`;
export let projectFragment_pars = `
  uniform float uTime;
`;

export let projectVertex = `
  transformed.x += sin(uTime) * 10.;
  vec4 mvPosition = modelViewMatrix * vec4(transformed,1.);
  gl_Position = projectionMatrix * mvPosition;
`;

export const colorFragment = `
	diffuseColor = vec4( diffuse, opacity ); // The actual color
`;

export let createOnBeforeCompile = (uniforms = {}) => {
  return function onBeforeCompile(material) {
    let keys = Object.keys(uniforms);
    keys((key) => {
      material.uniforms[key] = uniforms[key];
    });
    material.vertexShader =
      projectVertex_pars +
      material.vertexShader.replace("#include <project_vertex>", projectVertex);
    material.fragmentShader =
      projectFragment_pars +
      material.fragmentShader.replace(
        "#include <color_fragment>",
        colorFragment
      );
    return material;
  };
};

export let onBeforeCompile = (material) => {
  material.vertexShader =
    projectVertex_pars +
    material.vertexShader.replace("#include <project_vertex>", projectVertex);
  material.fragmentShader =
    projectFragment_pars +
    material.fragmentShader.replace("#include <color_fragment>", colorFragment);
  return material;
};
