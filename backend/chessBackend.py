import os
import sys
import datetime
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "python-chess")))
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
<board_name> " " <move> <clock>: make move on board "a" or "b"

Every input is answered by the application. Valid moves are answered with:
"ok[" <pocket_a> "] [" <pocket_b> "]" ["|" <game_outcome>]
Illegal moves are answered with "illegal". Malformed inputs are answered
with "rejected".
'''

PLAYER_NAMES = [["a", "A"], ["b", "B"]]


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
                    result_comment = "Player {} ({}) checkmated".format(
                        PLAYER_NAMES[i][losing_player], pychess_player_names[i][losing_player])
                    break
    game.headers["Result"] = result
    game.headers["ResultComment"] = result_comment

    exporter = chess.pgn.FileExporter(file, headers=True, comments=False, variations=False)
    game.accept(exporter)


BOARD_IDS = {
    "a": 0,
    "b": 1
}
COLORS = [chess.WHITE, chess.BLACK]
BOARDS = [chess.variant.BOARD_A, chess.variant.BOARD_B]

close = False
while not close:
    try:
        command = input()
    except:
        break

    cmd, *params = command.strip().split()

    if cmd == "close":
        close = True
        print("closing")
    elif cmd == "new":
        print("new")
        board = chess.variant.BughouseBoards()
    elif cmd == "bpgn":
        data = json.loads(" ".join(params))
        # data = {
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
        # }

        playernames = data["playernames"]
        meta = data["meta"]
        result = data["result"] if "result" in data else None
        result_comment = data["result_comment"] if "result_comment" in data else None

        os.makedirs(os.path.dirname(data["filename"]), exist_ok=True)
        with open(data["filename"], "w", encoding="utf-8") as f:
            save_bpgn(f, board, playernames, meta, result, result_comment)
        print("ok")
    elif cmd == "fen":
        if len(params) == 0:
            print(board.fen())
        elif params[0] in BOARD_IDS:
            print(str(board[BOARD_IDS[params[0]]].fen()))
        else:
            print("fen: No such board \"{}\"".format(params[0]), file=sys.stderr)
    elif cmd == "move":
        # the command is a move: move <board> <uci move> <clock>
        # e.g.: move a B@f1 117.2
        try:
            board_name, uci, clock = params
            if board_name in BOARD_IDS:
                single_board = board[BOARD_IDS[board_name]]
                move = chess.Move.from_uci(uci)
                move.move_time = float(clock)
                if single_board.is_legal(move):
                    single_board.push(move)
                    pockets = "[{}] [{}]:[{}] [{}]".format(*(board[b].pockets[c] for b in BOARDS for c in COLORS))

                    if board.is_game_over():
                        print("ok" + pockets + "|" + board.result())
                    else:
                        print("ok" + pockets)
                else:
                    print("illegal")
            else:
                print("rejected")

        except:
            print("rejected")
    else:
        print("Command not understood: \"{}\"".format(command), file=sys.stderr)

    sys.stderr.flush()
    sys.stdout.flush()
