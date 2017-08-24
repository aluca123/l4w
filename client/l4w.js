;
;
;
class BlockDirection {
}
BlockDirection.UP = Math.pow(2, 0);
BlockDirection.DOWN = Math.pow(2, 1);
BlockDirection.LEFT = Math.pow(2, 2);
BlockDirection.RIGHT = Math.pow(2, 3);
;
;
;
class RenderConfiguration {
    constructor() {
        this.showGrid = false;
        this.showEditorGrid = false;
        this.showFPS = false;
        this.showCellNumbers = false;
        this.showFocus = false;
        this.enableSelection = false;
        this.showBlocks = false;
        this.enableAntialiasing = true;
        this.fps = 0;
    }
}
;
;
;
var Constant;
(function (Constant) {
    Constant.DOUBLE_PI = Math.PI * 2;
    class Color {
    }
    Color.YELLOW = "yellow";
    Color.RED = "red";
    Color.WHITE = "white";
    Color.GREY = "grey";
    Color.BLACK = "black";
    Constant.Color = Color;
    class RequestType {
    }
    RequestType.GET = "GET";
    RequestType.POST = "POST";
    Constant.RequestType = RequestType;
    let MapLayer;
    (function (MapLayer) {
        MapLayer[MapLayer["LOW"] = 0] = "LOW";
        MapLayer[MapLayer["MID"] = 1] = "MID";
        MapLayer[MapLayer["TOP"] = 2] = "TOP";
        MapLayer[MapLayer["EVENTS"] = 3] = "EVENTS";
    })(MapLayer = Constant.MapLayer || (Constant.MapLayer = {}));
    let EditMode;
    (function (EditMode) {
        EditMode[EditMode["APPLY"] = 0] = "APPLY";
        EditMode[EditMode["ERASE"] = 1] = "ERASE";
    })(EditMode = Constant.EditMode || (Constant.EditMode = {}));
    let TileEditMode;
    (function (TileEditMode) {
        TileEditMode[TileEditMode["NONE"] = 0] = "NONE";
        TileEditMode[TileEditMode["BLOCKS"] = 1] = "BLOCKS";
    })(TileEditMode = Constant.TileEditMode || (Constant.TileEditMode = {}));
})(Constant || (Constant = {}));
var Resource;
(function (Resource) {
    const DATA_PATH = base_path + "data/";
    const ASSET_PATH = base_path + "assets/";
    const EDIT_PATH = base_path + "edit/";
    const CACHE_SEPARATOR = "@";
    const DEFAULT_NAME = "404.png";
    var resourceCache = new Map();
    var propertiesCache = new Map();
    function loadProperties(onLoadCallback, file = "l4w") {
        if (propertiesCache.has(file)) {
            onLoadCallback(propertiesCache.get(file));
        }
        else {
            function parsePropertiesCallback(e) {
                var props = parseProperties(this.responseText);
                propertiesCache.set(file, props);
                onLoadCallback(props);
            }
            sendGETRequest(DATA_PATH + "properties/" + file + ".properties", parsePropertiesCallback);
        }
    }
    Resource.loadProperties = loadProperties;
    ;
    function parseProperties(content) {
        var props = new Map();
        var lines = content.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line !== "" && line.indexOf("#") !== 0) {
                var lineTokens = line.split("=");
                var value = +lineTokens[1];
                if (!isNaN(value)) {
                    props.set(lineTokens[0], value);
                }
                else {
                    if (props.has(lineTokens[1])) {
                        props.set(lineTokens[0], props.get(lineTokens[1]));
                    }
                    else {
                        console.error("Error parsing properties file at line " + i + ": " + value);
                    }
                }
            }
        }
        return props;
    }
    ;
    function sendGETRequest(uri, callback) {
        sendRequest(Constant.RequestType.GET, null, uri, callback);
    }
    ;
    function sendPOSTRequest(uri, data, callback) {
        sendRequest(Constant.RequestType.POST, data, uri, callback);
    }
    ;
    function sendRequest(requestType, data, uri, callback) {
        var request = new XMLHttpRequest();
        request.onload = callback;
        request.onerror = function (e) {
            console.error("Error while getting " + uri);
            console.log(e);
            callback(null);
        };
        request.ontimeout = function () {
            console.error("Timeout while getting " + uri);
            callback(null);
        };
        request.open(requestType, uri, true);
        try {
            if (!Utils.isEmpty(data) && requestType === Constant.RequestType.POST) {
                request.send(data);
            }
            else {
                request.send();
            }
        }
        catch (exception) {
            if (exception.name === "NetworkError") {
                console.error("If you are working locally on Chrome, please launch it with option --allow-file-access-from-files");
            }
            else {
                console.error(exception);
                console.trace();
            }
            callback(null);
        }
    }
    function load(file, assetType, callback) {
        if (Utils.isEmpty(file)) {
            console.error("Trying to load empty file!");
            console.trace();
        }
        var path = getResourcePath(file, assetType);
        switch (assetType) {
            case 0:
            case 1:
            case 2:
            case 3:
                var loader = $(document.createElement("img"));
                loader.attr("src", path);
                loader.load(function () {
                    resourceCache.set(assetType + CACHE_SEPARATOR + file, loader[0]);
                    callback(loader);
                });
                break;
            case 4:
            case 5:
            case 6:
                sendGETRequest(path, function (e) {
                    callback(this.responseText);
                });
                break;
            default:
                console.error("Unexpected resource type");
                console.trace();
                callback(null);
        }
    }
    Resource.load = load;
    function loadImageFromCache(file, assetType) {
        let image = resourceCache.get(assetType + CACHE_SEPARATOR + file);
        if (Utils.isEmpty(image)) {
            load(file, assetType, function (loader) {
                resourceCache.set(assetType + CACHE_SEPARATOR + file, loader[0]);
            });
        }
        return image;
    }
    Resource.loadImageFromCache = loadImageFromCache;
    function loadDefaultImage(assetType) {
        return loadImageFromCache(DEFAULT_NAME, assetType);
    }
    Resource.loadDefaultImage = loadDefaultImage;
    function save(id, data, assetType, callback) {
        var path = getEditPath(id, assetType);
        sendPOSTRequest(path, data, function (e) {
            if (this.status === 200) {
                callback(true);
            }
            else {
                console.error(this.status + " - " + this.response);
                callback(false);
            }
        });
    }
    Resource.save = save;
    function getResourcePath(file, assetType) {
        var path;
        switch (assetType) {
            case 0:
            case 1:
            case 2:
            case 3:
                path = ASSET_PATH;
                switch (assetType) {
                    case 0:
                        path += "charset/";
                        break;
                    case 1:
                        path += "faceset/";
                        break;
                    case 2:
                        path += "skin/";
                        break;
                    case 3:
                        path += "tile/";
                        break;
                    default:
                        console.error("Unexpected resource type");
                        console.trace();
                }
                ;
                break;
            case 4:
            case 5:
            case 6:
                path = DATA_PATH;
                switch (assetType) {
                    case 4:
                        path += "map/";
                        break;
                    case 5:
                        path += "save/";
                        break;
                    case 6:
                        path += "tileset/";
                        break;
                    default:
                        console.error("Unexpected resource type");
                        console.trace();
                }
                ;
                break;
            default:
                console.error("Unexpected resource type");
                console.trace();
        }
        ;
        return path + file;
    }
    function getEditPath(file, assetType) {
        var path = EDIT_PATH;
        switch (assetType) {
            case 4:
                path += "map/";
                break;
            case 5:
                path += "save/";
                break;
            case 6:
                path += "tileset/";
                break;
            default:
                console.error("Unexpected resource type");
                console.trace();
        }
        ;
        return path + file;
    }
})(Resource || (Resource = {}));
var GridTypeEnum;
(function (GridTypeEnum) {
    GridTypeEnum[GridTypeEnum["game"] = 0] = "game";
    GridTypeEnum[GridTypeEnum["mapper"] = 1] = "mapper";
    GridTypeEnum[GridTypeEnum["tilePicker"] = 2] = "tilePicker";
})(GridTypeEnum || (GridTypeEnum = {}));
;
class AbstractGrid {
    constructor(canvas, onCompleted, gridType) {
        this.canvas = canvas;
        this.currentTranslation = { x: 0, y: 0 };
        this.gridType = gridType;
        (function (grid) {
            Resource.loadProperties(function (props) {
                grid.deferredInit(props);
                grid.updateSizingDerivates();
                grid.refresh();
                onCompleted(grid);
            });
        })(this);
    }
    deferredInit(props) {
        this.cellH = props.get("cellHeight");
        this.cellW = props.get("cellWidth");
        this.rows = props.get(GridTypeEnum[this.gridType] + "Rows");
        this.columns = props.get(GridTypeEnum[this.gridType] + "Columns");
    }
    updateSizingDerivates() {
        this.baseH = this.cellH * this.rows;
        this.baseW = this.cellW * this.columns;
        this.halfRows = Math.floor(this.rows / 2);
        this.halfColumns = Math.floor(this.columns / 2);
    }
    refresh() {
        this.canvas.width = this.baseW * this.scaleX;
        this.canvas.height = this.baseH * this.scaleY;
    }
    clear(context) {
        context.clearRect(this.currentTranslation.x, this.currentTranslation.y, this.baseW + this.currentTranslation.x, this.baseH + this.currentTranslation.y);
    }
    mapPositionToGrid(position) {
        let rect = this.canvas.getBoundingClientRect();
        let i = Math.floor((position.x - rect.left) / (this.cellW * this.scaleX) + this.currentTranslation.x / this.cellW);
        let j = Math.floor((position.y - rect.top) / (this.cellH * this.scaleY) + this.currentTranslation.y / this.cellH);
        return {
            i: i,
            j: j
        };
    }
    mapCellToCanvas(position) {
        return {
            x: position.i * this.cellW,
            y: position.j * this.cellH
        };
    }
    mapCanvasToCell(position) {
        return {
            i: Math.floor(position.x / this.cellW),
            j: Math.floor(position.y / this.cellH)
        };
    }
    changeTranslation(focusX, focusY, maxColumns, maxRows) {
        let leftTopX = focusX - (this.halfColumns * this.cellW);
        if (leftTopX < 0) {
            leftTopX = 0;
        }
        else {
            let maxTranslationX = (maxColumns - this.columns) * this.cellW;
            if (leftTopX > maxTranslationX) {
                leftTopX = maxTranslationX;
            }
        }
        let leftTopY = focusY - (this.halfRows * this.cellH);
        if (leftTopY < 0) {
            leftTopY = 0;
        }
        else {
            let maxTranslationY = (maxRows - this.rows) * this.cellH;
            if (leftTopY > maxTranslationY) {
                leftTopY = maxTranslationY;
            }
        }
        let context = this.canvas.getContext("2d");
        context.translate(this.currentTranslation.x - leftTopX, this.currentTranslation.y - leftTopY);
        this.currentTranslation = { x: leftTopX, y: leftTopY };
        return this.currentTranslation;
    }
    getCurrentTranslation() {
        return this.currentTranslation;
    }
    resetTranslation() {
        let context = this.canvas.getContext("2d");
        context.translate(this.currentTranslation.x, this.currentTranslation.y);
        this.currentTranslation = { x: 0, y: 0 };
    }
    getBoundariesX(focusX, columns) {
        let focusColumn = Math.floor(focusX / this.cellW);
        let min = focusColumn - this.halfColumns - 1;
        let max = focusColumn + this.halfColumns + 1;
        return this.checkBoundariesLimit(min, max, columns);
    }
    getBoundariesY(focusY, rows) {
        let focusRow = Math.floor(focusY / this.cellH);
        let min = focusRow - this.halfRows - 1;
        let max = focusRow + this.halfRows + 1;
        return this.checkBoundariesLimit(min, max, rows);
    }
    checkBoundariesLimit(min, max, maxLimit) {
        if (min < 0) {
            max -= min;
            min = 0;
        }
        if (max >= maxLimit) {
            min -= (max - maxLimit + 1);
            max = maxLimit - 1;
        }
        return {
            min: min,
            max: max
        };
    }
}
var Utils;
(function (Utils) {
    function isEmpty(obj) {
        if (obj === null || typeof obj === "undefined") {
            return true;
        }
        else if (typeof obj === "string") {
            return obj === "";
        }
        else if (typeof obj === "object" && "size" in obj) {
            return obj.size === 0;
        }
        else if (obj.constructor === Array || obj.constructor === String) {
            return obj.length === 0;
        }
        return false;
    }
    Utils.isEmpty = isEmpty;
    function now() {
        return (new Date()).getTime();
    }
    Utils.now = now;
    function mergeMaps(primary, secondary) {
        var newMap = new Map();
        function addToNewMap(value, index, map) {
            newMap.set(index, value);
        }
        secondary.forEach(addToNewMap);
        primary.forEach(addToNewMap);
        return newMap;
    }
    Utils.mergeMaps = mergeMaps;
    function gidToCell(gid, width) {
        return {
            i: gid % width,
            j: Math.floor(gid / width)
        };
    }
    Utils.gidToCell = gidToCell;
    function cellToGid(cell, width) {
        return cell.i + cell.j * width;
    }
    Utils.cellToGid = cellToGid;
    function isBlocked(block, blockDirection) {
        return (block & blockDirection) === blockDirection;
    }
    Utils.isBlocked = isBlocked;
    function getBlock(up, down, left, right) {
        let block = 0;
        block |= up ? BlockDirection.UP : 0;
        block |= down ? BlockDirection.DOWN : 0;
        block |= left ? BlockDirection.LEFT : 0;
        block |= right ? BlockDirection.RIGHT : 0;
        return block;
    }
    Utils.getBlock = getBlock;
    function isDirectionsOpposed(d1, d2) {
        return getOpposedDirections(d1) === d2;
    }
    Utils.isDirectionsOpposed = isDirectionsOpposed;
    function getOpposedDirections(d) {
        switch (d) {
            case 0: return 1;
            case 1: return 0;
            case 2: return 3;
            case 3: return 2;
        }
        return 4;
    }
    Utils.getOpposedDirections = getOpposedDirections;
    function getDirection(target, start) {
        let distI = target.i - start.i;
        let distJ = target.j - start.j;
        let direction;
        if (Math.abs(distI) > Math.abs(distJ)) {
            if (distI > 0) {
                direction = 3;
            }
            else {
                direction = 2;
            }
        }
        else {
            if (distJ > 0) {
                direction = 1;
            }
            else if (distJ < 0) {
                direction = 0;
            }
            else {
                direction = 4;
            }
        }
        return direction;
    }
    Utils.getDirection = getDirection;
    function getRandomBoolean() {
        return Math.random() >= 0.5;
    }
    Utils.getRandomBoolean = getRandomBoolean;
})(Utils || (Utils = {}));
;
;
;
;
;
;
;
var MapManager;
(function (MapManager) {
    let PathfinderEnum;
    (function (PathfinderEnum) {
        PathfinderEnum[PathfinderEnum["BASIC"] = 0] = "BASIC";
        PathfinderEnum[PathfinderEnum["D_STAR_LITE"] = 1] = "D_STAR_LITE";
    })(PathfinderEnum = MapManager.PathfinderEnum || (MapManager.PathfinderEnum = {}));
    function loadMap(mapId, canvas, callback) {
        Resource.load(mapId + "", 4, function (resourceText) {
            if (Utils.isEmpty(resourceText)) {
                console.error("Error while loading map: " + mapId);
                callback(null);
            }
            else {
                try {
                    let map = JSON.parse(resourceText);
                    callback(map);
                }
                catch (exception) {
                    if (exception.name === "SyntaxError") {
                        console.error("Error while parsing map: " + mapId);
                    }
                    else if (exception.name === "TypeError") {
                        console.error("Error while reading map: " + mapId);
                    }
                    else {
                        console.error(exception);
                    }
                    Errors.showError(canvas.getContext("2d"));
                    callback(null);
                }
            }
        });
    }
    MapManager.loadMap = loadMap;
    function renderLayer(grid, map, layer, tileImage, context, minRow, maxRow, minColumn, maxColumn) {
        if (!Utils.isEmpty(layer.data)) {
            for (let y = minRow; y <= maxRow; y++) {
                for (let x = minColumn; x <= maxColumn; x++) {
                    let cellIndex = x + y * map.width;
                    if (layer.data.length < cellIndex) {
                        return;
                    }
                    let tileGID = layer.data[cellIndex];
                    if (tileGID === null) {
                        continue;
                    }
                    let tileCell = Utils.gidToCell(tileGID, Math.floor(map.tileset.imagewidth / grid.cellW));
                    context.drawImage(tileImage, Math.floor(tileCell.i * grid.cellW), Math.floor(tileCell.j * grid.cellH), grid.cellW, grid.cellH, Math.floor(x * grid.cellW), Math.floor(y * grid.cellH), grid.cellW, grid.cellH);
                }
            }
        }
    }
    MapManager.renderLayer = renderLayer;
    function renderGlobalEffects(grid, context, minRow, maxRow, minColumn, maxColumn) {
    }
    MapManager.renderGlobalEffects = renderGlobalEffects;
    function renderUI(map, grid, context, renderingConfiguration, minRow, maxRow, minColumn, maxColumn) {
        for (let i = minColumn; i <= maxColumn; i++) {
            for (let j = minRow; j <= maxRow; j++) {
                if (!Utils.isEmpty(renderingConfiguration)) {
                    if (renderingConfiguration.showBlocks && !Utils.isEmpty(map) && !Utils.isEmpty(map.blocks)) {
                        context.save();
                        context.globalAlpha = 0.9;
                        context.fillStyle = Constant.Color.YELLOW;
                        let blockMarkSize = 6;
                        let blockMarkHalfSize = Math.floor(blockMarkSize / 2);
                        let blockValue = map.blocks[j * map.width + i];
                        if (blockValue > 0) {
                            if (Utils.isBlocked(blockValue, BlockDirection.UP)) {
                                context.fillRect((i + 0.5) * grid.cellW - blockMarkHalfSize, j * grid.cellH, blockMarkSize, blockMarkSize);
                            }
                            if (Utils.isBlocked(blockValue, BlockDirection.DOWN)) {
                                context.fillRect((i + 0.5) * grid.cellW - blockMarkHalfSize, (j + 1) * grid.cellH - blockMarkSize, blockMarkSize, blockMarkSize);
                            }
                            if (Utils.isBlocked(blockValue, BlockDirection.LEFT)) {
                                context.fillRect(i * grid.cellW, (j + 0.5) * grid.cellH - blockMarkHalfSize, blockMarkSize, blockMarkSize);
                            }
                            if (Utils.isBlocked(blockValue, BlockDirection.RIGHT)) {
                                context.fillRect((i + 1) * grid.cellW - blockMarkSize, (j + 0.5) * grid.cellH - blockMarkHalfSize, blockMarkSize, blockMarkSize);
                            }
                        }
                        context.restore();
                    }
                    if (renderingConfiguration.showGrid) {
                        context.strokeStyle = Constant.Color.RED;
                        context.strokeRect(i * grid.cellW, j * grid.cellH, grid.cellW, grid.cellH);
                    }
                    if (renderingConfiguration.showEditorGrid) {
                        context.save();
                        context.globalAlpha = 0.4;
                        context.strokeStyle = Constant.Color.GREY;
                        context.strokeRect(i * grid.cellW, j * grid.cellH, grid.cellW, grid.cellH);
                        context.restore();
                    }
                    if (renderingConfiguration.showCellNumbers) {
                        context.fillStyle = Constant.Color.RED;
                        context.font = "bold 10px Arial";
                        context.fillText(i + "," + j, i * grid.cellW + 1, j * grid.cellH + 10);
                    }
                }
            }
        }
    }
    MapManager.renderUI = renderUI;
    function renderGlobalUI(grid, context, renderingConfiguration) {
        if (!Utils.isEmpty(renderingConfiguration)) {
            if (renderingConfiguration.enableSelection && !Utils.isEmpty(renderingConfiguration.selectPointStart)) {
                let x = renderingConfiguration.selectPointStart.x * grid.cellW;
                let y = renderingConfiguration.selectPointStart.y * grid.cellH;
                let w;
                let h;
                if (Utils.isEmpty(renderingConfiguration.selectPointEnd)) {
                    h = grid.cellH;
                    w = grid.cellW;
                }
                else {
                    let x2 = renderingConfiguration.selectPointEnd.x * grid.cellW;
                    let y2 = renderingConfiguration.selectPointEnd.y * grid.cellH;
                    if (x > x2) {
                        w = x - x2;
                        x = x2;
                    }
                    else {
                        w = x2 - x;
                    }
                    if (y > y2) {
                        h = y - y2;
                        y = y2;
                    }
                    else {
                        h = y2 - y;
                    }
                    w += grid.cellW;
                    h += grid.cellH;
                }
                context.save();
                context.strokeStyle = Constant.Color.RED;
                context.lineWidth = 3;
                context.strokeRect(x, y, w, h);
                context.restore();
            }
        }
    }
    MapManager.renderGlobalUI = renderGlobalUI;
    function resizeMap(map, rows, columns) {
        let oldWidth = map.width;
        let newWidth = columns;
        let oldHeight = map.height;
        let newHeight = rows;
        if ((oldWidth === newWidth && oldHeight === newHeight) || Utils.isEmpty(map)) {
            return;
        }
        let referenceIndex = Math.min(oldWidth, newWidth);
        if (newWidth < oldWidth) {
            var removedColumns = oldWidth - newWidth;
        }
        else {
            var newColumns = [];
            for (let n = 0; n < newWidth - oldWidth; n++) {
                newColumns[n] = null;
            }
        }
        for (let i = 0; i < map.layers.length; i++) {
            let layer = map.layers[i];
            if (!Utils.isEmpty(layer.data)) {
                if (oldWidth !== newWidth) {
                    for (let y = 0; y < oldHeight; y++) {
                        if (!Utils.isEmpty(removedColumns)) {
                            layer.data.splice(referenceIndex + y * newWidth, removedColumns);
                        }
                        else {
                            Array.prototype.splice.apply(layer.data, [referenceIndex + y * newWidth, 0].concat(newColumns));
                        }
                    }
                }
                if (oldHeight > newHeight) {
                    layer.data.length = newWidth * newHeight;
                }
                if (oldHeight < newHeight) {
                    let newData = [];
                    for (let n = 0; n < newWidth - oldWidth; n++) {
                        newData[n] = null;
                    }
                    for (let i = oldWidth; i < newWidth; i++) {
                        layer.data.concat(newData);
                    }
                }
            }
        }
        map.height = rows;
        map.width = columns;
    }
    MapManager.resizeMap = resizeMap;
    function getActors(map) {
        let actors = [];
        if (!Utils.isEmpty(map.layers)) {
            for (let i = 0; i < map.layers.length; i++) {
                let layer = map.layers[i];
                if (!Utils.isEmpty(layer.objects)) {
                    actors = actors.concat(layer.objects);
                }
            }
        }
        return actors;
    }
    MapManager.getActors = getActors;
    function loadBlocks(map) {
        if (!Utils.isEmpty(map.layers) && !Utils.isEmpty(map.tileset.blocks)) {
            map.blocks = [];
            for (let j = 0; j < map.height * map.width; j++) {
                map.blocks[j] = 0;
            }
            for (let i = 0; i < map.layers.length; i++) {
                let layer = map.layers[i];
                if (!Utils.isEmpty(layer.data)) {
                    for (let j = 0; j < layer.data.length; j++) {
                        let tileCell = layer.data[j];
                        let blockValue = 0;
                        if (tileCell !== null && tileCell < map.tileset.blocks.length) {
                            blockValue = map.tileset.blocks[tileCell];
                        }
                        map.blocks[j] |= blockValue;
                    }
                }
            }
        }
    }
    MapManager.loadBlocks = loadBlocks;
    function isDirectionBlocked(map, i, j, direction) {
        switch (direction) {
            case 0:
                return Utils.isBlocked(map.blocks[j * map.width + i], BlockDirection.UP) || Utils.isBlocked(map.blocks[(j - 1) * map.width + i], BlockDirection.DOWN);
            case 1:
                return Utils.isBlocked(map.blocks[j * map.width + i], BlockDirection.DOWN) || Utils.isBlocked(map.blocks[(j + 1) * map.width + i], BlockDirection.UP);
            case 2:
                return Utils.isBlocked(map.blocks[j * map.width + i], BlockDirection.LEFT) || Utils.isBlocked(map.blocks[j * map.width + i - 1], BlockDirection.RIGHT);
            case 3:
                return Utils.isBlocked(map.blocks[j * map.width + i], BlockDirection.RIGHT) || Utils.isBlocked(map.blocks[j * map.width + i + 1], BlockDirection.LEFT);
        }
        ;
        return false;
    }
    MapManager.isDirectionBlocked = isDirectionBlocked;
    function pathFinder(map, actor, target, pathfinder = PathfinderEnum.BASIC) {
        let distI = target.i - actor.i;
        let distJ = target.j - actor.j;
        if (distI === 0 && distJ === 0) {
            return 4;
        }
        else {
            let direction;
            switch (pathfinder) {
                case PathfinderEnum.BASIC:
                    {
                        if (Math.abs(distI) > Math.abs(distJ)) {
                            if (distI > 0) {
                                direction = 3;
                            }
                            else {
                                direction = 2;
                            }
                            if (MapManager.isDirectionBlocked(map, actor.i, actor.j, direction)) {
                                if (distJ > 0) {
                                    direction = 1;
                                }
                                else {
                                    direction = 0;
                                }
                            }
                        }
                        else {
                            if (distJ > 0) {
                                direction = 1;
                            }
                            else {
                                direction = 0;
                            }
                            if (MapManager.isDirectionBlocked(map, actor.i, actor.j, direction)) {
                                if (distI > 0) {
                                    direction = 3;
                                }
                                else {
                                    direction = 2;
                                }
                            }
                        }
                        if (MapManager.isDirectionBlocked(map, actor.i, actor.j, direction)) {
                            direction = 4;
                        }
                        else {
                            ActorManager.addDirectionToPath(actor, direction, 3);
                            if (actor.path.length === 3 && actor.path[0] === actor.path[2] && Utils.isDirectionsOpposed(actor.path[0], actor.path[1])) {
                                direction = 4;
                            }
                        }
                    }
                    break;
                case PathfinderEnum.D_STAR_LITE:
                    {
                        var S;
                        var U;
                        var _g;
                        var _rhs;
                        const MAX = 9999;
                        var s_start;
                        var s_goal;
                        var s_last;
                        let km;
                        var width = map.width;
                        s_start = {
                            cell: actor
                        };
                        s_goal = {
                            cell: target
                        };
                        if (!Utils.isEmpty(map.dstarlitecache) && !isVertexEqual(map.dstarlitecache.s_goal, s_goal)) {
                            map.dstarlitecache = undefined;
                        }
                        if (!Utils.isEmpty(map.dstarlitecache)) {
                            S = map.dstarlitecache.S;
                            U = map.dstarlitecache.U;
                            _g = map.dstarlitecache.g;
                            _rhs = map.dstarlitecache.rhs;
                        }
                        else {
                            initialize();
                            computeShortestPath();
                        }
                        let s_min;
                        let s_min_c;
                        for (let s1 of succ(s_start)) {
                            let tmp = c(s_start, s1) + g(s1);
                            if (s_min_c === undefined || s_min_c > tmp) {
                                s_min_c = tmp;
                                s_min = s1;
                            }
                        }
                        s_start = s_min;
                        let direction = Utils.getDirection(s_start.cell, actor);
                        map.dstarlitecache.S = S;
                        map.dstarlitecache.U = U;
                        map.dstarlitecache.s_goal = s_goal;
                        map.dstarlitecache.g = _g;
                        map.dstarlitecache.rhs = _rhs;
                        function calculateKey(s) {
                            return [Math.min(g(s), rhs(s)) + h(s_start, s) + km, Math.min(g(s), rhs(s))];
                        }
                        ;
                        function initialize() {
                            s_last = s_start;
                            S = [];
                            for (let j = 0; j < map.height; j++) {
                                for (let i = 0; i < map.width; i++) {
                                    let v = {
                                        cell: {
                                            i: i,
                                            j: j
                                        }
                                    };
                                    S.push(v);
                                }
                            }
                            _g = [];
                            _rhs = [];
                            U = [];
                            km = 0;
                            for (let s of S) {
                                setG(s, MAX);
                                setRhs(s, MAX);
                                setRhs(s_goal, 0);
                                let vertex = s_goal;
                                vertex.key = [h(s_start, s_goal), 0];
                                U.push(vertex);
                            }
                        }
                        ;
                        function updateVertex(u) {
                            if (g(u) !== rhs(u)) {
                                u.key = calculateKey(u);
                                queueUpdate(u);
                            }
                            else if (queueContains(u)) {
                                queueRemove(u);
                            }
                        }
                        ;
                        function computeShortestPath() {
                            let uTop = queueTop();
                            while (compareKeys(uTop.key, calculateKey(s_start)) < 0 || rhs(s_start) > g(s_start)) {
                                let u = uTop;
                                let k_old = uTop.key;
                                let k_new = calculateKey(u);
                                if (k_old < k_new) {
                                    u.key = k_new;
                                    queueUpdate(u);
                                }
                                else if (g(u) > rhs(u)) {
                                    setG(u, rhs(u));
                                    queueRemove(u);
                                    for (let s of pred(u)) {
                                        if (!isVertexEqual(s, s_goal)) {
                                            setRhs(u, Math.min(rhs(s), c(s, u) + g(u)));
                                        }
                                        updateVertex(s);
                                    }
                                }
                                else {
                                    let g_old = g(u);
                                    setG(u, MAX);
                                    let array = pred(u);
                                    array.push(u);
                                    for (let s of array) {
                                        if (rhs(s) === c(s, u) + g_old) {
                                            if (!isVertexEqual(s, s_goal)) {
                                                let min;
                                                for (let s1 of succ(s)) {
                                                    let tmpMin = c(s, s1) + g(s1);
                                                    if (min === undefined || min > tmpMin) {
                                                        min = tmpMin;
                                                    }
                                                }
                                                setRhs(s, min);
                                            }
                                        }
                                        updateVertex(s);
                                    }
                                }
                            }
                        }
                        ;
                        function setG(u, val) {
                            let uid = Utils.cellToGid(u.cell, width);
                            _g[uid] = val;
                        }
                        ;
                        function setRhs(u, val) {
                            let uid = Utils.cellToGid(u.cell, width);
                            _rhs[uid] = val;
                        }
                        ;
                        function g(u) {
                            let uid = Utils.cellToGid(u.cell, width);
                            return _g[uid];
                        }
                        ;
                        function rhs(u) {
                            let uid = Utils.cellToGid(u.cell, width);
                            return _rhs[uid];
                        }
                        ;
                        function succ(s) {
                            let gid = Utils.cellToGid(s.cell, map.width);
                            S.length;
                            let succ = [];
                            if (gid - 1 > 0) {
                                succ.push(S[gid - 1]);
                            }
                            if (gid + 1 < S.length) {
                                succ.push(S[gid + 1]);
                            }
                            if (gid - map.width > 0) {
                                succ.push(S[gid - map.width]);
                            }
                            if (gid + map.width < S.length) {
                                succ.push(S[gid + map.width]);
                            }
                            return succ;
                        }
                        ;
                        function pred(s) {
                            let gid = Utils.cellToGid(s.cell, map.width);
                            let pred = [];
                            if (gid - 1 > 0) {
                                pred.push(S[gid - 1]);
                            }
                            if (gid + 1 < S.length) {
                                pred.push(S[gid + 1]);
                            }
                            if (gid - map.width > 0) {
                                pred.push(S[gid - map.width]);
                            }
                            if (gid + map.width < S.length) {
                                pred.push(S[gid + map.width]);
                            }
                            return pred;
                        }
                        ;
                        function c(s1, s2) {
                            let block = map.blocks[s2.cell.i + s2.cell.j * map.width];
                            if (block !== 0) {
                                let movementDirection;
                                if (s1.cell.i > s2.cell.i) {
                                    movementDirection = BlockDirection.RIGHT;
                                }
                                else if (s1.cell.i < s2.cell.i) {
                                    movementDirection = BlockDirection.LEFT;
                                }
                                else if (s1.cell.j > s2.cell.j) {
                                    movementDirection = BlockDirection.DOWN;
                                }
                                else {
                                    movementDirection = BlockDirection.UP;
                                }
                                if (Utils.isBlocked(block, movementDirection)) {
                                    return MAX;
                                }
                            }
                            block = map.blocks[s1.cell.i + s1.cell.j * map.width];
                            if (block !== 0) {
                                let movementDirection;
                                if (s1.cell.i > s2.cell.i) {
                                    movementDirection = BlockDirection.LEFT;
                                }
                                else if (s1.cell.i < s2.cell.i) {
                                    movementDirection = BlockDirection.RIGHT;
                                }
                                else if (s1.cell.j > s2.cell.j) {
                                    movementDirection = BlockDirection.UP;
                                }
                                else {
                                    movementDirection = BlockDirection.DOWN;
                                }
                                if (Utils.isBlocked(block, movementDirection)) {
                                    return MAX;
                                }
                            }
                            return 1;
                        }
                        ;
                        function h(s1, s2) {
                            let dx = Math.abs(s1.x - s2.x);
                            let dy = Math.abs(s1.y - s2.y);
                            return dx + dy;
                        }
                        ;
                        function compareKeys(_k1, _k2) {
                            if (_k1[0] === _k2[0] && _k1[1] === _k2[1]) {
                                return 0;
                            }
                            if (_k1[0] > _k1[0] || (_k1[0] === _k2[0] && _k1[1] > _k2[1])) {
                                return 1;
                            }
                            else {
                                return -1;
                            }
                        }
                        ;
                        function isVertexEqual(s1, s2) {
                            return s1.cell.i === s2.cell.i && s1.cell.j === s2.cell.j;
                        }
                        function queueContains(u) {
                            for (let u2 of U) {
                                if (isVertexEqual(u, u2)) {
                                    return true;
                                }
                            }
                            return false;
                        }
                        function queueUpdate(u) {
                            for (let u2 of U) {
                                if (isVertexEqual(u, u2)) {
                                    u2.key = u.key;
                                    return;
                                }
                            }
                            U.push(u);
                        }
                        function queueRemove(u) {
                            let newU = [];
                            for (let u2 of U) {
                                if (!isVertexEqual(u, u2)) {
                                    newU.push(u2);
                                }
                            }
                            U = newU;
                        }
                        function queueTop() {
                            let uMin;
                            for (let u2 of U) {
                                if (uMin === undefined || compareKeys(u2.key, uMin.key) < 0) {
                                    uMin = u2;
                                }
                            }
                            if (uMin === undefined) {
                                uMin = {
                                    cell: undefined,
                                    key: [MAX, MAX]
                                };
                            }
                            return uMin;
                        }
                    }
            }
            return direction;
        }
    }
    MapManager.pathFinder = pathFinder;
    function getNewMap(name) {
        return {
            "id": null,
            "name": name,
            "height": 20,
            "width": 25,
            "layers": [
                {
                    "data": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    "type": "tilelayer",
                    "x": 0,
                    "y": 0
                },
                {
                    "type": "tilelayer",
                    "x": 0,
                    "y": 0
                },
                {
                    "type": "tilelayer",
                    "x": 0,
                    "y": 0
                },
                {
                    "type": "tilelayer",
                    "x": 0,
                    "y": 0
                },
                {
                    "objects": [
                        {
                            "gid": 6,
                            "height": 32,
                            "id": 1,
                            "name": "signor evento",
                            "rotation": 0,
                            "visible": true,
                            "width": 32,
                            "i": 4,
                            "j": 2
                        }
                    ],
                    "opacity": 1,
                    "type": "objectgroup",
                    "x": 0,
                    "y": 0
                }
            ],
            "nextobjectid": 2,
            "tile": "002-Woods01.png"
        };
    }
    MapManager.getNewMap = getNewMap;
})(MapManager || (MapManager = {}));
var ActorManager;
(function (ActorManager) {
    const DEFAULT_MSPEED = 4 * 32 / 1000;
    const DEFAULT_FREQUENCY = 6 / 1000;
    function update(a, time) {
    }
    ActorManager.update = update;
    function setSpeed(grid, a, speed) {
        a.speed = speed;
        a.mSpeed = a.speed * grid.cellH / 1000;
    }
    ActorManager.setSpeed = setSpeed;
    function getMSpeed(a) {
        if (!Utils.isEmpty(a.mSpeed)) {
            return a.mSpeed;
        }
        else {
            return DEFAULT_MSPEED;
        }
    }
    ActorManager.getMSpeed = getMSpeed;
    function startMovement(grid, a, i, j) {
        a.newTarget = grid.mapCellToCanvas({
            i: i,
            j: j
        });
    }
    ActorManager.startMovement = startMovement;
    function render(grid, a, context) {
        let image;
        if (!Utils.isEmpty(a.charaset)) {
            image = Resource.loadImageFromCache(a.charaset, 0);
        }
        else if (!Utils.isEmpty(a.gid)) {
        }
        if (Utils.isEmpty(image)) {
            image = Resource.loadDefaultImage(0);
        }
        if (!Utils.isEmpty(image)) {
            let charaWidth = Math.floor(image.width / 4);
            let charaHeight = Math.floor(image.height / 4);
            let charaX = 0;
            if (!Utils.isEmpty(a.target)) {
                if (Utils.isEmpty(a.animationStartTime)) {
                    a.animationStartTime = Utils.now();
                }
                let animationTime = Utils.now() - a.animationStartTime;
                let frequency = DEFAULT_FREQUENCY;
                if (!Utils.isEmpty(a.frequency)) {
                    frequency = a.frequency;
                }
                let position = Math.floor((animationTime * frequency) % 4);
                switch (position) {
                    case 1:
                        charaX = charaWidth;
                        break;
                    case 2:
                        charaX = charaWidth * 2;
                        break;
                    case 3:
                        charaX = charaWidth * 3;
                        break;
                }
            }
            else {
                a.animationStartTime = undefined;
            }
            let charaY = 0;
            switch (a.direction) {
                case 2:
                    charaY = charaHeight;
                    break;
                case 3:
                    charaY = charaHeight * 2;
                    break;
                case 0:
                    charaY = charaHeight * 3;
                    break;
            }
            ;
            let x = a.position.x + Math.floor((grid.cellW - charaWidth) / 2);
            let y = a.position.y + Math.floor(-charaHeight + charaWidth * 2 / 3);
            let globalAlpha = context.globalAlpha;
            if (!Utils.isEmpty(a.opacity)) {
                context.globalAlpha = a.opacity;
            }
            context.drawImage(image, charaX, charaY, charaWidth, charaHeight, x, y, charaWidth, charaHeight);
            context.globalAlpha = globalAlpha;
        }
    }
    ActorManager.render = render;
    function getNewActor() {
        let actor = {
            id: 0,
            name: "",
            i: 0,
            j: 0
        };
        return actor;
    }
    ActorManager.getNewActor = getNewActor;
    function getNewHero() {
        let actor = getNewActor();
        actor.name = "Hero";
        actor.charaset = "fart.png";
        actor.i = 0;
        actor.j = 1;
        return actor;
    }
    ActorManager.getNewHero = getNewHero;
    function isVisible(a, minRow, maxRow, minColumn, maxColumn) {
        if (!Utils.isEmpty(a.visible) && !a.visible) {
            return false;
        }
        if (!Utils.isEmpty(a.opacity) && a.opacity === 0) {
            return false;
        }
        return a.i >= minColumn && a.i <= maxColumn && a.j >= minRow && a.j <= maxRow;
    }
    ActorManager.isVisible = isVisible;
    function manageMovements(map, grid, a, onCoordinatesChange, onCellChange, timeToMove = 0) {
        if (!Utils.isEmpty(a.movementStartTime)) {
            if (timeToMove === 0) {
                timeToMove = Utils.now() - a.movementStartTime;
            }
            let target = {
                i: a.target.x / grid.cellW,
                j: a.target.y / grid.cellH
            };
            let direction = MapManager.pathFinder(map, a, target);
            let movementX = 0;
            let movementY = 0;
            let absMovement;
            switch (direction) {
                case 2:
                    movementX = Math.min(grid.cellW, Math.floor(getMSpeed(a) * timeToMove));
                    absMovement = movementX;
                    movementX *= -1;
                    break;
                case 3:
                    movementX = Math.min(grid.cellW, Math.floor(getMSpeed(a) * timeToMove));
                    absMovement = movementX;
                    break;
                case 0:
                    movementY = Math.min(grid.cellH, Math.floor(getMSpeed(a) * timeToMove));
                    absMovement = movementY;
                    movementY *= -1;
                    break;
                case 1:
                    movementY = Math.min(grid.cellH, Math.floor(getMSpeed(a) * timeToMove));
                    absMovement = movementY;
                    break;
                case 4:
                    stopMovement(a);
                    break;
            }
            ;
            if (direction !== 4) {
                a.direction = direction;
                a.position.x = a.i * grid.cellW + movementX;
                a.position.y = a.j * grid.cellH + movementY;
                onCoordinatesChange(movementX, movementY);
                if (absMovement === grid.cellW) {
                    a.movementStartTime = Utils.now();
                    timeToMove -= absMovement / getMSpeed(a);
                    let cell = grid.mapCanvasToCell(a.position);
                    a.i = cell.i;
                    a.j = cell.j;
                    onCellChange(movementX, movementY);
                    if (!Utils.isEmpty(a.newTarget) || (a.position.x === a.target.x && a.position.y === a.target.y)) {
                        stopMovement(a);
                    }
                }
            }
        }
        if (!Utils.isEmpty(a.newTarget) && Utils.isEmpty(a.movementStartTime)) {
            a.target = a.newTarget;
            a.newTarget = undefined;
            a.movementStartTime = Utils.now();
            manageMovements(map, grid, a, onCoordinatesChange, onCellChange, timeToMove);
        }
    }
    ActorManager.manageMovements = manageMovements;
    function stopMovement(actor) {
        actor.path = undefined;
        actor.movementStartTime = undefined;
        actor.target = undefined;
    }
    function initTransientData(grid, a) {
        if (Utils.isEmpty(a.position)) {
            a.position = {
                x: a.i * grid.cellW,
                y: a.j * grid.cellH
            };
        }
        if (!Utils.isEmpty(a.speed)) {
            this.setSpeed(a, a.speed);
        }
        return a;
    }
    ActorManager.initTransientData = initTransientData;
    function addDirectionToPath(a, direction, stackLimit) {
        if (a.path === undefined) {
            a.path = [];
        }
        if (a.path[a.path.length - 1] !== direction) {
            a.path.push(direction);
        }
        if (!Utils.isEmpty(stackLimit) && a.path.length > stackLimit) {
            a.path.shift();
        }
    }
    ActorManager.addDirectionToPath = addDirectionToPath;
})(ActorManager || (ActorManager = {}));
;
var nextAnimationFrame = window.requestAnimationFrame ||
    function (callback) {
        window.setTimeout(this.mainGameLoop, 40);
    };
class AbstractScene {
    constructor(grid) {
        this.renderingConfiguration = new RenderConfiguration();
        this.grid = grid;
        this.paused = false;
        this.focus = this.grid.mapCellToCanvas({
            i: 0, j: 0
        });
        this.pointer = {
            i: 0, j: 0
        };
    }
    start(canvas) {
        this.changeScale(canvas);
        this.mainGameLoop();
    }
    mainGameLoop() {
        var scene = this;
        nextAnimationFrame(function () {
            scene.mainGameLoop();
        });
        if (this.paused) {
            return;
        }
        if (this.mainGameLoop_pre() === false) {
            return;
        }
        let boundariesY = this.grid.getBoundariesY(this.focus.y, this.getSceneHeight());
        let minRow = boundariesY.min;
        let maxRow = boundariesY.max;
        let boundariesX = this.grid.getBoundariesX(this.focus.x, this.getSceneWidth());
        let minColumn = boundariesX.min;
        let maxColumn = boundariesX.max;
        if (!Utils.isEmpty(this.map) && !Utils.isEmpty(this.map.tileset) && !Utils.isEmpty(this.map.tileset.imageData)) {
            this.renderLayers(this.map, this.map.tileset.imageData, this.context, minRow, maxRow, minColumn, maxColumn);
        }
        MapManager.renderGlobalEffects(this.grid, this.context, minRow, maxRow, minColumn, maxColumn);
        this.renderTopLayerElements(minRow, maxRow, minColumn, maxColumn);
        MapManager.renderGlobalUI(this.grid, this.context, this.renderingConfiguration);
        this.renderFocus();
        this.renderPointer();
        this.mainGameLoop_post(boundariesX, boundariesY);
    }
    mainGameLoop_pre() {
        this.grid.clear(this.context);
        return true;
    }
    mainGameLoop_post(boundariesX, boundariesY) {
    }
    renderPointer() {
        if (this.pointer.i != null && this.pointer.j != null) {
            let mappedPointer = this.grid.mapCellToCanvas(this.pointer);
            this.context.save();
            this.context.beginPath();
            this.context.fillStyle = Constant.Color.YELLOW;
            this.context.arc(mappedPointer.x + Math.floor(this.grid.cellW / 2), mappedPointer.y + Math.floor(this.grid.cellH / 2), 18, 0, Constant.DOUBLE_PI);
            this.context.closePath();
            this.context.globalAlpha = 0.4;
            this.context.fill();
            this.context.restore();
        }
    }
    renderFocus() {
        if (this.focus.x != null && this.focus.y != null && this.renderingConfiguration.showFocus) {
            this.context.save();
            this.context.beginPath();
            this.context.fillStyle = Constant.Color.BLACK;
            this.context.arc(this.focus.x + Math.floor(this.grid.cellW / 2), this.focus.y + Math.floor(this.grid.cellH / 2), 15, 0, Constant.DOUBLE_PI);
            this.context.closePath();
            this.context.fill();
            this.context.restore();
        }
    }
    toggleGrid(enable) {
        if (enable != null) {
            this.renderingConfiguration.showGrid = enable;
        }
        else {
            this.renderingConfiguration.showGrid = !this.renderingConfiguration.showGrid;
        }
    }
    toggleGridMode() {
        if (!this.renderingConfiguration.showGrid) {
            this.toggleGrid();
        }
        else if (!this.renderingConfiguration.showBlocks) {
            this.toggleBlocks();
        }
        else {
            this.toggleGrid();
            this.toggleBlocks();
        }
    }
    toggleCellNumbering(enable) {
        if (enable != null) {
            this.renderingConfiguration.showCellNumbers = enable;
        }
        else {
            this.renderingConfiguration.showCellNumbers = !this.renderingConfiguration.showCellNumbers;
        }
    }
    toggleFocus(enable) {
        if (enable != null) {
            this.renderingConfiguration.showFocus = enable;
        }
        else {
            this.renderingConfiguration.showFocus = !this.renderingConfiguration.showFocus;
        }
    }
    toggleBlocks(enable) {
        if (enable != null) {
            this.renderingConfiguration.showBlocks = enable;
        }
        else {
            this.renderingConfiguration.showBlocks = !this.renderingConfiguration.showBlocks;
        }
    }
    toggleAntialiasing(enable) {
        if (enable != null) {
            this.renderingConfiguration.enableAntialiasing = enable;
        }
        else {
            this.renderingConfiguration.enableAntialiasing = !this.renderingConfiguration.enableAntialiasing;
        }
        if ("mozImageSmoothingEnabled" in this.context) {
            this.context["mozImageSmoothingEnabled"] = this.renderingConfiguration.enableAntialiasing;
        }
        if ("webkitImageSmoothingEnabled" in this.context) {
            this.context["webkitImageSmoothingEnabled"] = this.renderingConfiguration.enableAntialiasing;
        }
        if ("msImageSmoothingEnabled" in this.context) {
            this.context["msImageSmoothingEnabled"] = this.renderingConfiguration.enableAntialiasing;
        }
        if ("imageSmoothingEnabled" in this.context) {
            this.context["imageSmoothingEnabled"] = this.renderingConfiguration.enableAntialiasing;
        }
    }
    updatePointer(i, j) {
        this.pointer = {
            i: i,
            j: j
        };
    }
    moveFocus(direction = null) {
        if (direction != null) {
            switch (direction) {
                case 0:
                    this.focus.y -= +this.grid.cellH;
                    break;
                case 1:
                    this.focus.y += +this.grid.cellH;
                    break;
                case 2:
                    this.focus.x -= +this.grid.cellW;
                    break;
                case 3:
                    this.focus.x += +this.grid.cellW;
                    break;
            }
        }
        this.grid.changeTranslation(this.focus.x, this.focus.y, this.map.width, this.map.height);
    }
    resetTranslation() {
        this.grid.resetTranslation();
    }
    changeScale(canvas) {
        this.context = canvas.getContext("2d");
        this.context.scale(this.grid.scaleX, this.grid.scaleY);
    }
    changeMap(map, callback) {
        var scene = this;
        if (Utils.isEmpty(map)) {
            console.error("initialized map");
            console.trace();
        }
        scene.map = map;
        scene.changeTile(map.tile, function (scene) {
            setTimeout(function () {
                MapManager.loadBlocks(scene.map);
            });
            callback(scene);
        });
    }
    changeTile(tile, callback) {
        var scene = this;
        TilesetManager.loadTileset(tile, this.context, function (json) {
            scene.map.tileset = json;
            Resource.load(tile, 3, function (image) {
                scene.map.tileset.imageData = image[0];
                callback(scene);
            });
        });
    }
    getSceneHeight() {
        return this.map.height;
    }
    getSceneWidth() {
        return this.map.width;
    }
    renderLayers(map, tileImage, context, minRow, maxRow, minColumn, maxColumn) {
        if (!Utils.isEmpty(map)) {
            for (var i = Constant.MapLayer.LOW; i <= Constant.MapLayer.EVENTS; i++) {
                var layer = map.layers[i];
                if (!Utils.isEmpty(layer.opacity)) {
                    context.globalAlpha = layer.opacity;
                }
                this.renderLayer(i, tileImage, context, minRow, maxRow, minColumn, maxColumn);
                context.globalAlpha = 1;
            }
        }
    }
    renderLayer(layerIndex, tileImage, context, minRow, maxRow, minColumn, maxColumn) {
        this.renderInterLayerElements(layerIndex, minRow, maxRow, minColumn, maxColumn);
        let layer = this.map.layers[layerIndex];
        MapManager.renderLayer(this.grid, this.map, layer, tileImage, context, minRow, maxRow, minColumn, maxColumn);
    }
    togglePause(pause) {
        if (pause != null) {
            this.paused = pause;
        }
        else {
            this.paused = !this.paused;
        }
    }
    onFocusCellChange() {
    }
    onFocusPixelChange(x, y) {
    }
}
var SaveManager;
(function (SaveManager) {
    function getNewSave(name) {
        var save = {
            id: 0,
            map: 0,
            hero: ActorManager.getNewHero()
        };
        return save;
    }
    SaveManager.getNewSave = getNewSave;
})(SaveManager || (SaveManager = {}));
var TilesetManager;
(function (TilesetManager) {
    function loadTileset(tilesetImage, context, callback) {
        Resource.load(tilesetImage + "", 6, function (resourceText) {
            if (Utils.isEmpty(resourceText)) {
                console.error("Error while loading tileset: " + tilesetImage);
                callback(null);
            }
            else {
                try {
                    let tileset = JSON.parse(resourceText);
                    callback(tileset);
                }
                catch (exception) {
                    if (exception.name === "SyntaxError") {
                        console.error("Error while parsing tileset: " + tilesetImage);
                    }
                    else if (exception.name === "TypeError") {
                        console.error("Error while reading tileset: " + tilesetImage);
                    }
                    else {
                        console.error(exception);
                    }
                    Errors.showError(context);
                    callback(null);
                }
            }
        });
    }
    TilesetManager.loadTileset = loadTileset;
    function getNewTileset(name) {
        return {
            "firstgid": 1,
            "image": "002-Woods01.png",
            "imageheight": 800,
            "imagewidth": 256,
            "name": "Bosco",
            "blocks": null,
            "over": null
        };
    }
    TilesetManager.getNewTileset = getNewTileset;
})(TilesetManager || (TilesetManager = {}));
var Compatibility;
(function (Compatibility) {
    function check() {
        canvas();
        serviceWorker();
        webWorker();
        thirdPartyCookies();
    }
    Compatibility.check = check;
    function canvas() {
        let elem = document.createElement("canvas");
        if (!(elem.getContext && elem.getContext("2d"))) {
            console.error("HTML5 canvas is not supported");
            return false;
        }
        return true;
    }
    function serviceWorker() {
        if (!("serviceWorker" in navigator)) {
            console.error("Service Workers are not supported");
            return false;
        }
        return true;
    }
    Compatibility.serviceWorker = serviceWorker;
    function webWorker() {
        if (!("Worker" in window)) {
            console.error("Web Workers are not supported");
            return false;
        }
        return true;
    }
    Compatibility.webWorker = webWorker;
    function thirdPartyCookies() {
    }
})(Compatibility || (Compatibility = {}));
var Errors;
(function (Errors) {
    function showError(context) {
        if (!Utils.isEmpty(this.context) && !Utils.isEmpty(this.grid)) {
            this.grid.clear(this.context);
        }
        context.fillStyle = "#000000";
        context.font = "bold 20px Arial";
        context.fillText("An error occurred :(", 60, 60);
    }
    Errors.showError = showError;
    ;
})(Errors || (Errors = {}));
var Input;
(function (Input) {
    class Keys {
    }
    Keys.UP = "38";
    Keys.DOWN = "40";
    Keys.LEFT = "37";
    Keys.RIGHT = "39";
    Keys.CTRL = "17";
    Keys.ALT = "18";
    Keys.ENTER = "13";
    Keys.SPACE = "32";
    Keys.CAPS = "20";
    Keys.SHIFT = "16";
    Keys.W = "87";
    Keys.A = "65";
    Keys.D = "68";
    Keys.S = "83";
    Keys.J = "74";
    Keys.K = "75";
    Keys.F1 = "112";
    Keys.F2 = "113";
    Keys.F3 = "114";
    Keys.F4 = "115";
    Keys.F5 = "116";
    Keys.F6 = "117";
    Input.Keys = Keys;
    class MouseButtons {
    }
    MouseButtons.LEFT = 1;
    MouseButtons.RIGHT = 2;
    MouseButtons.MIDDLE = 4;
    Input.MouseButtons = MouseButtons;
    ;
    ;
    ;
    function init(canvas, grid, inputCallbacks, resetCallback, actionCallback, startActionCallback, endActionCallback, ongoingActionCallback, hoverCallback, pauseCallback, unpauseCallback, resizeCallback, rightClickCallback, doubleClickCallback, wheelCallback) {
        var lastKey;
        var flagPause = false;
        inputCallbacks[Keys.SPACE] = function (e) {
            if (flagPause) {
                unpauseCallback();
                flagPause = false;
            }
            else {
                pauseCallback();
                flagPause = true;
            }
            e.preventDefault();
        };
        var flagMouseDown = false;
        canvas.addEventListener("click", function (e) {
            var position = mapEvent(e);
            actionCallback(position.i, position.j);
        });
        canvas.addEventListener("mousemove", function (e) {
            var position = mapEvent(e);
            if (flagMouseDown) {
                ongoingActionCallback(position.i, position.j, e.buttons);
            }
            else {
                hoverCallback(position.i, position.j);
            }
        });
        canvas.addEventListener("mousedown", function (e) {
            flagMouseDown = true;
            var position = mapEvent(e);
            startActionCallback(position.i, position.j, e.buttons);
        });
        canvas.addEventListener("mouseup", function (e) {
            flagMouseDown = false;
            var position = mapEvent(e);
            endActionCallback(position.i, position.j, e.buttons);
        });
        canvas.addEventListener("mouseout", function (e) {
            if (flagMouseDown) {
                ongoingActionCallback(null, null, e.buttons);
            }
            else {
                hoverCallback(null, null);
            }
        });
        canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            var position = mapEvent(e);
            rightClickCallback(position.i, position.j);
        });
        canvas.addEventListener("dblclick", function (e) {
            var position = mapEvent(e);
            doubleClickCallback(position.i, position.j);
        });
        canvas.addEventListener("wheel", function (e) {
            var position = mapEvent(e);
            wheelCallback(position.i, position.j);
        });
        canvas.addEventListener("touchstart", function (e) {
            var position = mapEvent(e);
            startActionCallback(position.i, position.j);
        });
        canvas.addEventListener("touchend", function (e) {
            var position = mapEvent(e);
            ongoingActionCallback(null, null);
            endActionCallback(position.i, position.j);
        });
        canvas.addEventListener("touchcancel", function (e) {
            var position = mapEvent(e);
            ongoingActionCallback(null, null);
            endActionCallback(position.i, position.j);
        });
        canvas.addEventListener("touchmove", function (e) {
            var position = mapEvent(e);
            ongoingActionCallback(position.i, position.j);
        });
        document.addEventListener("keydown", function (e) {
            var callback = inputCallbacks[String(e.keyCode)];
            if (callback !== undefined) {
                e.preventDefault();
                callback(e);
            }
            lastKey = e.keyCode;
        });
        document.addEventListener("keyup", function (e) {
            if (e.keyCode === lastKey) {
                resetCallback();
            }
        });
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                pauseCallback();
                flagPause = true;
            }
            else {
                unpauseCallback();
                flagPause = false;
            }
        });
        window.addEventListener("resize", function (event) {
            resizeCallback();
        });
        document.addEventListener("orientationchange", function () {
            resizeCallback();
        });
        function mapEvent(e) {
            let position = {
                x: e.clientX,
                y: e.clientY
            };
            return grid.mapPositionToGrid(position);
        }
    }
    Input.init = init;
    ;
})(Input || (Input = {}));
var Workers;
(function (Workers) {
    Workers.WEBWORKER_URL = "workers/l4w-webworker.js";
    Workers.SERVICEWORKER_URL = "workers/l4w-serviceworker.js";
    Workers.SERVICEWORKER_OPTIONS = {
        scope: "../"
    };
    let worker;
    function launchWebWorker(data) {
        if (Compatibility.webWorker()) {
            if (Utils.isEmpty(worker)) {
                worker = new Worker(Workers.WEBWORKER_URL);
            }
            worker.postMessage(data);
        }
    }
    Workers.launchWebWorker = launchWebWorker;
    function registerServiceWorker() {
        if (Compatibility.serviceWorker()) {
            navigator.serviceWorker.register(Workers.SERVICEWORKER_URL, Workers.SERVICEWORKER_OPTIONS).then(function (registration) {
            }, function (err) {
                console.warn("ServiceWorker registration failed: ", err);
            });
        }
    }
    Workers.registerServiceWorker = registerServiceWorker;
})(Workers || (Workers = {}));
class DynamicGrid extends AbstractGrid {
    constructor(cnvs, onCompleted) {
        super(cnvs, onCompleted, GridTypeEnum.game);
    }
    deferredInit(props) {
        super.deferredInit(props);
        this.canvasRatio = props.get("canvasRatio");
        this.scaleStepX = this.cellW * Math.pow(2, -10);
        this.scaleStepY = this.cellH * Math.pow(2, -10);
    }
    refresh() {
        let ratioH = this.baseH / this.height();
        let ratioW = this.baseW / this.width();
        let newScale = this.canvasRatio / (ratioH > ratioW ? ratioH : ratioW);
        this.scaleX = newScale - (newScale % this.scaleStepX);
        this.scaleY = newScale - (newScale % this.scaleStepY);
        super.refresh();
    }
    width() {
        return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
    }
    height() {
        return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;
    }
}
class DynamicScene extends AbstractScene {
    constructor(grid, canvas) {
        super(grid);
        this.FPS = 20;
        this.refreshInterval = 1000 / this.FPS;
        this.autoFPS = true;
        this.secondFPS = 0;
        this.countFPS = 0;
        this.lastFPS = 0;
        this.fpsPerformance = [22, 21, 20];
        this.context = canvas.getContext("2d");
    }
    mainGameLoop_pre() {
        if (!super.mainGameLoop_pre()) {
            return false;
        }
        let scene = this;
        let time = Utils.now();
        if (!Utils.isEmpty(this.hero)) {
            ActorManager.update(this.hero, time);
            ActorManager.manageMovements(this.map, this.grid, this.hero, function (w, h) {
                scene.grid.changeTranslation(scene.focus.x + w, scene.focus.y + h, scene.map.width, scene.map.height);
            }, function (w, h) {
                scene.focus.x += w;
                scene.focus.y += h;
            });
        }
        if (!Utils.isEmpty(this.events)) {
            for (let actor of this.events) {
                ActorManager.update(actor, time);
                ActorManager.manageMovements(this.map, this.grid, actor, function () { }, function () { });
            }
        }
        return true;
    }
    mainGameLoop_post(boundariesX, boundariesY) {
        super.mainGameLoop_post(boundariesX, boundariesY);
        this.context.fillStyle = "#000000";
        this.context.font = "bold 40px Arial";
        this.context.fillText("(it's not ready yet)", this.grid.getCurrentTranslation().x + 160, this.grid.getCurrentTranslation().y + 260);
        this.renderFPS();
    }
    toggleFPS(enable) {
        if (enable != null) {
            this.renderingConfiguration.showFPS = enable;
        }
        else {
            this.renderingConfiguration.showFPS = !this.renderingConfiguration.showFPS;
        }
    }
    renderFPS() {
        var seconds = Math.floor(Utils.now() / 1000);
        if (seconds === this.secondFPS) {
            this.countFPS++;
        }
        else {
            this.lastFPS = this.countFPS;
            this.countFPS = 1;
            this.secondFPS = seconds;
            if (this.autoFPS === true) {
                this.fpsPerformance.shift();
                this.fpsPerformance[2] = this.lastFPS;
                var avg = (this.fpsPerformance[0] + this.fpsPerformance[1] + this.fpsPerformance[2]) / 3;
                this.FPS = Math.ceil(avg) + 2;
            }
        }
        if (this.renderingConfiguration.showFPS) {
            this.context.fillStyle = Constant.Color.RED;
            this.context.font = "bold 18px Arial";
            this.context.fillText("" + this.lastFPS, this.grid.getCurrentTranslation().x + 10, this.grid.getCurrentTranslation().y + 20);
        }
    }
    renderInterLayerElements(layerIndex, minRow, maxRow, minColumn, maxColumn) {
        if (layerIndex === Constant.MapLayer.EVENTS) {
            if (ActorManager.isVisible(this.hero, minRow, maxRow, minColumn, maxColumn)) {
                ActorManager.render(this.grid, this.hero, this.context);
            }
            if (!Utils.isEmpty(this.events)) {
                for (let actor of this.events) {
                    if (ActorManager.isVisible(actor, minRow, maxRow, minColumn, maxColumn)) {
                        ActorManager.render(this.grid, actor, this.context);
                    }
                }
            }
        }
    }
    renderTopLayerElements(minRow, maxRow, minColumn, maxColumn) {
        MapManager.renderUI(this.map, this.grid, this.context, this.renderingConfiguration, minRow, maxRow, minColumn, maxColumn);
    }
    loadSave(save, callback) {
        var scene = this;
        let callback2 = function (result) {
            if (result && !Utils.isEmpty(scene.map.layers)) {
                scene.events = MapManager.getActors(scene.map);
                for (let i = 0; i < scene.events.length; i++) {
                    scene.events[i] = ActorManager.initTransientData(this.grid, scene.events[i]);
                }
                console.log(scene.events);
            }
            callback(result);
        };
        let mapId;
        let hero;
        if (Utils.isEmpty(save)) {
            if (Utils.isEmpty(this.map)) {
                mapId = "0";
                hero = ActorManager.getNewHero();
            }
            else {
                callback(false);
                return;
            }
        }
        else {
            mapId = save.map;
            hero = save.hero;
        }
        this.hero = ActorManager.initTransientData(this.grid, hero);
        MapManager.loadMap(mapId, this.context.canvas, function (map) {
            scene.changeMap(map, function () {
                scene.resetTranslation();
                scene.focus = scene.grid.mapCellToCanvas(hero);
                callback(true);
            });
        });
    }
    getSave() {
        if (Utils.isEmpty(this.map) || Utils.isEmpty(this.focus)) {
            return null;
        }
        else {
            return {
                id: 0,
                map: this.map.id,
                hero: this.hero
            };
        }
    }
    startMovement(i, j) {
        ActorManager.startMovement(this.grid, this.hero, i, j);
    }
}
var Game;
(function (Game) {
    var scene;
    function start(canvas) {
        Compatibility.check();
        Workers.registerServiceWorker();
        new DynamicGrid(canvas, function (grid) {
            scene = new DynamicScene(grid, canvas);
            initInput(canvas, scene, grid);
            loadSave(canvas, function (save) {
                scene.loadSave(save, function (success) {
                    scene.start(canvas);
                    scene.moveFocus();
                });
            });
        });
    }
    Game.start = start;
    function load() {
        let canvas = document.getElementById("canvas1");
        loadSave(canvas, function (save) {
            scene.loadSave(save, function (success) {
                scene.moveFocus();
                if (success) {
                    console.log("Save loaded successfully");
                }
                else {
                    console.log("Save not found");
                }
            });
        });
    }
    Game.load = load;
    function save() {
        let saveId = "0";
        let currentState = scene.getSave();
        if (!Utils.isEmpty(currentState)) {
            saveId = currentState.id + "";
        }
        Resource.save(saveId, JSON.stringify(currentState), 5, function (success) {
            if (success) {
                console.log("Save saved successfully");
            }
        });
    }
    Game.save = save;
    function loadSave(canvas, callback) {
        let saveId = "0";
        let currentState = scene.getSave();
        if (!Utils.isEmpty(currentState)) {
            saveId = currentState.id + "";
        }
        Resource.load(saveId, 5, function (resourceText) {
            if (Utils.isEmpty(resourceText)) {
                callback(null);
            }
            else {
                try {
                    let obj = JSON.parse(resourceText);
                    let save = obj;
                    callback(save);
                }
                catch (exception) {
                    if (exception.name === "SyntaxError") {
                        console.error("Error while parsing save");
                    }
                    else if (exception.name === "TypeError") {
                        console.error("Error while reading save");
                    }
                    else {
                        console.error(exception);
                    }
                    Errors.showError(canvas.getContext("2d"));
                    callback(null);
                }
            }
        });
    }
    function initInput(canvas, scene, grid) {
        var inputCallbackMap = new Map();
        inputCallbackMap[Input.Keys.W] = function (e) {
            scene.moveFocus(0);
        };
        inputCallbackMap[Input.Keys.S] = function (e) {
            scene.moveFocus(1);
        };
        inputCallbackMap[Input.Keys.A] = function (e) {
            scene.moveFocus(2);
        };
        inputCallbackMap[Input.Keys.D] = function (e) {
            scene.moveFocus(3);
        };
        inputCallbackMap[Input.Keys.F1] = function (e) {
            scene.toggleFPS();
        };
        inputCallbackMap[Input.Keys.F2] = function (e) {
            scene.toggleGridMode();
        };
        inputCallbackMap[Input.Keys.F3] = function (e) {
            scene.toggleCellNumbering();
        };
        inputCallbackMap[Input.Keys.F4] = function (e) {
            scene.toggleFocus();
        };
        inputCallbackMap[Input.Keys.F5] = function (e) {
            scene.toggleBlocks();
            e.preventDefault();
        };
        inputCallbackMap[Input.Keys.F6] = function (e) {
            scene.toggleAntialiasing();
            e.preventDefault();
        };
        var actionCallback = function (x, y) {
            moveHero(x, y);
        };
        Input.init(canvas, grid, inputCallbackMap, function () { }, actionCallback, function () { }, function () { }, function (x, y) {
            scene.updatePointer(x, y);
        }, function (x, y) {
            scene.updatePointer(x, y);
        }, function () {
            console.log("pause");
            scene.togglePause(true);
        }, function () {
            console.log("unpause");
            scene.togglePause(false);
        }, function () {
            grid.refresh();
            scene.changeScale(canvas);
            scene.resetTranslation();
        }, function () { console.log("rightClick"); }, function () { console.log("doubleClick"); }, function () { console.log("wheel"); });
        function moveHero(i, j) {
            scene.startMovement(i, j);
        }
        ;
    }
    ;
})(Game || (Game = {}));
;
;
;
class AbstractStaticScene extends AbstractScene {
    constructor(grid) {
        super(grid);
        this.renderingConfiguration.showEditorGrid = true;
        this.renderingConfiguration.enableSelection = true;
    }
    mainGameLoop_pre() {
        if (!super.mainGameLoop_pre()) {
            return false;
        }
        return true;
    }
    mainGameLoop_post(boundariesX, boundariesY) {
        super.mainGameLoop_post(boundariesX, boundariesY);
    }
    toggleEditorGrid(enable) {
        if (enable != null) {
            this.renderingConfiguration.showEditorGrid = enable;
        }
        else {
            this.renderingConfiguration.showEditorGrid = !this.renderingConfiguration.showEditorGrid;
        }
    }
    renderPointer() {
        if (this.pointer.i != null && this.pointer.j != null) {
            this.context.save();
            this.context.globalAlpha = 0.4;
            this.context.fillStyle = Constant.Color.YELLOW;
            this.context.fillRect(this.pointer.i * this.grid.cellW, this.pointer.j * this.grid.cellH, this.grid.cellW, this.grid.cellH);
            this.context.restore();
        }
    }
    select(x, y) {
        if (x != null && y != null) {
            this.renderingConfiguration.selectPointStart = {
                x: x,
                y: y
            };
            this.renderingConfiguration.selectPointEnd = null;
        }
    }
    selectEnd(x, y) {
        if (x != null && y != null) {
            this.renderingConfiguration.selectPointEnd = {
                x: x,
                y: y
            };
        }
    }
    cleanSelection() {
        this.renderingConfiguration.selectPointStart = null;
        this.renderingConfiguration.selectPointEnd = null;
    }
    getSelectionArea() {
        if (Utils.isEmpty(this.renderingConfiguration.selectPointStart)) {
            return null;
        }
        var x1 = this.renderingConfiguration.selectPointStart.x;
        var y1 = this.renderingConfiguration.selectPointStart.y;
        var x2;
        var y2;
        if (!Utils.isEmpty(this.renderingConfiguration.selectPointEnd)) {
            x2 = this.renderingConfiguration.selectPointEnd.x;
            y2 = this.renderingConfiguration.selectPointEnd.y;
            if (x1 > x2) {
                let tmp = x1;
                x1 = x2;
                x2 = tmp;
            }
            if (y1 > y2) {
                let tmp = y1;
                y1 = y2;
                y2 = tmp;
            }
        }
        else {
            x2 = this.renderingConfiguration.selectPointStart.x;
            y2 = this.renderingConfiguration.selectPointStart.y;
        }
        return {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        };
    }
}
class AbstractTileScene extends AbstractStaticScene {
    constructor(grid, heightPx, widthPx) {
        super(grid);
        this.height = Math.floor(heightPx / grid.cellH);
        this.width = Math.floor(widthPx / grid.cellW);
        this.renderingConfiguration.showBlocks = true;
    }
    select(x, y) {
        super.select(x, y);
    }
    updateSize(heightPx, widthPx) {
        this.height = Math.floor(heightPx / this.grid.cellH);
        this.width = Math.floor(widthPx / this.grid.cellW);
    }
    getSceneHeight() {
        return this.height;
    }
    getSceneWidth() {
        return this.width;
    }
    renderInterLayerElements(layerIndex, minRow, maxRow, minColumn, maxColumn) {
    }
    renderTopLayerElements(minRow, maxRow, minColumn, maxColumn) {
        MapManager.renderUI(this.map, this.grid, this.context, this.renderingConfiguration, minRow, maxRow, minColumn, maxColumn);
    }
}
var MapperPage;
(function (MapperPage) {
    MapperPage.PAGE_TITLE = document.title;
    MapperPage.BUTTON_ID_MODE = "mode";
    MapperPage.BUTTON_ID_LAYER = "layer";
    let flagFirstLoad = true;
    let flagEdited = false;
    function start() {
        Compatibility.check();
        $("#mapPanel").jstree({
            "core": {
                "animation": 0,
                "data": {
                    "url": base_path + "data/map",
                    "dataType": "json"
                },
                "check_callback": true,
            },
            "multiple": false,
            "plugins": ["dnd", "contextmenu"],
            "themes": {
                "dots": false
            }
        });
        var canvas = document.getElementById("canvas1");
        $("#mapPanel").on("create_node.jstree rename_node.jstree delete_node.jstree", function (e, data) {
            switch (e.type) {
                case "create_node":
                    if (flagEdited) {
                        $("#mapPanel").jstree(true).disable_node(data.node);
                    }
                case "rename_node":
                case "delete_node":
                    changeEditState(true, false);
                    break;
                default:
                    console.log("Type: " + e.type);
            }
        });
        $("#mapPanel").on("changed.jstree", function (e, data) {
            switch (data.action) {
                case "ready":
                    return;
                case "delete_node":
                    let previousNode = $("#mapPanel").jstree(true).get_prev_dom(data.node);
                    $("#mapPanel").jstree(true).select_node(previousNode);
                    return;
                case "model":
                case "select_node":
                    if (flagFirstLoad) {
                        flagFirstLoad = false;
                    }
                    $("#mapDetailPanel").show();
                    var node = getSelectedNode();
                    if (Utils.isEmpty(node.data)) {
                        node.data = {
                            w: 25,
                            h: 20,
                            tile: "002-Woods01.png"
                        };
                    }
                    $("#mapSizeW").val(node.data.w + "");
                    $("#mapSizeH").val(node.data.h + "");
                    $("#tiles").val(node.data.tile);
                    TilePicker.loadTile(node.data.tile, function (tilePicker) {
                        Mapper.start(canvas, tilePicker, parseInt(node.id));
                    });
                    break;
                default:
                    console.log("Action: " + data.action);
                    break;
            }
        });
        var resizerCallback = function (props) {
            var width = +props.get("cellWidth") * +props.get("tileColumns") + 2;
            $("#toolsPanel").width(width);
        };
        Resource.loadProperties(resizerCallback);
        loadTiles();
        loadNews();
    }
    MapperPage.start = start;
    function changeSize() {
        var node = getSelectedNode();
        node.data.w = $("#mapSizeW").val();
        node.data.h = $("#mapSizeH").val();
        Mapper.changeSize(node.data.h, node.data.w);
        changeEditState(true);
    }
    MapperPage.changeSize = changeSize;
    function loadTiles() {
        $.getJSON(base_path + "data/resources/tiles.json", function (data) {
            var sel = $("#tiles");
            for (var i = 0; i < data.length; i++) {
                sel.append("<option value='" + data[i].name + "'>" + data[i].desc
                    + "</option>");
            }
        });
    }
    function loadNews() {
        $.getJSON(base_path + "news", function (data) {
            var news = $("#news");
        });
    }
    MapperPage.loadNews = loadNews;
    function changeTile() {
        var node = $("#mapPanel").jstree(true).get_selected(true)[0];
        node.data.tile = $("#tiles").val();
        TilePicker.loadTile(node.data.tile, function (tilePicker) {
            Mapper.changeTile(node.data.tile, tilePicker);
        });
        changeEditState(true);
    }
    MapperPage.changeTile = changeTile;
    function save() {
        Mapper.saveMap(function (result1) {
            if (result1) {
                MapperPage.changeEditState(false);
                TilePicker.saveData(function (result2) {
                    if (!result2) {
                        console.error("Salvataggio fallito");
                    }
                });
            }
            else {
                console.error("Salvataggio fallito");
            }
        });
    }
    MapperPage.save = save;
    function reload() {
        Mapper.reloadMap();
        $("#mapPanel").jstree(true).refresh(false, false);
    }
    MapperPage.reload = reload;
    function getActiveMap() {
        return parseInt(getSelectedNode().id);
    }
    MapperPage.getActiveMap = getActiveMap;
    function getSelectedNode() {
        return $("#mapPanel").jstree(true).get_selected(true)[0];
    }
    function changeEditState(edited, mapChanged = true) {
        flagEdited = edited;
        if (edited) {
            document.title = MapperPage.PAGE_TITLE + "*";
        }
        else {
            document.title = MapperPage.PAGE_TITLE;
        }
        $("#saveButton")[0].disabled = !edited;
        $("#reloadButton")[0].disabled = !edited;
        if (mapChanged) {
            var test = $("#mapPanel").jstree(true).get_json("#", {
                "flat": true,
                "no_state": false,
                "no_id": false,
                "no_children": false,
                "no_data": false
            });
            $.each(test, function (key, node) {
                if (edited) {
                    $("#mapPanel").jstree("disable_node", node.id);
                }
                else {
                    $("#mapPanel").jstree("enable_node", node.id);
                }
            });
        }
    }
    MapperPage.changeEditState = changeEditState;
})(MapperPage || (MapperPage = {}));
var Mapper;
(function (Mapper) {
    function start(canvas, tilePicker, mapId) {
        if (!Utils.isEmpty(Mapper.mapper)) {
            Mapper.mapper.togglePause(true);
        }
        new StaticGrid(canvas, function (grid) {
            new MapperScene(grid, function (scene) {
                initInput(canvas, scene, grid);
                initWidgets(canvas, scene, grid);
                TilePicker.setMapper(scene);
                scene.setTilePicker(tilePicker);
                Mapper.mapper = scene;
                MapManager.loadMap(mapId, canvas, function (map) {
                    Mapper.mapper.changeMap(map, function () {
                        Mapper.mapper.start(canvas);
                    });
                });
            });
        }, GridTypeEnum.mapper);
    }
    Mapper.start = start;
    function changeTile(tile, tilePicker) {
        Mapper.mapper.changeTile(tile, function (scene) { });
        Mapper.mapper.setTilePicker(tilePicker);
    }
    Mapper.changeTile = changeTile;
    function changeSize(rows, columns) {
        Mapper.mapper.resizeMap(rows, columns);
    }
    Mapper.changeSize = changeSize;
    function reloadMap() {
        let mapId = MapperPage.getActiveMap();
        let canvas = document.getElementById("canvas1");
        MapManager.loadMap(mapId, canvas, function (map) {
            Mapper.mapper.changeMap(map, function () {
                MapperPage.changeEditState(false);
            });
        });
    }
    Mapper.reloadMap = reloadMap;
    function saveMap(callback = null) {
        var mapId = MapperPage.getActiveMap();
        var mapJSON = JSON.stringify(this.mapper.getMap());
        Resource.save(mapId + "", mapJSON, 4, function (success) {
            if (callback !== null) {
                callback(success);
            }
        });
    }
    Mapper.saveMap = saveMap;
    function initInput(canvas, scene, grid) {
        var inputCallbackMap = new Map();
        inputCallbackMap[Input.Keys.W] = function (e) {
            scene.moveFocus(0);
        };
        inputCallbackMap[Input.Keys.S] = function (e) {
            scene.moveFocus(1);
        };
        inputCallbackMap[Input.Keys.A] = function (e) {
            scene.moveFocus(2);
        };
        inputCallbackMap[Input.Keys.D] = function (e) {
            scene.moveFocus(3);
        };
        inputCallbackMap[Input.Keys.F2] = function (e) {
            scene.toggleEditorGrid();
        };
        inputCallbackMap[Input.Keys.F3] = function (e) {
            scene.toggleCellNumbering();
        };
        inputCallbackMap[Input.Keys.F4] = function (e) {
            scene.toggleFocus();
        };
        Input.init(canvas, grid, inputCallbackMap, function () { }, function () { }, function (x, y, mouseButton) {
            if (mouseButton === Input.MouseButtons.LEFT) {
                if (scene.apply(x, y)) {
                    MapperPage.changeEditState(true);
                }
            }
            else {
                scene.select(x, y);
            }
        }, function (x, y, mouseButton) {
            if (mouseButton === Input.MouseButtons.LEFT) {
                scene.selectEnd(x, y);
            }
        }, function (x, y, mouseButton) {
            if (mouseButton === Input.MouseButtons.LEFT) {
                if (scene.apply(x, y)) {
                    MapperPage.changeEditState(true);
                }
            }
            else {
                scene.selectEnd(x, y);
            }
            scene.updatePointer(x, y);
        }, function (x, y) {
            scene.updatePointer(x, y);
        }, function () { }, function () { }, function () { }, function (x, y) {
            scene.cleanSelection();
        }, function () { console.log("doubleClick"); }, function () { console.log("wheel"); });
    }
    ;
    function initWidgets(canvas, scene, grid) {
        var inputRange = document.getElementById("zoom");
        inputRange.onchange = function (e) {
            grid.selectScale(+inputRange.value);
            grid.refresh();
            scene.changeScale(canvas);
            scene.resetTranslation();
        };
    }
    ;
    function setMode(editMode) {
        document.getElementById(MapperPage.BUTTON_ID_MODE + "0").disabled = false;
        document.getElementById(MapperPage.BUTTON_ID_MODE + "1").disabled = false;
        document.getElementById(MapperPage.BUTTON_ID_MODE + editMode).disabled = true;
        Mapper.mapper.setEditMode(editMode);
    }
    Mapper.setMode = setMode;
    ;
    function setActiveLayer(layerIndex) {
        document.getElementById(MapperPage.BUTTON_ID_LAYER + "0").disabled = false;
        document.getElementById(MapperPage.BUTTON_ID_LAYER + "1").disabled = false;
        document.getElementById(MapperPage.BUTTON_ID_LAYER + "2").disabled = false;
        document.getElementById(MapperPage.BUTTON_ID_LAYER + "3").disabled = false;
        document.getElementById(MapperPage.BUTTON_ID_LAYER + layerIndex).disabled = true;
        Mapper.mapper.setActiveLayer(layerIndex);
    }
    Mapper.setActiveLayer = setActiveLayer;
    ;
})(Mapper || (Mapper = {}));
class MapperScene extends AbstractStaticScene {
    constructor(grid, callback) {
        super(grid);
        this.activeLayer = Constant.MapLayer.MID;
        this.editMode = Constant.EditMode.APPLY;
        document.getElementById(MapperPage.BUTTON_ID_LAYER + this.activeLayer).disabled = true;
        document.getElementById(MapperPage.BUTTON_ID_MODE + this.editMode).disabled = true;
        callback(this);
    }
    renderPointer() {
        if (this.pointer.i != null && this.pointer.j != null) {
            var selectionArea = this.getSelectionArea();
            if (Utils.isEmpty(selectionArea)) {
                super.renderPointer();
            }
            else {
                this.context.save();
                this.context.globalAlpha = 0.4;
                this.context.fillStyle = Constant.Color.GREY;
                this.context.fillRect(this.pointer.i * this.grid.cellW, this.pointer.j * this.grid.cellH, (selectionArea.x2 - selectionArea.x1 + 1) * this.grid.cellW, (selectionArea.y2 - selectionArea.y1 + 1) * this.grid.cellH);
                this.context.restore();
            }
        }
    }
    select(x, y) {
        super.select(x, y);
    }
    apply(x, y) {
        var changed = false;
        var pickerArea = this.tilePicker.getSelectionArea();
        var changedCell = x + y * this.map.width;
        if (Utils.isEmpty(this.map.layers[this.activeLayer].data)) {
            this.map.layers[this.activeLayer].data = [];
        }
        switch (this.editMode) {
            case Constant.EditMode.APPLY:
                if (Utils.isEmpty(pickerArea)) {
                    return false;
                }
                var tileColumns = this.map.tileset.imagewidth / this.grid.cellW;
                var appliedTile = pickerArea.x1 + pickerArea.y1 * tileColumns;
                for (let j = 0; j <= pickerArea.y2 - pickerArea.y1; j++) {
                    for (let i = 0; i <= pickerArea.x2 - pickerArea.x1; i++) {
                        if (x + i < this.map.width) {
                            let appliedTileOffset = i + j * tileColumns;
                            let changedCellOffset = i + j * this.map.width;
                            if (this.map.layers[this.activeLayer].data[changedCell + changedCellOffset] !== appliedTile + appliedTileOffset) {
                                changed = true;
                                this.map.layers[this.activeLayer].data[changedCell + changedCellOffset] = appliedTile + appliedTileOffset;
                            }
                        }
                    }
                }
                break;
            case Constant.EditMode.ERASE:
                if (Utils.isEmpty(pickerArea)) {
                    pickerArea = {
                        x1: 0, x2: 0, y1: 0, y2: 0
                    };
                }
                for (let j = 0; j <= pickerArea.y2 - pickerArea.y1; j++) {
                    for (let i = 0; i <= pickerArea.x2 - pickerArea.x1; i++) {
                        if (x + i < this.map.width) {
                            let changedCellOffset = i + j * this.map.width;
                            if (this.map.layers[this.activeLayer].data[changedCell + changedCellOffset] !== null) {
                                changed = true;
                                this.map.layers[this.activeLayer].data[changedCell + changedCellOffset] = null;
                            }
                        }
                    }
                }
                break;
        }
        return changed;
    }
    getSelectionArea() {
        if (!Utils.isEmpty(this.tilePicker)) {
            return this.tilePicker.getSelectionArea();
        }
        else {
            return null;
        }
    }
    renderLayer(layerIndex, tileImage, context, minRow, maxRow, minColumn, maxColumn) {
        if (layerIndex > this.activeLayer) {
            context.globalAlpha = MapperScene.UPPER_LEVEL_OPACITY;
        }
        super.renderLayer(layerIndex, tileImage, context, minRow, maxRow, minColumn, maxColumn);
    }
    renderInterLayerElements(layerIndex, minRow, maxRow, minColumn, maxColumn) {
        if (layerIndex === Constant.MapLayer.MID) {
            MapManager.renderUI(this.map, this.grid, this.context, this.renderingConfiguration, minRow, maxRow, minColumn, maxColumn);
        }
    }
    renderTopLayerElements(minRow, maxRow, minColumn, maxColumn) {
    }
    resizeMap(rows, columns) {
        MapManager.resizeMap(this.map, rows, columns);
    }
    setTilePicker(tilePicker) {
        this.tilePicker = tilePicker;
    }
    setActiveLayer(activeLayer) {
        this.activeLayer = activeLayer;
    }
    setEditMode(editMode) {
        this.editMode = editMode;
    }
    getMap() {
        return this.map;
    }
}
MapperScene.UPPER_LEVEL_OPACITY = 0.5;
var TilePicker;
(function (TilePicker) {
    var tilePicker;
    function start(canvas, callback) {
        tilePicker = null;
        new StaticGrid(canvas, function (grid) {
            new TilePickerScene(grid, canvas.height, canvas.width, function (scene) {
                tilePicker = scene;
                initInput(canvas, grid);
                tilePicker.start(canvas);
                tilePicker.toggleEditorGrid(true);
                callback(tilePicker);
            });
        }, GridTypeEnum.tilePicker);
    }
    TilePicker.start = start;
    function loadTile(tile, calback) {
        var canvasTile = $("#canvasTile")[0];
        var contextTile = canvasTile.getContext("2d");
        var canvasTilePicker = $("#canvasSelector")[0];
        contextTile.clearRect(0, 0, canvasTile.width, canvasTile.height);
        Resource.load(tile, 3, function (element) {
            var image = new Image();
            image.src = element.attr("src");
            $("#tilePanel").height(image.naturalHeight);
            canvasTile.height = image.naturalHeight;
            canvasTile.width = image.naturalWidth;
            canvasTilePicker.height = image.naturalHeight;
            canvasTilePicker.width = image.naturalWidth;
            contextTile.drawImage(element[0], 0, 0);
            TilePicker.start(canvasTilePicker, calback);
        });
    }
    TilePicker.loadTile = loadTile;
    function initInput(canvas, grid) {
        var inputCallbackMap = new Map();
        Input.init(canvas, grid, inputCallbackMap, function () { }, function () { }, function (x, y, mouseButton) {
            if (Utils.isEmpty(mouseButton) || mouseButton === Input.MouseButtons.LEFT) {
                tilePicker.select(x, y);
            }
        }, function (x, y, mouseButton) {
            if (Utils.isEmpty(mouseButton) || mouseButton === Input.MouseButtons.LEFT) {
                tilePicker.selectEnd(x, y);
            }
        }, function (x, y, mouseButton) {
            if (Utils.isEmpty(mouseButton) || mouseButton === Input.MouseButtons.LEFT) {
                tilePicker.selectEnd(x, y);
            }
            tilePicker.updatePointer(x, y);
        }, function (x, y) {
            tilePicker.updatePointer(x, y);
        }, function () { }, function () { }, function () { }, function (x, y) {
            tilePicker.cleanSelection();
        }, function () { console.log("doubleClick"); }, function () { console.log("wheel"); });
    }
    ;
    function saveData(callback = null) {
        var updatedData = $("#mapPanel").jstree(true).get_json("#");
        $.ajax({
            url: "edit/maps",
            type: "post",
            contentType: "application/json",
            data: JSON.stringify(updatedData),
            success: function (result) {
                console.log("Maps updated");
                if (callback !== null) {
                    callback(true);
                }
            }
        });
    }
    TilePicker.saveData = saveData;
    function setMapper(mapper) {
        tilePicker.setMapper(mapper);
    }
    TilePicker.setMapper = setMapper;
    ;
})(TilePicker || (TilePicker = {}));
class TilePickerScene extends AbstractTileScene {
    constructor(grid, heightPx, widthPx, callback) {
        super(grid, heightPx, widthPx);
        callback(this);
    }
    setMapper(mapper) {
        this.mapper = mapper;
    }
    select(x, y) {
        if (!Utils.isEmpty(this.mapper)) {
            this.mapper.cleanSelection();
        }
        super.select(x, y);
    }
}
class StaticGrid extends AbstractGrid {
    constructor(canvas, onCompleted, gridType, overriddenProperties) {
        super(canvas, onCompleted, gridType);
        this.overriddenProps = overriddenProperties;
    }
    deferredInit(props) {
        if (!Utils.isEmpty(this.overriddenProps)) {
            props = Utils.mergeMaps(this.overriddenProps, props);
        }
        super.deferredInit(props);
        this.tileColumns = props.get("tileColumns");
        switch (this.gridType) {
            case GridTypeEnum.mapper:
                this.canvasScales = [];
                this.canvasScales.push(props.get("canvasScaleD"));
                this.canvasScales.push(props.get("canvasScaleC"));
                this.canvasScales.push(props.get("canvasScaleB"));
                this.canvasScales.push(props.get("canvasScaleA"));
                var totCanvasScales = this.canvasScales.length;
                this.rowsList = new Array(totCanvasScales);
                this.columnsList = new Array(totCanvasScales);
                var selectedScaleId = totCanvasScales - 1;
                for (var i = 0; i < totCanvasScales; i++) {
                    this.rowsList[i] = Math.floor(this.rows / this.canvasScales[i]);
                    this.columnsList[i] = Math.floor(this.columns / this.canvasScales[i]);
                }
                this.selectScale(selectedScaleId);
                break;
            case GridTypeEnum.tilePicker:
                this.scaleX = 1;
                this.scaleY = 1;
                this.updateSize(this.canvas.width, this.canvas.height);
        }
    }
    selectScale(scaleId) {
        this.rows = this.rowsList[scaleId];
        this.columns = this.columnsList[scaleId];
        this.updateSizingDerivates();
        this.scaleX = this.canvasScales[scaleId];
        this.scaleY = this.canvasScales[scaleId];
    }
    updateSize(width, height) {
        this.rows = Math.floor(height / this.cellH);
        this.columns = Math.floor(width / this.cellW);
        this.updateSizingDerivates();
    }
    getBoundariesX(focusX, columns) {
        return super.getBoundariesX(focusX, columns);
    }
    getBoundariesY(focusY, rows) {
        return super.getBoundariesY(focusY, rows);
    }
    refresh() {
        super.refresh();
    }
}
var Tilesetter;
(function (Tilesetter) {
    var tilesetter;
    function start(canvas, callback) {
        tilesetter = null;
        new StaticGrid(canvas, function (grid) {
            let select = $("#editModes")[0];
            let tileEditMode = Constant.TileEditMode[select.value];
            new TilesetterScene(grid, canvas.height, canvas.width, tileEditMode, function (scene) {
                tilesetter = scene;
                initInput(canvas, grid);
                tilesetter.start(canvas);
                tilesetter.toggleEditorGrid(true);
                callback(tilesetter);
            });
        }, GridTypeEnum.tilePicker);
    }
    Tilesetter.start = start;
    function loadTile(tile, calback) {
        var canvasTile = $("#canvasTile")[0];
        var contextTile = canvasTile.getContext("2d");
        var canvasTilesetter = $("#canvasSelector")[0];
        contextTile.clearRect(0, 0, canvasTile.width, canvasTile.height);
        Resource.load(tile, 3, function (element) {
            var image = new Image();
            image.src = element.attr("src");
            $("#tilePanel").height(image.naturalHeight);
            canvasTile.height = image.naturalHeight;
            canvasTile.width = image.naturalWidth;
            canvasTilesetter.height = image.naturalHeight;
            canvasTilesetter.width = image.naturalWidth;
            contextTile.drawImage(element[0], 0, 0);
            Tilesetter.start(canvasTilesetter, calback);
        });
    }
    Tilesetter.loadTile = loadTile;
    function initInput(canvas, grid) {
        var inputCallbackMap = new Map();
        Input.init(canvas, grid, inputCallbackMap, function () { }, function () { }, function (x, y, mouseButton) {
            if (Utils.isEmpty(mouseButton) || mouseButton === Input.MouseButtons.LEFT) {
                tilesetter.select(x, y);
            }
        }, function (x, y, mouseButton) {
            if (Utils.isEmpty(mouseButton) || mouseButton === Input.MouseButtons.LEFT) {
                tilesetter.selectEnd(x, y);
            }
        }, function (x, y, mouseButton) {
            if (Utils.isEmpty(mouseButton) || mouseButton === Input.MouseButtons.LEFT) {
                tilesetter.selectEnd(x, y);
            }
            tilesetter.updatePointer(x, y);
        }, function (x, y) {
            tilesetter.updatePointer(x, y);
        }, function () { }, function () { }, function () { }, function (x, y) {
            tilesetter.cleanSelection();
        }, function () { console.log("doubleClick"); }, function () { console.log("wheel"); });
    }
    ;
    function saveData(callback = null) {
        var updatedData = $("#mapPanel").jstree(true).get_json("#");
        $.ajax({
            url: "edit/maps",
            type: "post",
            contentType: "application/json",
            data: JSON.stringify(updatedData),
            success: function (result) {
                console.log("Maps updated");
                if (callback !== null) {
                    callback(true);
                }
            }
        });
    }
    Tilesetter.saveData = saveData;
})(Tilesetter || (Tilesetter = {}));
var TilesetterPage;
(function (TilesetterPage) {
    TilesetterPage.PAGE_TITLE = document.title;
    TilesetterPage.BUTTON_ID_MODE = "mode";
    TilesetterPage.BUTTON_ID_LAYER = "layer";
    let flagEdited = false;
    function start() {
        Compatibility.check();
        var resizerCallback = function (props) {
            var width = +props.get("cellWidth") * +props.get("tileColumns") + 2;
            $("#toolsPanel").width(width);
        };
        Resource.loadProperties(resizerCallback);
        loadTiles();
        loadNews();
    }
    TilesetterPage.start = start;
    function loadTiles() {
        $.getJSON(base_path + "data/resources/tiles.json", function (data) {
            var sel = $("#tiles");
            for (var i = 0; i < data.length; i++) {
                sel.append("<option value='" + data[i].name + "'>" + data[i].desc
                    + "</option>");
            }
            changeTile();
        });
    }
    function loadNews() {
        $.getJSON(base_path + "news", function (data) {
            var news = $("#news");
        });
    }
    TilesetterPage.loadNews = loadNews;
    function changeTile() {
        let tile = $("#tiles").val();
        Tilesetter.loadTile(tile, function (tilesetter) {
            tilesetter.toggleBlocks(true);
        });
        changeEditState(true);
    }
    TilesetterPage.changeTile = changeTile;
    function changeTileEditMode() {
        let editMode = $("#editModes").val();
    }
    TilesetterPage.changeTileEditMode = changeTileEditMode;
    function save() {
    }
    TilesetterPage.save = save;
    function reload() {
    }
    TilesetterPage.reload = reload;
    function changeEditState(edited, mapChanged = true) {
        flagEdited = edited;
        if (edited) {
            document.title = TilesetterPage.PAGE_TITLE + "*";
        }
        else {
            document.title = TilesetterPage.PAGE_TITLE;
        }
        $("#saveButton")[0].disabled = !edited;
        $("#reloadButton")[0].disabled = !edited;
        if (mapChanged) {
        }
    }
    TilesetterPage.changeEditState = changeEditState;
})(TilesetterPage || (TilesetterPage = {}));
class TilesetterScene extends AbstractTileScene {
    constructor(grid, heightPx, widthPx, tileEditMode, callback) {
        super(grid, heightPx, widthPx);
        callback(this);
        this.changeTileEditMode(tileEditMode);
        this.map.width = this.getSceneWidth();
        this.map.height = this.getSceneHeight();
        this.map.blocks = [];
    }
    changeTileEditMode(tileEditMode) {
        this.toggleBlocks(false);
        switch (tileEditMode) {
            case Constant.TileEditMode.NONE:
                break;
            case Constant.TileEditMode.BLOCKS:
                this.toggleBlocks(true);
                break;
        }
        ;
    }
}
