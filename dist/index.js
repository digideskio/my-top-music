"use strict";
var React = require("react");
var ReactDOM = require("react-dom");
var Injection_1 = require("react-hot-loader/Injection");
var belle_1 = require("belle");
var lodash_1 = require("lodash");
var body_1 = require("./body");
(function main() {
    belle_1.style.card.style = {
        marginBottom: 20,
        padding: 20,
        borderRadius: 2,
        boxShadow: "0 1px 1px rgba(0, 0, 0, 0.2)",
        boxSizing: "border-box",
        borderTop: "1px solid rgba(0, 0, 0, 0.1)",
    };
    belle_1.style.button.style = lodash_1.extend(belle_1.style.button.primaryStyle, {
        fontFamily: "Alegreya Sans",
    });
    var hashParams = lodash_1.fromPairs(window.location.hash.substr(1).split("&").map(function (a) { return a.split("="); }));
    var queryParams = lodash_1.fromPairs(window.location.search.substr(1).split("&").map(function (a) { return a.split("="); }));
    var params = lodash_1.extend({}, hashParams, queryParams);
    history.replaceState(null, null, window.location.origin + window.location.pathname);
    // Prevent sharing of personal access token
    var rootInstance = ReactDOM.render(React.createElement(body_1.default, {error: params.error, accessToken: params.access_token, tokenType: params.token_type, expiresIn: params.expires_in * 1000}), document.getElementById("root"));
    if (module.hot) {
        Injection_1.RootInstanceProvider.injectProvider({
            getRootInstances: function () {
                // Help React Hot Loader figure out the root component instances on the page:
                return [rootInstance];
            },
        });
    }
}());
//# sourceMappingURL=index.js.map