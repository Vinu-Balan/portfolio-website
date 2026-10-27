uniform vec3 uColor;
varying float vLife;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.0, d) * (1.0 - vLife);
  gl_FragColor = vec4(uColor * 2.0, alpha);
  #include <colorspace_fragment>
}
