# Global.gd
extends Node

# --- score ---
# --- score ---
var score_left: int = 0
var score_right: int = 0
var max_score: int = 1

# --- game ---
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

# --- tournament ---
var tournament_id: String = ""   # rempli via URL
var match_id: String = ""        # match du tournoi

func decode_param(s: String) -> String:
	# Décodage minimal (on garde simple pour l’instant)
	return s.replace("%20", " ").replace("%23", "#")

func _ready():
	var url: String = ""
	if Engine.has_singleton("JavaScriptBridge"):
		var js = JavaScriptBridge.get_interface("window")
		if js:
			url = str(js.location.href)
	# Fallback si on n’est pas dans le navigateur (export debug local)
	if url == "":
		url = "?ia=false&tournamentId=b262916b-c439-459a-b365-a9f4f228e248&matchId=42f60c02-5ff0-4d7a-84a7-9ff350cc6dab&playerId=98e8780f-51c7-4e65-95a1-48395734e09f&playerName=dedez&playerColor=blue&opponentId=09d04315-84cf-44d4-a9b3-929272276adb&opponentName=dezfzvezf&opponentColor=red"

	if url != "":
		var qmark := url.find("?")
		if qmark != -1:
			var query := url.substr(qmark + 1, url.length() - qmark - 1)
			var params: Dictionary = {}
			for pair in query.split("&"):
				var kv = pair.split("=")
				if kv.size() == 2:
					params[kv[0]] = decode_param(kv[1])

			# IA
			right_ia = params.get("ia", "false") == "true"

			# Player Left
			skin_PL_color = params.get("playerColor", skin_PL_color)
			skin_PL_id    = params.get("playerId", skin_PL_id)
			skin_PL_name  = params.get("playerName", skin_PL_name)

			# Player Right
			skin_PR_color = params.get("opponentColor", skin_PR_color)
			skin_PR_id    = params.get("opponentId", skin_PR_id)
			skin_PR_name  = params.get("opponentName", skin_PR_name)

			# Tournoi
			tournament_id = params.get("tournamentId", tournament_id)
			match_id      = params.get("matchId", match_id)

			# Fallback parsing manuel (au cas où certains params aient été mal encodés)
			if tournament_id == "" and query.find("tournamentId=") != -1:
				var parts = query.split("tournamentId=")
				if parts.size() > 1:
					var tid = parts[1].split("&")[0]
					if tid != "":
						tournament_id = tid
						print("Tournament ID detected (fallback):", tournament_id)
			if match_id == "" and query.find("matchId=") != -1:
				var parts2 = query.split("matchId=")
				if parts2.size() > 1:
					var mid = parts2[1].split("&")[0]
					if mid != "":
						match_id = mid
						print("Match ID detected (fallback):", match_id)

	# Charger mappings manettes
	var file = FileAccess.open("res://gamecontrollerdb.txt", FileAccess.READ)
	if file:
		while not file.eof_reached():
			var line = file.get_line()
			if line.strip_edges() != "":
				Input.add_joy_mapping(line, true)
		print("✅ Base de données manettes chargée")
	else:
		print("⚠️ Impossible de charger gamecontrollerdb.txt")

	# Debug global
	print("Right IA activé :", right_ia)
	print("Player Left :", skin_PL_name, skin_PL_id, skin_PL_color)
	print("Player Right:", skin_PR_name, skin_PR_id, skin_PR_color)
	print("Tournament context:", tournament_id, match_id)
