uniform float u_time;
uniform vec2 u_hover;
// varying float vNoise;
varying vec2 vUv;

void main() {
    vec3 newposition = position;
    float PI = 3.1415925;

    // float noise = cnoise(3.*vec3(position.x,position.y,position.z + time/30.));
    
    float dist = distance(uv,u_hover);
    newposition.z += 10.*sin(dist*20. + u_time);
    newposition.x += 2.*cos(dist*20. + u_time * 10.);
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( newposition, 1.0 );
} 