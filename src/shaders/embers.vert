uniform float uTime;
uniform float uRise;
uniform float uSpread;
uniform float uMaxHeight;
uniform float uPixelRatio;
attribute float aSeed;
varying float vLife;

void main() {
  float speed = uRise * (0.5 + aSeed);
  float y = mod(uTime * speed + aSeed * 37.0, uMaxHeight);
  vLife = y / uMaxHeight;
  float swirl = aSeed * 6.2831 + uTime * (0.6 + aSeed);
  vec3 offset = vec3(sin(swirl), 0.0, cos(swirl * 0.8)) * uSpread * (0.2 + vLife);
  vec4 mvPosition = modelViewMatrix * vec4(offset + vec3(0.0, y, 0.0), 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = (1.0 - vLife) * 70.0 * uPixelRatio / -mvPosition.z;
}
