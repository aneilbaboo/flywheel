var FwDemo;
(function (FwDemo) {
    var MoveStateType;
    (function (MoveStateType) {
        MoveStateType[MoveStateType["OpponentTurn"] = 0] = "OpponentTurn";
        MoveStateType[MoveStateType["SelectSource"] = 1] = "SelectSource";
        MoveStateType[MoveStateType["SelectDest"] = 2] = "SelectDest";
        MoveStateType[MoveStateType["GameOver"] = 3] = "GameOver";
    })(MoveStateType || (MoveStateType = {}));
    ;
    var PlayStopStateType;
    (function (PlayStopStateType) {
        PlayStopStateType[PlayStopStateType["Play"] = 0] = "Play";
        PlayStopStateType[PlayStopStateType["Stop"] = 1] = "Stop";
        PlayStopStateType[PlayStopStateType["Pause"] = 2] = "Pause";
    })(PlayStopStateType || (PlayStopStateType = {}));
    ;
    var SquarePixels = 70;
    var TheBoard = new Flywheel.Board();
    var RotateFlag = false;
    var MoveState = MoveStateType.SelectSource;
    var SourceSquareSelector = null;
    var BgDark = '#8FA679';
    var BgPale = '#D4CEA3';
    var PrevTurnEnabled = false;
    var NextTurnEnabled = false;
    var PlayStopEnabled = false;
    var PlayStopState = PlayStopStateType.Play;
    // The chess board stores the history, but we need to be able to redo
    // moves that have been undone.
    var GameHistory = [];
    var GameHistoryIndex = 0;
    function TriStateDir(enabled, hover) {
        if (enabled) {
            return hover ? 'shadow2' : 'shadow1';
        }
        return 'shadow0';
    }
    function PrevButtonImage(hover) {
        return TriStateDir(PrevTurnEnabled, hover) + '/media-step-backward-4x.png';
    }
    function NextButtonImage(hover) {
        return TriStateDir(NextTurnEnabled, hover) + '/media-step-forward-4x.png';
    }
    function PlayStopImage(hover) {
        // Figure out which kind of image to show: play, pause, stop.
        var fn;
        switch (PlayStopState) {
            case PlayStopStateType.Play:
                fn = 'media-play-4x.png';
                break;
            case PlayStopStateType.Stop:
                fn = 'media-stop-4x.png';
                break;
            case PlayStopStateType.Pause:
            default:
                fn = 'media-pause-4x.png';
                break;
        }
        // Figure out whether to show disabled, normal, or highlighted version.
        return TriStateDir(PlayStopEnabled, hover) + '/' + fn;
    }
    function MakeImageHtml(s) {
        var fn;
        switch (s) {
            case Flywheel.Square.WhitePawn:
                fn = 'wp';
                break;
            case Flywheel.Square.WhiteKnight:
                fn = 'wn';
                break;
            case Flywheel.Square.WhiteBishop:
                fn = 'wb';
                break;
            case Flywheel.Square.WhiteRook:
                fn = 'wr';
                break;
            case Flywheel.Square.WhiteQueen:
                fn = 'wq';
                break;
            case Flywheel.Square.WhiteKing:
                fn = 'wk';
                break;
            case Flywheel.Square.BlackPawn:
                fn = 'bp';
                break;
            case Flywheel.Square.BlackKnight:
                fn = 'bn';
                break;
            case Flywheel.Square.BlackBishop:
                fn = 'bb';
                break;
            case Flywheel.Square.BlackRook:
                fn = 'br';
                break;
            case Flywheel.Square.BlackQueen:
                fn = 'bq';
                break;
            case Flywheel.Square.BlackKing:
                fn = 'bk';
                break;
            default:
                return '';
        }
        fn = '../pieces/merida/png/' + fn + '.png';
        return '<img src="' + fn + '" width="' + SquarePixels + '" height="' + SquarePixels + '">';
    }
    function MakeFileLabel(x) {
        return '<div class="RankFileText" id="FileLabel_' + x.toFixed() + '"' +
            ' style="position: absolute; top: ' + (SquarePixels * 8 + 8).toFixed() + 'px; ' +
            ' left: ' + (SquarePixels * x + (SquarePixels >> 1) - 4).toFixed() + 'px; ">x</div>';
    }
    function MakeRankLabel(y) {
        return '<div class="RankFileText" id="RankLabel_' + y.toFixed() + '"' +
            ' style="position: absolute; left:-20px; top:' +
            (SquarePixels * y + (SquarePixels >> 1) - 7).toFixed() + 'px;' +
            '">y</div>';
    }
    function MakeImageContainer(x, y) {
        return '<div id="Square_' + x.toString() + y.toString() + '"' +
            ' class="ChessSquare"' +
            ' style="position:absolute; left:' +
            (SquarePixels * x).toFixed() + 'px; top:' +
            (SquarePixels * (7 - y)).toFixed() + 'px;' +
            ' background-color: ' + (((x + y) & 1) ? BgPale : BgDark) + '; ' +
            ' width: ' + SquarePixels + 'px; ' +
            ' height: ' + SquarePixels + 'px; ' +
            '"></div>';
    }
    function InitBoardDisplay() {
        var x, y;
        var mediaGroupDx = -15;
        var mediaHorSpacing = 60;
        var html = '<img id="RotateButton" src="shadow1/loop-circular-8x.png" alt="Rotate board" style="position:absolute; width:76px; height:64px; top:' +
            (SquarePixels * 8 + 45) + 'px; left: 1px;" title="Rotate board">\n';
        html += '<img id="PrevTurnButton" src="' + PrevButtonImage(false) + '" style="position:absolute; width:44px; height:44px; top:' +
            (SquarePixels * 8 + 55) + 'px; left:' + (SquarePixels * 4 - mediaHorSpacing + mediaGroupDx) + 'px;" title="Previous turn">\n';
        html += '<img id="PlayPauseStopButton" src="' + PlayStopImage(false) + '" style="position:absolute; width:44px; height:44px; top:' +
            (SquarePixels * 8 + 55) + 'px; left:' + (SquarePixels * 4 + 3 + mediaGroupDx) + 'px;" title="">\n';
        html += '<img id="NextTurnButton" src="' + NextButtonImage(false) + '" style="position:absolute; width:44px; height:44px; top:' +
            (SquarePixels * 8 + 55) + 'px; left:' + (SquarePixels * 4 + mediaHorSpacing + mediaGroupDx) + 'px;" title="Next turn">\n';
        for (y = 0; y < 8; ++y) {
            for (x = 0; x < 8; ++x) {
                html += MakeImageContainer(x, y);
            }
        }
        for (x = 0; x < 8; ++x) {
            html += MakeFileLabel(x);
        }
        for (x = 0; x < 8; ++x) {
            html += MakeRankLabel(x);
        }
        document.getElementById('DivBoard').innerHTML = html;
    }
    function AlgCoords(alg) {
        var chessX = 'abcdefgh'.indexOf(alg.charAt(0));
        var chessY = '12345678'.indexOf(alg.charAt(1));
        var screenX = RotateFlag ? (7 - chessX) : chessX;
        var screenY = RotateFlag ? (7 - chessY) : chessY;
        return {
            alg: alg,
            chessX: chessX,
            chessY: chessY,
            screenX: screenX,
            screenY: screenY,
            selector: 'Square_' + screenX.toFixed() + screenY.toFixed()
        };
    }
    function MoveCoords(move) {
        var sourceAlg = Flywheel.Board.Algebraic(move.source);
        var destAlg = Flywheel.Board.Algebraic(move.dest);
        return { source: AlgCoords(sourceAlg), dest: AlgCoords(destAlg) };
    }
    function ForEachSquareDiv(visitor) {
        for (var x = 0; x < 8; ++x) {
            for (var y = 0; y < 8; ++y) {
                var id = 'Square_' + x.toFixed() + y.toFixed();
                var elem = document.getElementById(id);
                visitor(elem);
            }
        }
    }
    function ClassList(elem) {
        if (elem.className) {
            return elem.className.split(/\s+/g);
        }
        return [];
    }
    function RemoveClass(elem, classname) {
        //if (elem.classList && elem.classList.remove) {
        //    elem.classList.remove(classname);
        //} else {
        var classlist = ClassList(elem);
        var updated = [];
        var found = false;
        for (var _i = 0, classlist_1 = classlist; _i < classlist_1.length; _i++) {
            var cn = classlist_1[_i];
            if (cn === classname) {
                found = true;
            }
            else {
                updated.push(cn);
            }
        }
        if (found) {
            elem.className = updated.join(' ');
        }
        //}
        return elem;
    }
    function AddClass(elem, classname) {
        //if (elem.classList && elem.classList.add) {
        //    elem.classList.add(classname);
        //} else {
        var classlist = ClassList(elem);
        var found = false;
        for (var _i = 0, classlist_2 = classlist; _i < classlist_2.length; _i++) {
            var cn = classlist_2[_i];
            if (cn === classname) {
                found = true;
                break;
            }
        }
        if (!found) {
            classlist.push(classname);
            elem.className = classlist.join(' ');
        }
        //}
        return elem;
    }
    function HasClass(elem, classname) {
        for (var _i = 0, _a = ClassList(elem); _i < _a.length; _i++) {
            var cn = _a[_i];
            if (cn === classname) {
                return true;
            }
        }
        return false;
    }
    function SetMoveState(state) {
        MoveState = state;
        // Make all squares unselectable.
        ForEachSquareDiv(function (div) { return RemoveClass(div, 'UserCanSelect'); });
        var legal = TheBoard.LegalMoves();
        if (state === MoveStateType.SelectSource) {
            // Mark all squares that contain a piece the user can move with 'UserCanSelect' class.
            for (var _i = 0, legal_1 = legal; _i < legal_1.length; _i++) {
                var move = legal_1[_i];
                var coords = MoveCoords(move);
                var div = document.getElementById(coords.source.selector);
                AddClass(div, 'UserCanSelect');
            }
        }
        else if (state == MoveStateType.SelectDest) {
            for (var _a = 0, legal_2 = legal; _a < legal_2.length; _a++) {
                var move = legal_2[_a];
                var coords = MoveCoords(move);
                var div = document.getElementById(coords.source.selector);
                AddClass(div, 'UserCanSelect');
            }
        }
    }
    function DrawBoard(board) {
        for (var y = 0; y < 8; ++y) {
            var ry = RotateFlag ? (7 - y) : y;
            document.getElementById('RankLabel_' + ry.toFixed()).textContent = ('87654321'.charAt(y));
            document.getElementById('FileLabel_' + ry.toFixed()).textContent = ('abcdefgh'.charAt(y));
            for (var x = 0; x < 8; ++x) {
                var rx = RotateFlag ? (7 - x) : x;
                var sq = board.GetSquareByCoords(x, y);
                var sdiv = document.getElementById('Square_' + rx.toString() + ry.toString());
                sdiv.innerHTML = MakeImageHtml(sq);
            }
        }
        PrevTurnEnabled = board.CanPopMove();
        NextTurnEnabled = (GameHistoryIndex < GameHistory.length);
        document.getElementById('PrevTurnButton').setAttribute('src', PrevButtonImage(false));
        document.getElementById('NextTurnButton').setAttribute('src', NextButtonImage(false));
        document.getElementById('PlayPauseStopButton').setAttribute('src', PlayStopImage(false));
    }
    function BoardCoords(e) {
        var boardDiv = document.getElementById('DivBoard');
        var screenX = Math.floor((e.pageX - boardDiv.offsetLeft) / SquarePixels);
        var screenY = Math.floor(8.0 - ((e.pageY - boardDiv.offsetTop) / SquarePixels));
        var chessX = RotateFlag ? (7 - screenX) : screenX;
        var chessY = RotateFlag ? (7 - screenY) : screenY;
        if (chessX < 0 || chessX > 7 || chessY < 0 || chessY > 7) {
            return null; // outside the board
        }
        return {
            screenX: screenX,
            screenY: screenY,
            chessX: chessX,
            chessY: chessY,
            selector: 'Square_' + screenX.toFixed() + screenY.toFixed()
        };
    }
    function OnSquareHoverIn() {
        if (HasClass(this, 'UserCanSelect')) {
            AddClass(this, 'ChessSquareHover');
        }
    }
    function OnSquareHoverOut() {
        RemoveClass(this, 'ChessSquareHover');
    }
    function OnSquareClicked(e) {
        if (e.which === 1) {
            var bc = BoardCoords(e);
            if (bc) {
                if (MoveState === MoveStateType.SelectSource) {
                    if (HasClass(this, 'UserCanSelect')) {
                        // Are we selecting source square or destination square?
                        SourceSquareSelector = this.id;
                        SetMoveState(MoveStateType.SelectDest);
                    }
                }
                else if (MoveState === MoveStateType.SelectDest) {
                    // Find matching (source,dest) pair in legal move list, make move on board, redraw board.
                    var legal = TheBoard.LegalMoves();
                    var chosenMove = null;
                    for (var _i = 0, legal_3 = legal; _i < legal_3.length; _i++) {
                        var move = legal_3[_i];
                        var coords = MoveCoords(move);
                        if (coords.dest.selector === this.id) {
                            if (coords.source.selector === SourceSquareSelector) {
                                // !!! FIXFIXFIX - check for pawn promotion, prompt for promotion piece
                                chosenMove = move;
                            }
                        }
                    }
                    if (chosenMove) {
                        TheBoard.PushMove(chosenMove);
                        if ((GameHistoryIndex < GameHistory.length) && chosenMove.Equals(GameHistory[GameHistoryIndex])) {
                            // Special case: treat this move as a redo, so don't disrupt the history.
                            ++GameHistoryIndex;
                        }
                        else {
                            GameHistory = TheBoard.MoveHistory();
                            GameHistoryIndex = GameHistory.length;
                        }
                        DrawBoard(TheBoard);
                        var result = TheBoard.GetGameResult();
                        if (result.status === Flywheel.GameStatus.InProgress) {
                            // FIXFIXFIX - check for computer opponent
                            SetMoveState(MoveStateType.SelectSource);
                        }
                        else {
                            // Game is over!
                            SetMoveState(MoveStateType.GameOver);
                        }
                    }
                    else {
                        // Not a valid move, so cancel the current move and start over.
                        SetMoveState(MoveStateType.SelectSource);
                    }
                }
                else {
                }
            }
        }
    }
    function InitControls() {
        var boardDiv = document.getElementById('DivBoard');
        boardDiv.onmousedown = function (e) {
            if (e.which === 1) {
                var bc = BoardCoords(e);
                if (bc) {
                }
            }
        };
        for (var x = 0; x < 8; ++x) {
            for (var y = 0; y < 8; ++y) {
                var sq = document.getElementById('Square_' + x.toFixed() + y.toFixed());
                sq.onmouseover = OnSquareHoverIn;
                sq.onmouseout = OnSquareHoverOut;
                sq.onclick = OnSquareClicked;
            }
        }
        var rotateButton = document.getElementById('RotateButton');
        rotateButton.onclick = function () {
            // click
            RotateFlag = !RotateFlag;
            DrawBoard(TheBoard);
            SetMoveState(MoveState); // refresh clickable squares
        };
        rotateButton.onmouseover = function () {
            rotateButton.setAttribute('src', 'shadow2/loop-circular-8x.png');
        };
        rotateButton.onmouseout = function () {
            rotateButton.setAttribute('src', 'shadow1/loop-circular-8x.png');
        };
        var prevTurnButton = document.getElementById('PrevTurnButton');
        prevTurnButton.onclick = function () {
            // click
            if (PrevTurnEnabled) {
                // TODO: Cancel any computer analysis here.
                TheBoard.PopMove();
                --GameHistoryIndex;
                DrawBoard(TheBoard);
                SetMoveState(MoveStateType.SelectSource);
            }
        };
        prevTurnButton.onmouseover = function () {
            prevTurnButton.setAttribute('src', PrevButtonImage(true));
        };
        prevTurnButton.onmouseout = function () {
            prevTurnButton.setAttribute('src', PrevButtonImage(false));
        };
        var nextTurnButton = document.getElementById('NextTurnButton');
        nextTurnButton.onclick = function () {
            // click
            if (NextTurnEnabled) {
                TheBoard.PushMove(GameHistory[GameHistoryIndex++]);
                DrawBoard(TheBoard);
                SetMoveState(MoveStateType.SelectSource);
            }
        };
        nextTurnButton.onmouseover = function () {
            nextTurnButton.setAttribute('src', NextButtonImage(true));
        };
        nextTurnButton.onmouseout = function () {
            nextTurnButton.setAttribute('src', NextButtonImage(false));
        };
        var playPauseStopButton = document.getElementById('PlayPauseStopButton');
        playPauseStopButton.onclick = function () {
            if (PlayStopEnabled) {
            }
        };
        playPauseStopButton.onmouseover = function () {
            playPauseStopButton.setAttribute('src', PlayStopImage(true));
        };
        playPauseStopButton.onmouseout = function () {
            playPauseStopButton.setAttribute('src', PlayStopImage(false));
        };
    }
    function InitPage() {
        InitBoardDisplay();
        DrawBoard(TheBoard);
        InitControls();
        SetMoveState(MoveStateType.SelectSource);
    }
    FwDemo.InitPage = InitPage;
})(FwDemo || (FwDemo = {}));
window.onload = FwDemo.InitPage;
