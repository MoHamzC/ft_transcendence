shader_type canvas_item;

uniform sampler2D screen_texture : hint_screen_texture;
uniform float grain_amount = 0.5;
uniform float time;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void fragment(){
    vec2 uv = FRAGCOORD.xy / vec2(textureSize(screen_texture, 0));
    vec4 tex_color = texture(screen_texture, uv);
    float noise = rand(FRAGCOORD.xy + time);
    float grain = noise * grain_amount;
    COLOR = vec4(tex_color.rgb - grain, tex_color.a);
}
