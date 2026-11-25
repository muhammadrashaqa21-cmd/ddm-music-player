import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capgo/capacitor-native-audio';
import { Directory, Filesystem } from '@capacitor/filesystem';

window.DDMNativeAudio = {
  NativeAudio,
  Filesystem,
  Directory,
  isAndroid: Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
};
