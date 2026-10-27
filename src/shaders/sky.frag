uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDirection;
varying vec3 vWorldDirection;

void main() {
  vec3 dir = normalize(vWorldDirection);
  float altitude = clamp(dir.y, -0.2, 1.0);
  vec3 color = mix(uHorizon, uZenith, pow(max(altitude, 0.0), 0.55));
  color = mix(color, uHorizon * 0.6, smoothstep(0.0, -0.2, altitude));
  float sunAmount = max(dot(dir, normalize(uSunDirection)), 0.0);
  color += uSunColor * (pow(sunAmount, 900.0) * 3.0 + pow(sunAmount, 12.0) * 0.35);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
