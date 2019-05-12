import os
os.sys.path.append(os.path.abspath("./python-chess"))

import sys
import chess.variant

board = chess.variant.BughouseBoards()

'''
bughouse chess script.

commands:
new: starts a new game
close: exits the application
fen: prints the current fen
<board_name> ">" <move>: make move on board "a" or "b"

Every input is answered by the application. Valid moves are answered with "ok" or
"ok:<game outcome>". Illegal moves are answered with "illegal". Malformed inputs
are answered with "rejected".
'''

while True:
  try:
    command = input();
  except:
    break;
  
  if command=="close":
    print("closing")
    break
    
  if command=="new":
    print("new")
    board = chess.variant.BughouseBoards()
    continue
    
  if command=="fen":
    print(board.bfen)
    continue
  
  # the command is a move: <board> ">" <uci move>
  # e.g.: a>B@f1
  try:
    if command[0] in ["a", "b"]:
      if command[0] == "a":
        single_board = board[0]
      else:
        single_board = board[1]
    else:
      print("rejected")
      continue
    
    move = chess.Move.from_uci(command[2:])
  except Exception as e:
    print("rejected", e)
    continue
  
  if not move in single_board.legal_moves:
    print("illegal")
  else:
    single_board.push(move)
    if board.is_game_over():
      print("ok:"+board.result())
    else:
      print("ok")
