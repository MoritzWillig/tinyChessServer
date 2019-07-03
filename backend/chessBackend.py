import os
os.sys.path.insert(0, os.path.abspath("./backend/python-chess"))

import sys
import datetime
import json

import chess
import chess.pgn
import chess.variant

board = chess.variant.BughouseBoards()

'''
bughouse chess script.

commands:
new: starts a new game
close: exits the application
bpgn: prints the bpgn
fen: prints the current fen
fen a: prints the current fen for board a
fen b: prints the current fen for board b
<board_name> ">" <move>: make move on board "a" or "b"

Every input is answered by the application. Valid moves are answered with:
"ok[" <pocket_a> "] [" <pocket_b> "]" ["|" <game_outcome>]
Illegal moves are answered with "illegal". Malformed inputs are answered
with "rejected".
'''

def save_bpgn(file, boards, playernames, meta, result=None, result_comment=None):
  game = chess.pgn.Game.from_bughouse_boards(boards)
  game.headers["WhiteA"] = playernames[0]
  game.headers["BlackA"] = playernames[2]
  game.headers["WhiteB"] = playernames[3]
  game.headers["BlackB"] = playernames[1]
  game.headers["TimeControl"] = meta["timecontrol"]
  game.headers["Event"] = meta["event"]
  game.headers["Site"] = meta["site"]
  game.headers["Date"] = datetime.datetime.now().isoformat()
  game.headers["Round"] = meta["round"]

  pychess_player_names = [[playernames[2], playernames[0]], [playernames[1], playernames[3]]]

  if result is None:
    if boards.is_threefold_repetition():
        result = "1/2-1/2"
        result_comment = "Game drawn by threefold repetition"
    elif boards.is_checkmate():
        result = boards.result()
        for i, b in enumerate(boards):
            if b.is_checkmate():
                losing_player = b.turn
                result_comment = "{} checkmated".format(pychess_player_names[i][losing_player])
                break
  game.headers["Result"] = result
  game.headers["ResultComment"] = result_comment

  exporter = chess.pgn.FileExporter(file, headers=True, comments=False, variations=False)
  game.accept(exporter)


while True:
  try:
    command = input();
  except:
    break;
  
  if command=="close":
    print("closing", flush=True)
    break
    
  if command=="new":
    print("new", flush=True)
    board = chess.variant.BughouseBoards()
    continue
    
  if (len(command) > 4) and (command[0:4]=="bpgn"):
    data = json.loads(command[4:])
    #data = {
    #  "filename": "/chess/logs/game0001.bpgn",
    #  "playernames": ["WhiteA", "BlackB", "BlackA", "WhiteB"],
    #  "meta": {
    #    "timecontrol": "300+0",
    #    "event": "event name",
    #    "site": "",
    #    "round": "1"
    #  },
    #  "result": "1-0", //optional: forfeit on time, ...
    #  "result_comment", //optional
    #}
    
    playernames = data["playernames"]
    meta = data["meta"]
    result = data["result"] if "result" in data else None
    result_comment = data["result_comment"] if "result_comment" in data else None
  
    with open(data["filename"], "w", encoding="utf-8") as f:
      save_bpgn(f, board, playernames, meta, result, result_comment)
      print("ok", flush=True)
      continue
  
    
  if command=="fen":
    print(board.bfen, flush=True)
    continue
  
  if command=="fen a":
    print(str(board[0].fen()), flush=True)
    continue
  
  if command=="fen b":
    print(str(board[1].fen()), flush=True)
    continue
  
  # the command is a move: <board> ">" <uci move>
  # e.g.: a>B@f1
  try:
    if command[0] in ["a", "b"]:
      board_id = 0 if command[0] == "a" else 1
      single_board = board[board_id]
    else:
      print("rejected", flush=True)
      continue
    
    move = chess.Move.from_uci(command[2:])
    move.board_id=board_id
    move.move_time = 1.0 #TODO Clock of the player moving
  except:
    print("rejected", flush=True)
    continue
  
  if not move in single_board.legal_moves:
    print("illegal", flush=True)
  else:
    single_board.push(move)
    
    pockets = "["+str(board[0].pockets[chess.WHITE])+"] ["+str(board[0].pockets[chess.BLACK])+"]:" +\
              "["+str(board[1].pockets[chess.WHITE])+"] ["+str(board[1].pockets[chess.BLACK])+"]"
    
    if board.is_game_over():
      print("ok"+pockets+"|"+board.result(), flush=True)
    else:
      print("ok"+pockets, flush=True)
