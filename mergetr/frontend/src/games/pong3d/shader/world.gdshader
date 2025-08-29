in(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

void fragment() {
    // UV pour le grain (fréquence réduite pour éviter l'effet bulle)
    vec2 uv = UV * 50.0;

    // Bruit pseudo-aléatoire
    float noise = rand(uv + vec2(time));

    // Couleur de base
    vec4 tex_color = texture(albedo_texture, UV);

    // Grain gris
    vec3 grain_color = vec3(noise);

    // Mélange texture + grain
    vec3 final_color = mix(tex_color.rgb, grain_color, grain_intensity);

    ALBEDO = final_color;
    ALPHA = tex_color.a;
}
