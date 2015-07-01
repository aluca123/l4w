var Resource;
(function (Resource) {
    var properties = new Map();
    ;
    function loadPropertes(file, onLoadCallback) {
        if (file in properties) {
            return properties[file];
        }
        else {
            var parsePropertiesCallback = function () {
                var props = parseProperties(this.responseText);
                properties[file] = props;
                onLoadCallback(props);
            };
            var request = new XMLHttpRequest();
            request.onload = parsePropertiesCallback;
            request.onerror = function () {
                console.log("error getting " + file);
            };
            request.ontimeout = function () {
                console.log("timeout getting " + file);
            };
            request.open("get", "data/" + file + ".properties", true);
            request.send();
        }
    }
    Resource.loadPropertes = loadPropertes;
    ;
    function parseProperties(content) {
        var props = new Map();
        var lines = content.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line !== "" && line.indexOf("#") !== 0) {
                var lineTokens = line.split("=");
                props[lineTokens[0]] = lineTokens[1];
            }
        }
        return props;
    }
    ;
})(Resource || (Resource = {}));