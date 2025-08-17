extends MeshInstance3D  

@export var blink_interval: float = 0.5

func _ready() -> void:
	visible = false
	# Lance la boucle en différé pour pouvoir utiliser await
	call_deferred("_blink_loop")

func _blink_loop() -> void:
	while Global.score_left < Global.max_score and Global.score_right < Global.max_score:
		await get_tree().process_frame

	while true:
		visible = true
		await get_tree().create_timer(blink_interval).timeout
		visible = false
		await get_tree().create_timer(blink_interval).timeout
