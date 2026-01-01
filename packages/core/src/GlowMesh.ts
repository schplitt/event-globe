import type {
  BufferGeometry,
} from 'three'
import {
  BackSide,
  BufferAttribute,
  Color,
  Mesh,
  ShaderMaterial,
} from 'three'

const vertexShader = `
uniform float hollowRadius;

varying vec3 vVertexWorldPosition;
varying vec3 vVertexNormal;
varying float vCameraDistanceToObjCenter;
varying float vVertexAngularDistanceToHollowRadius;

void main() {
  vVertexNormal = normalize(normalMatrix * normal);
  vVertexWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

  vec4 objCenterViewPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vCameraDistanceToObjCenter = length(objCenterViewPosition.xyz);

  // Calculate angular distance to hollow radius
  float vertexAngle = acos(dot(
    normalize(objCenterViewPosition.xyz),
    normalize((modelViewMatrix * vec4(position, 1.0)).xyz)
  ));
  float edgeAngle = asin(hollowRadius / vCameraDistanceToObjCenter);
  
  // Check if camera is within hollow radius and looking outwards
  if (vCameraDistanceToObjCenter < hollowRadius) {
    edgeAngle = acos(dot(
      normalize(cameraPosition),
      normalize(objCenterViewPosition.xyz)
    ));
  }

  vVertexAngularDistanceToHollowRadius = vertexAngle - edgeAngle;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform vec3 color;
uniform float coefficient;
uniform float power;
uniform float hollowRadius;

varying vec3 vVertexNormal;
varying vec3 vVertexWorldPosition;
varying float vCameraDistanceToObjCenter;
varying float vVertexAngularDistanceToHollowRadius;

void main() {
  if (vCameraDistanceToObjCenter < hollowRadius) discard; // inside the hollow radius
  if (vVertexAngularDistanceToHollowRadius < 0.0) discard; // frag position is within the hollow radius

  vec3 worldCameraToVertex = vVertexWorldPosition - cameraPosition;
  vec3 viewCameraToVertex = (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;
  viewCameraToVertex = normalize(viewCameraToVertex);

  float intensity = pow(
    coefficient + dot(vVertexNormal, viewCameraToVertex),
    power
  );

  gl_FragColor = vec4(color, intensity);
}
`

// Based off: http://stemkoski.blogspot.fr/2013/07/shaders-in-threejs-glow-and-halo.html
function createGlowMaterial(
  coefficient: number,
  color: string | number,
  power: number,
  hollowRadius: number,
): ShaderMaterial {
  return new ShaderMaterial({
    depthWrite: false,
    transparent: true,
    vertexShader,
    fragmentShader,
    uniforms: {
      coefficient: {
        value: coefficient,
      },
      color: {
        value: new Color(color),
      },
      power: {
        value: power,
      },
      hollowRadius: {
        value: hollowRadius,
      },
    },
  })
}

function createGlowGeometry(geometry: BufferGeometry, size: number): BufferGeometry {
  const glowGeometry = geometry.clone()

  // Resize vertex positions according to normals
  const position = new Float32Array(geometry.attributes.position!.count * 3)
  for (let idx = 0, len = position.length; idx < len; idx++) {
    const normal = geometry.attributes.normal!.array[idx]!
    const curPos = geometry.attributes.position!.array[idx]!
    position[idx] = curPos + normal * size
  }

  glowGeometry.setAttribute('position', new BufferAttribute(position, 3))

  return glowGeometry
}

export interface GlowMeshOptions {
  color?: string | number
  size?: number
  hollowRadius?: number
  coefficient?: number
  power?: number
  backside?: boolean
}

export class GlowMesh extends Mesh {
  constructor(geometry: BufferGeometry, options: GlowMeshOptions = {}) {
    const {
      color = 0x88ccff,
      size = 2,
      hollowRadius = 100,
      coefficient = 0.1,
      power = 3.5,
      backside = true,
    } = options

    const glowGeometry = createGlowGeometry(geometry, size)
    const glowMaterial = createGlowMaterial(coefficient, color, power, hollowRadius)

    if (backside) {
      glowMaterial.side = BackSide
    }

    super(glowGeometry, glowMaterial)
  }
}
