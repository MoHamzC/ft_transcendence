shader_type spatial;

uniform sampler2D albedo_texture;
uniform float time;
uniform float grain_intensity = 0.1;

float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

void fragment() {
    vec2 uv = UV * 100.0;
    float noise = rand(uv + vec2(time));
    vec4 tex_color = texture(albedo_texture, UV);

    // Le grain est un gris entre 0 et 1
    vec3 grain_color = vec3(noise);

    // On fait un mélange (mix) entre la couleur originale et le grain,
    // le paramètre grain_intensity contrôle l'opacité du grain.
    vec3 final_color = mix(tex_color.rgb, grain_color, grain_intensity);

    ALBEDO = final_color;
    ALPHA = tex_color.a;
}
