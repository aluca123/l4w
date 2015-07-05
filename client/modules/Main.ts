/// <reference path="Display.ts" />
/// <reference path="Input.ts" />
/// <reference path="core/Scene.ts" />

module Main {

    export function start(canvas: HTMLCanvasElement) {
        initDisplay(canvas);
        initInput(canvas);
        
        Scene.start(canvas.getContext("2d"));
    }

    function initDisplay(canvas: HTMLCanvasElement) {
        Display.init(canvas);
    }

    function initInput(canvas: HTMLCanvasElement) {
        var inputCallbackMap: Map<string, Input.IKeyboardCallback> = new Map<string, Input.IKeyboardCallback>();
        inputCallbackMap[Input.Keys.UP] = function(e) { console.log("Up"); };
        inputCallbackMap[Input.Keys.DOWN] = function(e) { console.log("Down"); };
        inputCallbackMap[Input.Keys.LEFT] = function(e) { console.log("Left"); };
        inputCallbackMap[Input.Keys.RIGHT] = function(e) { console.log("Right"); };

        Input.init(
            canvas,
            inputCallbackMap,
            function() { console.log("reset"); },
            function() { console.log("action"); },
            function() { console.log("start"); },
            function() {
                //End
                Scene.updatePointer(null,null);
            },
            function(x, y) {
                //Ongoing
                Scene.updatePointer(x, y);
            },
            function(x, y) {
            	//Hover
                Scene.updatePointer(x, y);
            },
            function() {
                console.log("pause");
                Scene.togglePause(true);
            },
            function() {
                console.log("unpause");
                Scene.togglePause(false);
            },
            function() { console.log("resize"); },
            function() { console.log("rightClick"); },
            function() { console.log("doubleClick"); },
            function() { console.log("wheel"); }
            );
    };

}