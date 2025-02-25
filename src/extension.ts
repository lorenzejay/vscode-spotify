import { ExtensionContext, window } from "vscode";
import * as vscode from "vscode";
import { createCommands } from "./commands";
import { SpotifyStatus } from "./components/spotify-status";
import {
  connectPlaylistTreeView,
  TreePlaylistProvider,
} from "./components/tree-playlists";
import {
  connectAlbumTreeView,
  TreeAlbumProvider,
} from "./components/tree-albums";
import {
  connectTrackTreeView,
  TreeTrackProvider,
} from "./components/tree-track";
import { registerGlobalState } from "./config/spotify-config";
import { SpotifyStatusController } from "./spotify-status-controller";
import { SpoifyClientSingleton } from "./spotify/spotify-client";
import { getStore } from "./store/store";
import type { Client } from "tangle";
import { SpotifyWebview } from "./components/webview-tracks";
import { ILoginState, IPlayerState, ITrack } from "./state/state";
import { getState } from "./store/store";

// This method is called when your extension is activated. Activation is
// controlled by the activation events defined in package.json.
export function activate(context: ExtensionContext) {
  // This line of code will only be executed once when your extension is activated.
  registerGlobalState(context.globalState);
  getStore(context.globalState).getState();

  const spotifyStatus = new SpotifyStatus();
  const controller = new SpotifyStatusController();
  const playlistTreeView = window.createTreeView("vscode-spotify-playlists", {
    treeDataProvider: new TreePlaylistProvider(),
  });
  const albumTreeView = window.createTreeView("vscode-spotify-albums", {
    treeDataProvider: new TreeAlbumProvider(),
  });
  const treeTrackProvider = new TreeTrackProvider();
  const trackTreeView = window.createTreeView("vscode-spotify-tracks", {
    treeDataProvider: treeTrackProvider,
  });
  treeTrackProvider.bindView(trackTreeView);
  //webview window
  context.subscriptions.push(
    vscode.commands.registerCommand("spotify.showWebview", () => {
      SpotifyWebview.createOrShow(context.extensionUri);
    })
  );
  // Add to a list of disposables which are disposed when this extension is deactivated.
  context.subscriptions.push(connectPlaylistTreeView(playlistTreeView));
  context.subscriptions.push(connectAlbumTreeView(albumTreeView));
  context.subscriptions.push(connectTrackTreeView(trackTreeView));
  context.subscriptions.push(controller);
  context.subscriptions.push(spotifyStatus);
  context.subscriptions.push(playlistTreeView);
  context.subscriptions.push(
    createCommands(SpoifyClientSingleton.spotifyClient)
  );

  return {
    marquee: {
      setup: (
        tangle: Client<{
          track: ITrack;
          playerState: IPlayerState;
          loginState: ILoginState;
        }>
      ) => {
        getStore().subscribe(() => {
          const { track, playerState, loginState } = getState();
          tangle.emit("loginState", loginState);
          tangle.emit("track", track);
          tangle.emit("playerState", playerState);
        });
      },
    },
  };
}
