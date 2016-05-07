import * as React from "react";
import * as ReactDOM from "react-dom";
import {RootInstanceProvider} from "react-hot-loader/Injection";
import {style} from "belle";
import {extend, fromPairs} from "lodash";

import Body from "./body";

(function main(): void {
    style.card.style = {
        marginBottom: 20,
        padding: 20,
        borderRadius: 2,
        boxShadow: "0 1px 1px rgba(0, 0, 0, 0.2)",
        boxSizing: "border-box",
        borderTop: "1px solid rgba(0, 0, 0, 0.1)",
    };

    style.button.style = extend(style.button.primaryStyle, {
        fontFamily: "Alegreya Sans",
    });

    let hashParams = fromPairs(window.location.hash.substr(1).split("&").map(a => a.split("=")));
    let queryParams = fromPairs(window.location.search.substr(1).split("&").map(a => a.split("=")));
    let params: any = extend({}, hashParams, queryParams);

    history.replaceState(null, null, window.location.origin + window.location.pathname);
        // Prevent sharing of personal access token

    const rootInstance = ReactDOM.render(<Body
        error={params.error}
        accessToken={params.access_token}
        tokenType={params.token_type}
        expiresIn={params.expires_in * 1000}
    />, document.getElementById("root"));

    if ((module as any).hot) {
        RootInstanceProvider.injectProvider({
            getRootInstances: function(): (React.Component<any, any> | Element | void)[] {
                // Help React Hot Loader figure out the root component instances on the page:
                return [rootInstance];
            },
        });
    }
}());
