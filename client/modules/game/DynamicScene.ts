/// <reference path="../core/AbstractScene.ts" />
/// <reference path="../core/manager/ActorManager.ts" />
/*
 * Scene implementation for managing dynamic rendering
 */
class DynamicScene extends AbstractScene {

    FPS = 20;
    refreshInterval = 1000 / this.FPS;

    autoFPS = true;
    secondFPS = 0;
    countFPS = 0;
    lastFPS = 0;
    fpsPerformance = [22, 21, 20];

    hero: IActor;
    events: IActor[];

    constructor(grid: DynamicGrid, canvas: HTMLCanvasElement) {
        super(grid);
        this.context = <CanvasRenderingContext2D> canvas.getContext("2d");
    }

    protected mainGameLoop_pre() {
        if (!super.mainGameLoop_pre()) {
            return false;
        }

        let scene = this; 
        let time = Utils.now();
        if(!Utils.isEmpty(this.hero)) {
            ActorManager.update(this.hero, time);
            ActorManager.manageMovements(this.map, this.grid, this.hero, function(w: number, h: number) {
                // Move the focus
                scene.grid.changeTranslation(scene.focus.x + w, scene.focus.y + h, scene.map.width, scene.map.height);
            }, function(w: number, h: number) {
                // Update focus
                scene.focus.x += w;
                scene.focus.y += h;
            });
        }
        if (!Utils.isEmpty(this.events)) {
            for (let actor of this.events) {
                ActorManager.update(actor, time);
                ActorManager.manageMovements(this.map, this.grid, actor, function(){}, function(){});
            }
        }
        
        // Events logic
        //this.manageMovements();
        
        return true;
    }

    protected mainGameLoop_post(boundariesX: IRange, boundariesY: IRange) {
        super.mainGameLoop_post(boundariesX, boundariesY);

        //TODO rimuovere a regime
        this.context.fillStyle = "#000000";
        this.context.font = "bold 40px Arial";
        this.context.fillText("(it's not ready yet)", this.grid.getCurrentTranslation().x + 160, this.grid.getCurrentTranslation().y + 260);

        this.renderFPS();
    }

    toggleFPS(enable?: boolean) {
        if (enable != null) {
            this.renderingConfiguration.showFPS = enable;
        } else {
            this.renderingConfiguration.showFPS = !this.renderingConfiguration.showFPS;
        }
    }

    private renderFPS() {
        var seconds = Math.floor(Utils.now() / 1000);
        if (seconds === this.secondFPS) {
            this.countFPS++;
        } else {
            this.lastFPS = this.countFPS;
            this.countFPS = 1;
            this.secondFPS = seconds;
            if (this.autoFPS === true) {
                this.fpsPerformance.shift();
                this.fpsPerformance[2] = this.lastFPS;
                var avg: number = (this.fpsPerformance[0] + this.fpsPerformance[1] + this.fpsPerformance[2]) / 3;
                this.FPS = Math.ceil(avg) + 2;
            }
        }

        if (this.renderingConfiguration.showFPS) {
            this.context.fillStyle = Constant.Color.RED;
            this.context.font = "bold 18px Arial";
            this.context.fillText("" + this.lastFPS, this.grid.getCurrentTranslation().x + 10, this.grid.getCurrentTranslation().y + 20);
        }
    }

    protected renderInterLayerElements(layerIndex: number, minRow: number, maxRow: number, minColumn: number, maxColumn: number) {       
        if(layerIndex === Constant.MapLayer.EVENTS) {
            
            if(ActorManager.isVisible(this.hero, minRow, maxRow, minColumn, maxColumn)) {
                ActorManager.render(this.grid, this.hero, this.context);
            }
            
            if (!Utils.isEmpty(this.events)) {
                for (let actor of this.events) {
                    if(ActorManager.isVisible(actor, minRow, maxRow, minColumn, maxColumn)) {    
                        ActorManager.render(this.grid, actor, this.context);
                    }
                }
            }  
        }
    }

    protected renderTopLayerElements(minRow: number, maxRow: number, minColumn: number, maxColumn: number) {
        MapManager.renderUI(this.map, this.grid, this.context, this.renderingConfiguration, minRow, maxRow, minColumn, maxColumn);
    }

    public loadSave(save: ISave, callback: IBooleanCallback) {
        var scene = this;
        
        let callback2: IBooleanCallback = function(result) {
            // Initialize every actor in the map
            if(result && !Utils.isEmpty(scene.map.layers)) {

                scene.events = MapManager.getActors(scene.map);
                for(let i=0; i<scene.events.length; i++) {
                    scene.events[i] = ActorManager.initTransientData(this.grid, scene.events[i]);   
                }
                console.log(scene.events);
            }
            callback(result);
        };

        let mapId;
        let hero: IActor;
        if (Utils.isEmpty(save)) {
            // Nothing to load
            if (Utils.isEmpty(this.map)) {
                mapId = "0"; // Load first map
                hero = ActorManager.getNewHero();
            } else {
                // Leave current map
                callback(false);
                return;
            }
        } else {
            // Load map from save
            mapId = save.map;
            hero = save.hero;
        }
        
        this.hero = ActorManager.initTransientData(this.grid, hero);

        MapManager.loadMap(mapId, this.context.canvas, function(map: IMap) {
            scene.changeMap(map, function() {
                scene.resetTranslation();
                scene.focus = scene.grid.mapCellToCanvas(hero);
                callback(true);
            });
        });
    }
    
    //TODO move to SaveManager
    public getSave(): ISave {
        if (Utils.isEmpty(this.map) || Utils.isEmpty(this.focus)) {
            return null;
        } else {
            return {
                id: 0,
                map: this.map.id,
                hero: this.hero
            };
        }
    }
 
    startMovement(i: number, j: number) {
        ActorManager.startMovement(this.grid, this.hero, i, j);    
    }
}