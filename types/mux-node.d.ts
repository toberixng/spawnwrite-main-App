// types/mux-node.d.ts
declare module '@mux/mux-node' {
    export function createMuxClient(options: { tokenId: string; tokenSecret: string }): {
      video: {
        uploads: {
          create: (options: {
            cors_origin: string;
            new_asset_settings: { playback_policy: string[] };
          }) => Promise<{ url: string; asset_id: string }>;
        };
        assets: {
          retrieve: (assetId: string) => Promise<{ playback_ids?: { id: string }[] }>;
        };
      };
    };
  }