import { Platform } from "react-native";
import RNFS from "react-native-fs";

export default class Directory {
    static get VIDEO() {
        return Platform.select({
            ios: () => RNFS.MainBundlePath+"/assets/videos/",
            android: () => RNFS.DocumentDirectoryPath + "/videos/"
        })();
    }

    static get ICON() {
        return Platform.select({
            ios: () => RNFS.MainBundlePath+"/assets/icons/",
            android: () => RNFS.DocumentDirectoryPath + "/icons/"
        })();
    }

    static get PICTOGRAM() {
        return Platform.select({
            ios: () => RNFS.DocumentDirectoryPath + "/pictograms/",
            android: () => RNFS.DocumentDirectoryPath + "/pictograms/"
        })();
    }

    static get TEXT() {
        return Platform.select({
            ios: () => RNFS.CachesDirectoryPath,
            android: () => RNFS.DocumentDirectoryPath + "/texts/"
        })();
    }
}
