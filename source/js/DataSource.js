const MDXParser = require('./MDXParser.js');
const pivotLocale = require('./PivotLocale.js');

/**
 * Data source.
 *
 * Must implement methods.
 *
 * @param {Object} config
 * @param {Object} globalConfig
 * @param {LightPivotTable} lpt
 * @param {number=1} [drillLevel]
 * @constructor
 */
var DataSource = function (config, globalConfig, lpt, drillLevel) {

    this.SOURCE_URL = config.MDX2JSONSource ||
        location.host + ":" + location.port + "/" + (location.pathname.split("/") || [])[1];
    this.NAMESPACE = config["namespace"];
    this.USERNAME = config["username"];
    this.PASSWORD = config["password"];
    this.LPT = lpt;
    this.GLOBAL_CONFIG = globalConfig;
    this.SEND_COOKIES = config["sendCookies"] || false;
    this.DRILL_LEVEL = typeof drillLevel !== "number" ? 1 : drillLevel;

    this.BASIC_MDX = config.basicMDX;
    /**
     * Name of data source pivot.
     *
     * @type {string}
     */
    this.DATA_SOURCE_PIVOT = config["pivot"] || "";

    this.FILTERS = [];

};

/**
 * @param {string} url
 * @param {object} data
 * @param {function} callback
 * @private
 */
DataSource.prototype._post = function (url, data, callback) {
    var xhr = new XMLHttpRequest(),
        self = this;
    xhr.open("POST", url);
    if (this.SEND_COOKIES) xhr.withCredentials = true;
    xhr.onreadystatechange = function () {
        var handler;
        if (xhr.readyState === 4) {
            handler = self.LPT.CONFIG.triggers["responseHandler"];
            if (typeof handler === "function") {
                handler.call(self.LPT, {
                    url: url,
                    status: xhr.status
                });
            }
        }
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback((function () {
                try {
                    return JSON.parse(xhr.responseText) || {}
                } catch (e) {
                    try {
                        var temp = null;
                        eval("temp=" + xhr.responseText);
                        return temp;
                    } catch (e) {
                        return {
                            error: "<h1>Unable to parse server response</h1><p>" + xhr.responseText
                            + "</p>"
                        };
                    }
                }
            })());
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            callback({
                error: xhr.responseText || pivotLocale.get(3) + "<br/>" +
                       xhr.status + ": " + xhr.statusText
            });
        }
    };
    if (this.USERNAME && this.PASSWORD) {
        xhr.setRequestHeader("Authorization", "Basic " + btoa(this.USERNAME + ":" + this.PASSWORD));
    }
    xhr.send(JSON.stringify(data));
};

/**
 * Converts data from MDX2JSON source to LightPivotTable representation.
 *
 * @param {object} data
 * @private
 */
DataSource.prototype._convert = function (data) {

    var o;

    if (typeof data !== "object" || data.error) return { error: data.error || true };

    try {
        o = {
            dimensions: [
                data["Cols"][0]["tuples"],
                data["Cols"][1]["tuples"]
            ],
            dataArray: data["Data"],
            info: data["Info"]
        };
        return o;
    } catch (e) {
        console.error("Error while parsing data:", e);
        return { error: data.error || true };
    }

};

/**
 * @param {string} spec - an MDX specification of the filter.
 */
DataSource.prototype.setFilter = function (spec) {

    this.FILTERS.push(spec);

};

DataSource.prototype.clearFilters = function () {

    this.FILTERS = [];

};

/**
 * @param {function} callback
 */
DataSource.prototype.getCurrentData = function (callback) {

    var _ = this,
        __ = this._convert,
        mdx = this.BASIC_MDX,
        mdxParser = new MDXParser(),
        mdxType = mdx ? mdxParser.mdxType(mdx) : "",
        ready = {
            state: 0,
            data: {},
            pivotData: {}
        };

    var setupPivotOptions = function () {

        var data = ready.pivotData;

        _.BASIC_MDX = data.mdx;
        mdx = _.BASIC_MDX;
        mdxType = mdxParser.mdxType(mdx);

        _.GLOBAL_CONFIG["pivotProperties"] = ready.pivotData;

        if (data["rowAxisOptions"]) {
            if (data["rowAxisOptions"]["drilldownSpec"]) {
                _.GLOBAL_CONFIG["DrillDownExpression"] =
                    _.GLOBAL_CONFIG["DrillDownExpression"]
                    || data["rowAxisOptions"]["drilldownSpec"].split("^");
            }
            if (data["rowAxisOptions"]["levelFormat"]
                || data["columnAxisOptions"]
                && data["columnAxisOptions"]["levelFormat"]) {
                _.GLOBAL_CONFIG["formatNumbers"] =
                    _.GLOBAL_CONFIG["formatNumbers"]
                    || data["columnAxisOptions"]["levelFormat"]
                    || data["rowAxisOptions"]["levelFormat"];
            }
        }

    };

    var handleDataReady = function () {

        var data = ready.data;

        //console.log("Retrieved data:", ready);

        if (mdxType === "drillthrough") {
            callback((function (data) {

                var arr = data["children"] || [],
                    headers = [],
                    obj, i, u;

                if (!arr.length) return {
                    error: pivotLocale.get(4)
                };

                for (i in arr[0]) {
                    headers.push({ caption: i });
                }

                obj = {
                    Cols: [ { tuples: headers }, { tuples: [] } ],
                    Data: [],
                    Info: {
                        colCount: 8,
                        cubeClass: "No cube class",
                        cubeName: "No cube name",
                        leftHeaderColumnsNumber: 0,
                        rowCount: arr.length,
                        topHeaderRowsNumber: headers.length,
                        mdxType: mdxType
                    }
                };

                for (i in arr) {
                    for (u in arr[i]) {
                        obj.Data.push(arr[i][u]);
                    }
                }

                return __(obj);

            })(data));
        } else if (mdxType === "mdx") {
            if (!data || !data.Data || !data.Cols
            || (!data.Data.length && !((data.Cols[0]||{}).tuples||[]).length)
            && !((data.Cols[1]||{}).tuples||[]).length) {
                return callback({
                    error: pivotLocale.get(4)
                });
            }
            callback(_._convert(data));
        } else {
            callback({ error: "Unrecognised MDX type: " + mdx || true });
        }

    };

    var requestData = function () {

        for (var i = 0; i < _.FILTERS.length; i++) {
            mdx = mdxParser.applyFilter(mdx, _.FILTERS[i]);
        }

        if (typeof _.GLOBAL_CONFIG.rowCount === "number") {
            mdx = mdxParser.applyRowCount(mdx, _.GLOBAL_CONFIG.rowCount);
        }

        if (_.LPT.CONFIG["logs"]) console.log("LPT MDX request:", mdx);

        var setData = function (data) {
            _.LPT.pivotView.removeMessage();
            ready.data = data;
            ready.state++;
            handleDataReady();
        };

        // fill initial data first time and exit
        if (_.DRILL_LEVEL === 0 && _.LPT.CONFIG["initialData"]) {
            setData(_.LPT.CONFIG["initialData"]);
            return;
        }

        _._post(
            _.SOURCE_URL + "/" +
            (mdxType === "drillthrough" ? "MDXDrillthrough" : "MDX")
            + (_.NAMESPACE ? "?Namespace=" + _.NAMESPACE : ""
        ), {
            MDX: mdx
        }, setData);

    };

    _.LPT.pivotView.displayLoading();

    if (!this.BASIC_MDX && this.DATA_SOURCE_PIVOT) {
        this._post(this.SOURCE_URL + "/DataSource"
                       + (_.NAMESPACE ? "?Namespace=" + _.NAMESPACE : ""), {
            DataSource: this.DATA_SOURCE_PIVOT
        }, function (data) {
            ready.pivotData = data;
            ready.state++;
            setupPivotOptions();
            requestData();
        });
    } else {
        _.GLOBAL_CONFIG["pivotProperties"] = {};
        requestData();
    }

};

module.exports = DataSource;