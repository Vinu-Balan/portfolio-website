uniform float uTime;
uniform float uWind;
attribute float aPhase;
varying float vHeight;

#include <common>
#include <fog_pars_vertex>

void main() {
  vHeight = position.y;
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  // Quadratic falloff keeps blade roots planted while tips sway.
  float bend = position.y * position.y * uWind;
  float gust = sin(uTime * 1.7 + world.x * 0.15 + world.z * 0.11 + aPhase);
  gust += 0.5 * sin(uTime * 3.1 + world.z * 0.4 + aPhase * 2.0);
  world.x += gust * bend;
  world.z += gust * bend * 0.4;
  vec4 mvPosition = viewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
