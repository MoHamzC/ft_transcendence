extends Node

var score_left: int = 0
var score_right: int = 0
var max_score: int = 5
var game_start: bool = false
var right_ia: bool = true

func _ready():
	if Engine.has_singleton("JavaScriptBridge"):
		var js = JavaScriptBridge.get_interface("window")
		if js:  # Vérifie juste que l’objet existe
			var search = str(js.location.search)  # "?ia=true" ou "?ia=false"
			if search.find("ia=true") != -1:
				right_ia = true
	print("Right IA activé :", right_ia)
