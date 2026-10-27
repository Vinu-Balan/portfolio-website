uniform vec3 uBase;
uniform vec3 uTip;
uniform vec3 uLight;
varying float vHeight;

#include <common>
#include <fog_pars_fragment>

void main() {
  vec3 color = mix(uBase, uTip, vHeight) * uLight;
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
