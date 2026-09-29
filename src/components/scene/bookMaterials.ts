import * as THREE from "three";
import { FILLER_VARIANTS, GOLD_HEX, PAGE_HEX } from "./bookTextures";

const GILT_ROUGHNESS = "0.28";
const PAGE_ROUGHNESS = "0.92";

/**
 * Real books: the map's RGB is the tooled spine, its alpha marks the gilt.
 * Gilt areas turn fully metallic and glossy so they catch the candlelight.
 */
export function createRealBookMaterial(map: THREE.Texture, normalMap: THREE.Texture) {
  const material = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.62,
    metalness: 0,
  });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        vec4 atlasTexel = texture2D( map, vMapUv );
        float giltMask = atlasTexel.a;
        diffuseColor.rgb *= atlasTexel.rgb;
        `,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
        #include <roughnessmap_fragment>
        roughnessFactor = mix( roughnessFactor, ${GILT_ROUGHNESS}, giltMask );
        `,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        /* glsl */ `
        #include <metalnessmap_fragment>
        metalnessFactor = mix( metalnessFactor, 1.0, giltMask );
        `,
      );
  };
  material.customProgramCacheKey = () => "real-book";
  return material;
}

/**
 * Anonymous volumes: instance colour is the leather, the shared mask atlas
 * adds gilt (R), page paper (G) and darker labels (B). `aVariant` picks one
 * of the spine designs.
 */
export function createFillerMaterial(atlas: THREE.Texture, normalMap: THREE.Texture) {
  const material = new THREE.MeshStandardMaterial({
    map: atlas,
    normalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.66,
    metalness: 0,
  });
  const gold = new THREE.Color(GOLD_HEX);
  const page = new THREE.Color(PAGE_HEX);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.giltColor = { value: gold };
    shader.uniforms.pageColor = { value: page };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aVariant;")
      .replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>\nvMapUv.x = ( vMapUv.x + aVariant ) / ${FILLER_VARIANTS}.0;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 giltColor;\nuniform vec3 pageColor;",
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        vec4 atlasTexel = texture2D( map, vMapUv );
        float giltMask = atlasTexel.r;
        float pageMask = atlasTexel.g;
        float labelMask = atlasTexel.b;
        `,
      )
      .replace(
        "#include <color_fragment>",
        /* glsl */ `
        #include <color_fragment>
        diffuseColor.rgb *= 1.0 - 0.55 * labelMask;
        diffuseColor.rgb = mix( diffuseColor.rgb, pageColor, pageMask );
        diffuseColor.rgb = mix( diffuseColor.rgb, giltColor, giltMask );
        `,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
        #include <roughnessmap_fragment>
        roughnessFactor = mix( roughnessFactor, ${PAGE_ROUGHNESS}, pageMask );
        roughnessFactor = mix( roughnessFactor, ${GILT_ROUGHNESS}, giltMask );
        `,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        /* glsl */ `
        #include <metalnessmap_fragment>
        metalnessFactor = mix( metalnessFactor, 1.0, giltMask );
        `,
      );
  };
  material.customProgramCacheKey = () => "filler-book";
  return material;
}
