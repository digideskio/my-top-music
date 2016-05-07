export interface ISpotifyImage {
    height: number;
    width: number;
    url: string;
}

export interface ISpotifyUser {
    display_name: string;
    external_urls: {
        spotify: string;
    };
    followers: {
        href: string; // null ?
        total: number;
    };
    href: string; // API string
    id: string;
    images: ISpotifyImage[];
    type: "user";
    uri: string; // of form "spotify:user:jnetterf";
}

export function getUser(headers: {[key: string]: any}): Promise<ISpotifyUser> {
    return fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers,
    }).then(response => {
        return response.json();
    }).then(msg => {
        if (msg && msg.error && msg.error.status === 401) {
            throw new Error("needs-refresh");
        } else if (msg && msg.error) {
            throw new Error("unknown");
        } else {
            return msg as any as ISpotifyUser;
        }
    });
}

export interface ISpotifyAlbumSimplified {
    album_type: "album" | "single" | "compilation";
    available_markets: string[];
    external_urls: {
        spotify: string;
    };
    href: string; // API
    id: string;
    images: ISpotifyImage[];
    name: string;
    type: "album";
    uri: string;
};

export interface ISpotifyTrackSimplied {
    artists: ISpotifyAlbumSimplified[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_urls: {
        spotify: string;
    };
    href: string;
    id: string;
    name: string;
    preview_url: string;
    track_number: number;
    type: "track";
    uri: string;
}

export interface ISpotifyTrack extends ISpotifyTrackSimplied {
    album: ISpotifyAlbumSimplified;
    external_ids: {
        isrc: string;
    };
    popularity: string;
};

export interface ISpotifyUserTrack {
    added_at: string; // ISO 8601
    track: ISpotifyTrack;
}

export interface ISpotifyUserTracks {
  href: string;
  items: ISpotifyUserTrack[];
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
}

export function getSongs(headers: {[key: string]: any}): Promise<ISpotifyUserTracks> {
    return fetch("https://api.spotify.com/v1/me/tracks", {
        method: "GET",
        headers,
    }).then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error("Invalid response " + response);
        }
    }).then(songs => {
        return songs as any as ISpotifyUserTracks;
    });
}

export interface ISpotifyUserAlbum {
    added_at: string; // ISO 8601
    album: ISpotifyAlbum;
}

export interface ISpotifyAlbum extends ISpotifyAlbumSimplified {
    copyrights: {
        text: string;
        type: string;
    }[];
    genres: string[];
    popularity: number;
    release_date: string; // ISO 8601 date
    release_date_precision: "day";
    tracks: {
      href: string;
      items: ISpotifyTrackSimplied[];
      limit: number;
      next: string;
      offset: number;
      previous: string;
      total: number;
    };
    type: "album";
    uri: string;
}

export interface ISpotifyUserAlbums {
    href: string;
    items: ISpotifyUserAlbum[];
    limit: number;
    next: string;
    offset: number;
    previous: string;
    total: number;
}

export function getAlbums(headers: {[key: string]: any}): Promise<ISpotifyUserAlbums> {
    return fetch("https://api.spotify.com/v1/me/albums", {
        method: "GET",
        headers,
    }).then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error("Invalid response " + response);
        }
    }).then(songs => {
        console.log(songs);
        return songs as any as ISpotifyUserAlbums;
    });
}

export interface ISpotifyArtistSimplified {
    external_urls: {
        spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: "artist";
    uri: string;
}

export interface ISpotifyArtist extends ISpotifyArtistSimplified {
    followers: {
        href: string;
        total: number;
    };
    genres: string[];
    images: ISpotifyImage[];
    popularity: number;
}

export interface ISpotifyUserArtists {
    cursors: {
        after: string;
    };
    href: string;
    items: ISpotifyArtist[];
    limit: number;
    next: string;
    total: number;
}

export function getArtists(headers: {[key: string]: any}): Promise<ISpotifyUserArtists> {
    return fetch("https://api.spotify.com/v1/me/following?type=artist", {
        method: "GET",
        headers,
    }).then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error("Invalid response " + response);
        }
    }).then(artists => {
        return artists.artists as any as ISpotifyUserArtists;
    });
}

export function getTopTracks(headers: {[key: string]: any},
        term: string = "medium_term", count: number = 50): Promise<ISpotifyTrack[]> {
    return fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${count}&time_range=${term}`, {
        method: "GET",
        headers,
    }).then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error("Invalid response " + response);
        }
    }).then(tracks => {
        return tracks.items as any as ISpotifyTrack[];
    });
};

export function getTopArtists(headers: {[key: string]: any},
        term: string = "medium_term", count: number = 50): Promise<ISpotifyArtist[]> {
    return fetch(`https://api.spotify.com/v1/me/top/artists?limit=${count}&time_range=${term}`, {
        method: "GET",
        headers,
    }).then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error("Invalid response " + response);
        }
    }).then(artists => {
        return artists.items as any as ISpotifyArtist[];
    });
};

export interface IAudioFeature {
    acousticness: number;
    analysis_url: string;
    danceability: number;
    duration_ms: number;
    energy: number;
    id: string;
    instrumentalness: number;
    key: number;
    liveness: number;
    loudness: number;
    mode: number;
    speechiness: number;
    tempo: number;
    time_signature: number;
    track_href: string;
    typee: "audio_features";
    uri: string;
    valence: number;
}

export function getAudioFeatures(headers: {[key: string]: any},
        songs: string[]): Promise<IAudioFeature[]> {
    return fetch(`https://api.spotify.com/v1/audio-features/?ids=${songs.join(",")}`, {
        method: "GET",
        headers,
    }).then(response => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error("Invalid response " + response);
        }
    }).then(features => {
        console.log(features);
        return features.audio_features as any as IAudioFeature[];
    });
}
