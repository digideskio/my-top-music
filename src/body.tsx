import * as React from "react";
import {Button, Card} from "belle";
import {chunk, difference, identity, shuffle, sortBy, keyBy} from "lodash";

import {ISpotifyUser, ISpotifyUserTracks, ISpotifyUserAlbums, ISpotifyUserArtists,
    ISpotifyTrack, ISpotifyImage, ISpotifyArtist, IAudioFeature,
    getUser, getSongs, getAlbums, getArtists, getTopTracks, getTopArtists,
    getAudioFeatures} from "./ispotify";
import * as IndexCSS from "./index.css";
import SpotifyButton from "./spotifyButton";

import "whatwg-fetch";

interface IProps {
    error: string;
    accessToken: string;
    tokenType: string;
    /**
     * msec from render until when this page expires.
     */
    expiresIn: number;
}

interface IState {
    loading?: boolean;
    error?: string;

    me?: ISpotifyUser;
    songs?: ISpotifyUserTracks;
    albums?: ISpotifyUserAlbums;
    artists?: ISpotifyUserArtists;

    topTracks?: ISpotifyTrack[];
    shuffledTopTracks?: ISpotifyTrack[];
    longTermTopTracks?: ISpotifyTrack[];
    topArtists?: ISpotifyArtist[];
    longTermTopArtists?: ISpotifyArtist[];

    features?: IAudioFeature[];
    showArtists?: boolean;
}

const CLIENT_ID = "f4b4c29bf3c84dee8d194e94001a9b22";
const SCOPES = encodeURIComponent("user-top-read user-library-read user-follow-read");
const HERE = encodeURIComponent(window.location.origin + window.location.pathname);

const LOGIN_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}` +
                    `&scope=${SCOPES}&redirect_uri=${HERE}&response_type=token`;

function pluralize(count: number, one: string, many: string): string {
    if (count === 0) {
        return `no ${many}`;
    } else if (count === 1) {
        return `1 ${one}`;
    } else {
        return `${count} ${many}`;
    }
}

export class Body extends React.Component<IProps, IState> {
    state: IState = {
        loading: false,
        error: null,
        showArtists: false,
    };

    render(): React.ReactElement<any> {
        let forgottenArtists: ISpotifyArtist[];
        if (this.state.topArtists && this.state.longTermTopArtists) {
            forgottenArtists = this._computeArtistDifference(
                this.state.topArtists,
                this.state.longTermTopArtists
            );
        }

        let forgottenTracks: ISpotifyTrack[];
        if (this.state.topTracks && this.state.longTermTopTracks) {
            forgottenTracks = this._computeTrackDifference(
                this.state.topTracks,
                this.state.longTermTopTracks
            );
            console.log(forgottenTracks);
        }

        return <div>
            <div className={IndexCSS.topbar} />
            <header style={{textAlign: "center"}}>
                {this.state.me ?
                    <h1>
                        <strong>{this.state.me.display_name}</strong>'s Top Music
                    </h1> :
                    <h1>
                        <strong>My Top Music</strong> — Explore your Spotify library
                    </h1>}
                <div className={IndexCSS.subheader}>
                    {this.state.me ?
                        <span>
                            Created by <strong>
                                <a href="https://nettek.ca" target="_spotify">Joshua Netterfield</a>
                            </strong> using the Spotify API.
                        </span> : <span>
                            By <strong>
                                <a href="https://nettek.ca" target="_spotify">Joshua Netterfield</a>
                            </strong>.{" "}
                            <span>Created Saturday, May 7, 2016.</span>
                        </span>
                    }
                </div>
            </header>
            <br />
            {this.state.error && this._renderError()}
            {!this.props.tokenType && this._renderLoginButton()}
            {this.state.me && this._renderMe()}
            {this.state.topArtists && this.state.showArtists &&
                this._renderArtists(this.state.topArtists.slice(0, 15),
                    <span>
                        Here are your top <a href="javascript:void(0)"
                            onClick={this._showTracks}>tracks</a>/artists…
                    </span>)}
            {this.state.topTracks && !this.state.showArtists && this._renderTopTracks()}
            {this.state.features && this._renderFeatures()}
            {forgottenArtists && this._renderArtists(forgottenArtists.slice(0, 9),
                "Have you forgotten about these artists?")}
        </div>;
    }

    componentWillMount(): void {
        if (this.props.accessToken && !this.props.error) {
            this.setState({
                loading: true,
            });

            getUser(this._getHeaders())
                .then(me => {
                    this.setState({me});
                    _loadSongs();
                }, this._catchAll);

            let _loadSongs = () => {
                getSongs(this._getHeaders())
                    .then(songs => {
                        songs.items = shuffle(songs.items);
                        this.setState({songs});
                        _loadAlbums();
                    }, this._catchAll);
            };

            let _loadAlbums = () => {
                getAlbums(this._getHeaders())
                    .then(albums => {
                        albums.items = shuffle(albums.items);
                        this.setState({albums});
                        _loadArtists();
                    }, this._catchAll);
            };

            let _loadArtists = () => {
                getArtists(this._getHeaders())
                    .then(artists => {
                        artists.items = shuffle(artists.items);
                        this.setState({artists});
                        _loadTopArtists();
                    }, this._catchAll);
            };

            let _loadTopArtists = () => {
                getTopArtists(this._getHeaders(), "long_term", 35)
                    .then(longTermTopArtists => {
                        this.setState({longTermTopArtists});
                    }, this._catchAll);
                getTopArtists(this._getHeaders())
                    .then(topArtists => {
                        this.setState({topArtists});
                        _loadTopTracks();
                    }, this._catchAll);
            };

            let _loadTopTracks = () => {
                getTopTracks(this._getHeaders(), "long_term", 25)
                    .then(longTermTopTracks => {
                        this.setState({longTermTopTracks});
                    }, this._catchAll);
                getTopTracks(this._getHeaders())
                    .then(topTracks => {
                        const shuffledTopTracks = shuffle(topTracks);
                        this.setState({topTracks, shuffledTopTracks});
                        _loadAudioFeatures();
                    }, this._catchAll);
            };

            let _loadAudioFeatures = () => {
                getAudioFeatures(this._getHeaders(), this.state.topTracks.map(t => t.id))
                    .then(features => {
                        this.setState({features});
                    }, this._catchAll);
            };
        }
    }

    componentDidMount(): void {
        if (this.props.error) {
            this.setState({
                error: this.props.error,
            });
        }
        if (this.props.expiresIn) {
            setTimeout(() => {
                window.location.href = LOGIN_URL;
            }, this.props.expiresIn);
        }
    }

    private _getHeaders(): {[key: string]: string} {
        return {
            "Authorization": `Bearer ${this.props.accessToken}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
        };
    }

    private _renderError(): React.ReactElement<any> {
        let msg: string;
        if (this.props.error === "access_denied") {
            msg = "Access denied. You need to press the other button.";
        } else {
            msg = "An unknown error occurred. Email joshua@nettek.ca";
        }
        return <Card className={IndexCSS.loginWidget}>
            <p>
                {msg} Try again.
            </p>
        </Card>;
    }

    private _renderLoginButton(): React.ReactElement<any> {
        return <Card className={IndexCSS.loginWidget}>
            <p>
                See your top songs, find artists you've forgotten about, and much more!
            </p>
            <a href={LOGIN_URL}>
                <Button primary>
                    Login with Spotify
                </Button>
            </a>
        </Card>;
    }

    private _renderMe(): React.ReactElement<any> {
        return <Card style={{paddingBottom: 0}}>
            <h2 style={{textAlign: "center", marginTop: 0}}>
                In your Spotify library, you have…
            </h2>
            <p style={{display: "flex"}}>
            <span style={{flex: 1, marginLeft: -20, marginTop: -3,
                    fontFamily: "Alegreya Sans", fontSize: 16}}>
                <ul style={{marginRight: -10, marginTop: 10}}>
                    {this.state.songs && this.state.songs.items &&
                        <li>{this._someSongNames(3)}</li>}
                    {this.state.albums && this.state.albums.items &&
                        <li>{this._someAlbumNames(3)}</li>}
                    {this.state.artists && this.state.artists.items &&
                        <li>{this._someArtistNames(3)}</li>}
                </ul>
            </span>
            </p>
        </Card>;
    }

    private _someSongNames(max: number): any {
        let songs = this.state.songs.items.slice(0, max).map(song =>
            <span> <SpotifyButton uri={song.track.uri} />
                {song.track.name}, </span>);
        return <span>
            {songs}<strong>
                <a href="javascript: void(0)" onClick={this._shuffleSongs}
                    style={{color: "rgb(83, 199, 242)"}}>and{" "}
                    {pluralize(Math.max(this.state.songs.total - max, 0),
                               "other song", "other songs")}</a>
            </strong>.
        </span>;
    }

    private _shuffleSongs: () => void = () => {
        this.state.songs.items = shuffle(this.state.songs.items);
        this.forceUpdate();
    }

    private _someAlbumNames(max: number): any {
        let albums = this.state.albums.items.slice(0, max).map(album =>
            <span> <SpotifyButton uri={album.album.uri} />
                {album.album.name}, </span>);
        return <span>
            {albums}<strong>
                <a href="javascript: void(0)" onClick={this._shuffleAlbums}
                    style={{color: "rgb(83, 199, 242)"}}>and{" "}
                    {pluralize(Math.max(this.state.albums.total - max, 0),
                               "other album", "other albums")}</a>
            </strong>.
        </span>;
    }

    private _shuffleAlbums: () => void = () => {
        this.state.albums.items = shuffle(this.state.albums.items);
        this.forceUpdate();
    }

    private _someArtistNames(max: number): any {
        let albums = this.state.artists.items.slice(0, max).map(artist =>
            <span> <SpotifyButton uri={artist.uri} />{artist.name}, </span>);
        return <span>
            {albums}<strong>
                <a href="javascript: void(0)" onClick={this._shuffleArtists}
                    style={{color: "rgb(83, 199, 242)"}}>and{" "}
                    {pluralize(Math.max(this.state.artists.total - max, 0),
                               "other artist", "other artists")}</a>
            </strong>.
        </span>;
    }

    private _shuffleArtists: () => void = () => {
        this.state.artists.items = shuffle(this.state.artists.items);
        this.forceUpdate();
    }

    private _pickImg(images: ISpotifyImage[], minWidth: number): string {
        for (let i = 0; i < images.length; ++i) {
            if (images[i].width >= minWidth) {
                return images[i].url;
            }
        }
        if (images.length) {
            return images[0].url;
        }
        return "noimg.jpg";
    }

    private _renderArtists(artists: ISpotifyArtist[], header: any): React.ReactElement<any> {
        const imgObjs = artists
            .map(artist => ({
                name: artist.name,
                url: artist.external_urls.spotify,
                img: artist.images.length ? this._pickImg(artist.images, 200) : "noimg.jpg",
                uri: artist.uri,
            }));
        return <Card>
            <h2 style={{textAlign: "center", marginTop: 0}}>
                {header}
            </h2>
            <p style={{display: "flex", flexWrap: "wrap", flexDirection: "column",
                    height: 845 * 4 * artists.length / 50}}>
                {imgObjs.map(img =>
                    <span style={{maxHeight: 200, width: 200,
                            overflow: "hidden"}}>
                        <span style={{position: "absolute",
                                transform: "scale(7) translateX(13px) translateY(13px)",
                                opacity: 0}}><SpotifyButton uri={img.uri} /></span>
                        <img src={img.img} width={200} style={{margin: 0, padding: 0}}
                            alt={`${img.name}`} />
                    </span>
                )}
            </p>
        </Card>;
    }

    private _renderTopTracks(): React.ReactElement<any> {
        const shuffled = this.state.shuffledTopTracks;
        const imgObjs = chunk(shuffled, 8)
            .map(chunk => chunk[0])
            .concat(shuffled[shuffled.length - 1])
            .map(track => ({
                album: track.album ? track.album.name : "Placeholder Image",
                img: track.album ? this._pickImg(track.album.images, 200) : "noimg.jpg",
            }));
        return <Card>
            <h2 style={{textAlign: "center", marginTop: 0}}>
                Here are your top tracks/<a href="javascript:void(0)"
                    onClick={this._showArtists}>artists</a>…
            </h2>
            <p style={{display: "flex"}}>
            <span style={{height: 200}}>
                {imgObjs.map(img =>
                    <img src={img.img} height={200} width={200}
                        alt={`${img.album} cover`} style={{display: "block"}}/>
                )}
            </span>
            <span style={{flex: 1, marginTop: -3, fontFamily: "Alegreya Sans", fontSize: 16}}>
                <ul style={{marginRight: -10, marginTop: 10}}>
                    {this.state.topTracks.map(track => {
                        return <li>
                            <SpotifyButton uri={track.uri} />
                            <strong>{track.name}</strong> by{" "}
                                <i>{track.artists ? track.artists[0].name : "unknown"}</i>
                        </li>;
                    })}
                </ul>
            </span>
            </p>
        </Card>;
    }

    private _renderFeatures(): React.ReactElement<any> {
        const features: {[key: string]: IAudioFeature} = keyBy(this.state.features, "id");

        const sortedValence = sortBy(this.state.topTracks, t =>  features[t.id].valence);
        const backwardsValence = [].concat(sortedValence).reverse();
        const valanceMode = features[sortedValence[Math.floor(sortedValence.length / 2)].id].valence;

        const sortedDanceability = sortBy(this.state.topTracks, t =>  features[t.id].danceability);
        const backwardsDanceability = [].concat(sortedDanceability).reverse();
        const danceabilityMode = features[sortedDanceability[
            Math.floor(sortedDanceability.length / 2)].id].danceability;

        const sortedEnergy = sortBy(this.state.topTracks, t =>  features[t.id].energy);
        const backwardsEnergy = [].concat(sortedEnergy).reverse();
        const energyMode = features[sortedEnergy[
            Math.floor(sortedEnergy.length / 2)].id].energy;

        let valanceAbout: string;
        if (valanceMode < 0.2) {
            valanceAbout = "Your top songs are really sad.";
        } else if (valanceMode < 0.4) {
            valanceAbout = "Your top songs are mostly negative.";
        } else if (valanceMode < 0.6) {
            valanceAbout = "Your top songs are emotionally netural.";
        } else if (valanceMode < 0.8) {
            valanceAbout = "Your top songs are mostly happy.";
        } else {
            valanceAbout = "Your top songs are really cheerful.";
        }

        let danceabilityAbout: string;
        if (danceabilityMode < 0.2) {
            danceabilityAbout = "Your top songs have complex/missing rythms.";
        } else if (danceabilityMode < 0.4) {
            danceabilityAbout = "It would be hard to dance to your top songs.";
        } else if (danceabilityMode < 0.6) {
            danceabilityAbout = "Your top songs are moderately danceable.";
        } else if (danceabilityMode < 0.8) {
            danceabilityAbout = "Your top songs are pretty good for dancing";
        } else {
            danceabilityAbout = "Your top songs are made for dancing.";
        }

        let energyAbout: string;
        if (energyMode < 0.2) {
            energyAbout = "Your top songs are extremely calm.";
        } else if (energyMode < 0.4) {
            energyAbout = "Your top songs are calm.";
        } else if (energyMode < 0.6) {
            energyAbout = "Your top songs are neither energetic nor calm.";
        } else if (energyMode < 0.8) {
            energyAbout = "Your top songs are energetic";
        } else {
            energyAbout = "Your top songs are extremely energetic.";
        }

        return <Card>
            <h2 style={{textAlign: "center", marginTop: 0}}>
                {valanceAbout}
            </h2>
            <p style={{display: "flex"}}>
            <span style={{width: 120}}>
                Most negative:
            </span>
            <span style={{flex: 1, marginTop: -3, fontFamily: "Alegreya Sans", fontSize: 16}}>
                <ul style={{marginRight: -10, marginTop: 10}}>
                    {sortedValence.slice(0, 3).map(track => {
                        return <li>
                            <SpotifyButton uri={track.uri} />
                            <strong>{track.name}</strong> by{" "}
                                <i>{track.artists ? track.artists[0].name : "unknown"}</i>{"\u00a0"}
                                ({(features[track.id].valence * 100).toFixed(2)}% happy,{"\u00a0"}
                                    {features[track.id].mode ? "Major" : "Minor"})
                        </li>;
                    })}
                </ul>
            </span>
            </p>
            <p style={{display: "flex"}}>
            <span style={{width: 120}}>
                Most positive:
            </span>
            <span style={{flex: 1, marginTop: -3, fontFamily: "Alegreya Sans", fontSize: 16}}>
                <ul style={{marginRight: -10, marginTop: 10}}>
                    {backwardsValence.slice(0, 3).map(track => {
                        return <li>
                            <SpotifyButton uri={track.uri} />
                            <strong>{track.name}</strong> by{" "}
                                <i>{track.artists ? track.artists[0].name : "unknown"}</i>{"\u00a0"}
                                ({(features[track.id].valence * 100).toFixed(2)}% happy,{"\u00a0"}
                                    {features[track.id].mode ? "Major" : "Minor"})
                        </li>;
                    })}
                </ul>
            </span>
            </p>
            <h2 style={{textAlign: "center", marginTop: 0}}>
                {danceabilityAbout}
            </h2>
            <p style={{display: "flex"}}>
            <span style={{width: 120}}>
                Least danceable:
            </span>
            <span style={{flex: 1, marginTop: -3, fontFamily: "Alegreya Sans", fontSize: 16}}>
                <ul style={{marginRight: -10, marginTop: 10}}>
                    {sortedDanceability.slice(0, 3).map(track => {
                        return <li>
                            <SpotifyButton uri={track.uri} />
                            <strong>{track.name}</strong> by{" "}
                                <i>{track.artists ? track.artists[0].name : "unknown"}</i>{"\u00a0"}
                                ({(features[track.id].danceability * 100).toFixed(2)}%{" "}
                                    danceable, {features[track.id].tempo} bpm)
                        </li>;
                    })}
                </ul>
            </span>
            </p>
            <p style={{display: "flex"}}>
            <span style={{width: 120}}>
                Most danceable:
            </span>
            <span style={{flex: 1, marginTop: -3, fontFamily: "Alegreya Sans", fontSize: 16}}>
                <ul style={{marginRight: -10, marginTop: 10}}>
                    {backwardsDanceability.slice(0, 3).map(track => {
                        return <li>
                            <SpotifyButton uri={track.uri} />
                            <strong>{track.name}</strong> by{" "}
                                <i>{track.artists ? track.artists[0].name : "unknown"}</i>{"\u00a0"}
                                ({(features[track.id].danceability * 100).toFixed(2)}%{" "}
                                    danceable, {features[track.id].tempo} bpm)
                        </li>;
                    })}
                </ul>
            </span>
            </p>
            <h2 style={{textAlign: "center", marginTop: 0}}>
                {energyAbout}
            </h2>
            <p style={{display: "flex"}}>
            <span style={{width: 120}}>
                Least energetic:
            </span>
            <span style={{flex: 1, marginTop: -3, fontFamily: "Alegreya Sans", fontSize: 16}}>
                <ul style={{marginRight: -10, marginTop: 10}}>
                    {sortedEnergy.slice(0, 3).map(track => {
                        return <li>
                            <SpotifyButton uri={track.uri} />
                            <strong>{track.name}</strong> by{" "}
                                <i>{track.artists ? track.artists[0].name : "unknown"}</i>{"\u00a0"}
                                ({(features[track.id].energy * 100).toFixed(2)}% energetic,
                                    {features[track.id].tempo} bpm)
                        </li>;
                    })}
                </ul>
            </span>
            </p>
            <p style={{display: "flex"}}>
            <span style={{width: 120}}>
                Most energetic:
            </span>
            <span style={{flex: 1, marginTop: -3, fontFamily: "Alegreya Sans", fontSize: 16}}>
                <ul style={{marginRight: -10, marginTop: 10}}>
                    {backwardsEnergy.slice(0, 3).map(track => {
                        return <li>
                            <SpotifyButton uri={track.uri} />
                            <strong>{track.name}</strong> by{" "}
                                <i>{track.artists ? track.artists[0].name : "unknown"}</i>{"\u00a0"}
                                ({(features[track.id].energy * 100).toFixed(2)}% energetic,
                                    {features[track.id].tempo} bpm)
                        </li>;
                    })}
                </ul>
            </span>
            </p>
        </Card>;
    }

    private _showArtists: () => void = (): void => {
        this.setState({
            showArtists: true,
        });
    }

    private _showTracks: () => void = (): void => {
        this.setState({
            showArtists: false,
        });
    }

    private _catchAll: (err: any) => void = (err: any): void => {
        if (err instanceof Error && (err as Error).message === "needs-refresh") {
            window.location.href = LOGIN_URL;
        }
        this.setState({
            error: "unknown",
        });
    };

    private _computeArtistDifference(a: ISpotifyArtist[], b: ISpotifyArtist[]): ISpotifyArtist[] {
        let newArtists = a.map(artist => artist.name);
        let oldArtists = b.map(artist => artist.name);
        let diff = keyBy(difference(oldArtists, newArtists), identity);
        let diffObjects = b.filter(artist => !!diff[artist.name]);
        return diffObjects;
    }

    private _computeTrackDifference(a: ISpotifyTrack[], b: ISpotifyTrack[]): ISpotifyTrack[] {
        let newTracks = a.map(track => track.name);
        let oldTracks = b.map(track => track.name);
        let diff = keyBy(difference(oldTracks, newTracks), identity);
        let diffObjects = b.filter(artist => !!diff[artist.name]);
        return diffObjects;
    }
}

export default Body;
