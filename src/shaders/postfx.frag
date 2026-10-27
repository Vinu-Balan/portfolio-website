uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uGrain;
uniform float uVignette;
uniform float uSepia;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 color = texture2D(tDiffuse, vUv).rgb;
  vec3 sepia = vec3(
    dot(color, vec3(0.393, 0.769, 0.189)),
    dot(color, vec3(0.349, 0.686, 0.168)),
    dot(color, vec3(0.272, 0.534, 0.131))
  );
  color = mix(color, sepia, uSepia);
  float vignette = smoothstep(0.85, 0.2, length(vUv - 0.5) * 1.25);
  color *= mix(1.0, vignette, uVignette);
  color += (hash(vUv * 1000.0 + fract(uTime)) - 0.5) * uGrain;
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
