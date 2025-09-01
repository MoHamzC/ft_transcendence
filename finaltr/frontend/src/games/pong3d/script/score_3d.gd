extends Node3D

@onready var p1_label = $P1
@onready var p2_label = $P2

func update_scores():
	p1_label.text = str(Global.score_left)
	p2_label.text = str(Global.score_right)
