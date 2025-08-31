# Global.gd
extends Node

# --- score ---
var score_left: int = 0
var score_right: int = 0
var max_score: int = 1

# --- game ---
var game_start: bool = false
var right_ia: bool = true

# --- player left ---
var skin_PL_color: String = "red"
var skin_PL_id: String = ""
var skin_PL_name: String = "Player Left"

# --- player right ---
var skin_PR_color: String = "red"
var skin_PR_id: String = ""
var skin_PR_name: String = "Player Right"

# --- fonction pour décoder les paramètres URL ---
func decode_param(s: String) -> String:
	s = s.replace("%20", " ")
	s = s.replace("%23", "#")
	return s


func _ready():
	var url = ""  # définir une valeur par défaut
	if Engine.has_singleton("JavaScriptBridge"):
		var js = JavaScriptBridge.get_interface("window")
		if js:
			url = str(js.location.href)  # récupérer l'URL complète

#	var url = "http://localhost:5173/export_pong3D/index.html?ia=true&playerId=0a74c824-67e1-4afc-8f6e-127c235378cd&playerName=lomont&playerColor=blue&opponentId=07097919-dd36-4055-a6ed-acb7b18d7796&opponentName=Intelligence%20Artificielle&opponentColor=yellow"

	if url != "":
		# récupérer la partie après le "?"
		var search_index = url.find("?")
		if search_index != -1:
			var search = url.substr(search_index + 1, url.length() - search_index - 1)
			var params = {}
			for pair in search.split("&"):
				var kv = pair.split("=")
				if kv.size() == 2:
					params[kv[0]] = decode_param(kv[1])

			# Activer l'IA
			right_ia = params.get("ia", "false") == "true"

			# Player Left
			skin_PL_color = params.get("playerColor", skin_PL_color)
			skin_PL_id    = params.get("playerId", skin_PL_id)
			skin_PL_name  = params.get("playerName", skin_PL_name)

			# Player Right
			skin_PR_color = params.get("opponentColor", skin_PR_color)
			skin_PR_id    = params.get("opponentId", skin_PR_id)
			skin_PR_name  = params.get("opponentName", skin_PR_name)

	# Debug
	print("Right IA activé :", right_ia)
	print("Player Left :", skin_PL_name, skin_PL_color, skin_PL_id)
	print("Player Right:", skin_PR_name, skin_PR_color, skin_PR_id)
