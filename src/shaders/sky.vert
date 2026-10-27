varying vec3 vWorldDirection;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldDirection = normalize(world.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * world;
  gl_Position.z = gl_Position.w; // pin to the far plane so the dome never clips scenery
}
