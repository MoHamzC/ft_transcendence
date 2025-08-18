shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture;
uniform float time;
uniform float grain_amount = 1;
uniform float distortion_strength = 0.01;
uniform float border_size = 0.5;  // ← bordure réglable
uniform float radius = 0.05;      // ← coins arrondis réglables

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec2 barrel_distortion(vec2 uv, float amount) {
    vec2 cc = uv - 0.5;
    float dist = length(cc);
    if (dist < 0.5) {
        float factor = 1.0 + amount * dist * dist;
        cc *= factor;
    }
    return cc + 0.5;
}

void fragment() {
    vec2 uv = SCREEN_UV;

    float distortion_amount = distortion_strength + 0.05 * sin(time * 2.0);
    vec2 distorted_uv = barrel_distortion(uv, distortion_amount);

    vec4 color = texture(screen_texture, distorted_uv);

    float noise = rand(FRAGCOORD.xy + time);
    float grain = noise * grain_amount;
    color.rgb -= grain;

    vec2 clamped_uv = clamp(uv, border_size, 1.0 - border_size);
    float dist_corner = length(uv - clamp(uv, border_size + radius, 1.0 - border_size - radius));
	float vignette = 1.0 - smoothstep(radius, radius + 0.12, dist_corner);

    color.rgb *= vignette;

    COLOR = color;
}
