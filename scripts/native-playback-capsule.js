import { registerPlugin } from '@capacitor/core';

const bridge = window.DDMNativeAudio;
if (bridge?.isAndroid) {
  const capsule = registerPlugin('PlaybackCapsule');
  const metadataByAsset = new Map();
  const originalAudio = bridge.NativeAudio;
  const wrappedMethods = new Map();
  let capsuleUpdate = Promise.resolve();
  let activeAssetId = null;
  let isPlaying = false;
  let permissionSettingsOpened = false;

  function reportCapsuleError(error) {
    console.error('Kapsul pemutar Android gagal diperbarui:', error);
  }

  async function updateCapsule(requestPermission) {
    if (!isPlaying || !activeAssetId) {
      await capsule.hide();
      return;
    }

    const permission = await capsule.hasOverlayPermission();
    if (!permission.granted) {
      if (requestPermission && !permissionSettingsOpened) {
        permissionSettingsOpened = true;
        await capsule.openOverlayPermissionSettings();
      }
      return;
    }

    permissionSettingsOpened = false;
    if (!document.hidden) {
      await capsule.hide();
      return;
    }

    const metadata = metadataByAsset.get(activeAssetId) || {};
    await capsule.show({
      title: metadata.title || 'DDM Music',
      artist: metadata.artist || 'Sedang diputar'
    });
  }

  function setPlaybackState(assetId, playing, requestPermission) {
    if (assetId) activeAssetId = assetId;
    isPlaying = playing;
    capsuleUpdate = capsuleUpdate
      .then(() => updateCapsule(requestPermission))
      .catch(reportCapsuleError);
  }

  const methodWrappers = {
    preload: async (options, original) => {
      const result = await original(options);
      if (options?.assetId) {
        metadataByAsset.set(options.assetId, options.notificationMetadata || {});
      }
      return result;
    },
    play: async (options, original) => {
      const result = await original(options);
      setPlaybackState(options?.assetId, true, true);
      return result;
    },
    resume: async (options, original) => {
      const result = await original(options);
      setPlaybackState(options?.assetId, true, true);
      return result;
    },
    pause: async (options, original) => {
      const result = await original(options);
      if (!options?.assetId || options.assetId === activeAssetId) {
        setPlaybackState(options?.assetId, false, false);
      }
      return result;
    },
    stop: async (options, original) => {
      const result = await original(options);
      if (!options?.assetId || options.assetId === activeAssetId) {
        setPlaybackState(options?.assetId, false, false);
      }
      return result;
    }
  };

  bridge.NativeAudio = new Proxy(originalAudio, {
    get(target, property) {
      const original = Reflect.get(target, property, target);
      const wrap = methodWrappers[property];
      if (typeof original !== 'function' || !wrap) {
        return typeof original === 'function' ? original.bind(target) : original;
      }
      if (!wrappedMethods.has(property)) {
        wrappedMethods.set(property, (...args) =>
          wrap(args[0], original.bind(target))
        );
      }
      return wrappedMethods.get(property);
    }
  });

  void bridge.NativeAudio.addListener('playbackState', event => {
    if (event.assetId && activeAssetId && event.assetId !== activeAssetId) return;
    const playing = event.isPlaying === true || event.state === 'playing';
    setPlaybackState(event.assetId, playing, false);
  }).catch(reportCapsuleError);

  void bridge.NativeAudio.addListener('complete', event => {
    if (!event.assetId || event.assetId === activeAssetId) {
      setPlaybackState(event.assetId, false, false);
    }
  }).catch(reportCapsuleError);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isPlaying && activeAssetId) {
      permissionSettingsOpened = false;
      capsuleUpdate = capsuleUpdate
        .then(() => updateCapsule(false))
        .catch(reportCapsuleError);
    } else if (document.hidden && isPlaying && activeAssetId) {
      capsuleUpdate = capsuleUpdate
        .then(() => updateCapsule(false))
        .catch(reportCapsuleError);
    }
  });
}
