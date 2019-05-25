import os
os.sys.path.insert(0, os.path.abspath("./python-chess"))

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
    print("closing", flush=True)
    break
    
  if command=="new":
    print("new", flush=True)
    board = chess.variant.BughouseBoards()
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
      if command[0] == "a":
        single_board = board[0]
      else:
        single_board = board[1]
    else:
      print("rejected", flush=True)
      continue
    
    move = chess.Move.from_uci(command[2:])
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
