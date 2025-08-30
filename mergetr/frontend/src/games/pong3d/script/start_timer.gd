extends Label3D

func _ready():
	start_countdown(5)

func start_countdown(seconds: int) -> void:
	for i in range(seconds, 0, -1):
		text = str(i)
		await get_tree().create_timer(1.0).timeout
	text = ""
	Global.game_start = true
