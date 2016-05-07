import * as React from "react";

let spotifyLaunchPromise: Promise<any> = null;

function ensureSpotifyLaunched(): Promise<any> {
    if (!spotifyLaunchPromise) {
        spotifyLaunchPromise = fetch("https://dhfgiwmssc.spotilocal.com:4371/remote/status.json")
            .catch(err => {
                alert("For playback to work, you need to have Spotify open. " +
                    "Open it, then refresh the page.");
                throw err;
            });
    }
    return spotifyLaunchPromise;
}

export default class SpotifyButton extends React.Component<{uri: string}, {hover: boolean}> {
    state: {hover: boolean} = {
        hover: false,
    };

    render(): any {
        const uri = this.props.uri;
        return <span style={{width: 30, height: 30, marginLeft: -10,
                    display: "inline-block", verticalAlign: "top", overflow: "hidden"}}
                onMouseEnter={this._mouseOver}>
            <span style={{height: 30, width: 30, overflow: "hidden",
                position: "absolute"}}>
            {this.state.hover && <iframe src={`https://embed.spotify.com/?uri=${uri}`}
                style={{width: 75, height: 75, opacity: 0.0, marginLeft: -27, marginTop: -27}}
                width="80"
                height="80"
                frameborder="0"
                allowtransparency="true" />}
            </span>
            <i style={{marginLeft: 13, color: "rgb(83, 199, 242)"}}
                className="fa fa-play-circle-o" aria-hidden="true" />
        </span>;
    }

    private _mouseOver: () => void = () => {
        ensureSpotifyLaunched().then(() => {
            this.setState({
                hover: true,
            });
        });
    }
}
