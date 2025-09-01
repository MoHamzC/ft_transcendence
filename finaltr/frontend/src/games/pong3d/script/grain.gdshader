shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture;
uniform float time;
uniform float grain_amount = 0.05;      // intensité du grain
uniform float border_size = 0.5;         // bordure
uniform float radius = 0.05;             // coins arrondis

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void fragment() {
    vec2 uv = SCREEN_UV;

    // Pas de distortion
    vec2 distorted_uv = uv;

    // Couleur de l'écran
    vec4 color = texture(screen_texture, distorted_uv);

    // Grain animé
    float noise = rand(FRAGCOORD.xy + time);
    float grain = noise * grain_amount;
    color.rgb -= grain;

    // Vignette légère
    vec2 clamped_uv = clamp(uv, border_size, 1.0 - border_size);
    float dist_corner = length(uv - clamp(uv, border_size + radius, 1.0 - border_size - radius));
    float vignette = 1.0 - smoothstep(radius, radius + 0.12, dist_corner);
    color.rgb *= vignette;

    COLOR = color;
}
