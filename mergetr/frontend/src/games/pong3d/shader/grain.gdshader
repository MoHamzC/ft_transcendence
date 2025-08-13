shader_type spatial;

uniform float time;
uniform float grain_intensity : hint_range(0.0, 1.0) = 0.1;

float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

void fragment() {
    vec2 uv = UV * 100.0;
    float noise = rand(uv + vec2(time));
    vec4 tex_color = texture(TEXTURE_ALBEDO, UV);

    vec3 color = tex_color.rgb + noise * grain_intensity;

    ALBEDO = color;
    ALPHA = tex_color.a;
}
