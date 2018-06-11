import Platform from "react-native";
import RNFS from "react-native-fs";

// export default class Directory {
//     static get VIDEO() {
//         return Platform.select({
//             ios: () => RNFS.DocumentDirectoryPath + "/videos/",
//             android: () => RNFS.DocumentDirectoryPath + "/videos/"
//         })();
//     }

//     static get ICON() {
//         return Platform.select({
//             ios: () => RNFS.DocumentDirectoryPath + "/icons/",
//             android: () => RNFS.DocumentDirectoryPath + "/icons/"
//         })();
//     }

//     static get PICTOGRAM() {
//         return Platform.select({
//             ios: () => RNFS.DocumentDirectoryPath + "/pictograms/",
//             android: () => RNFS.DocumentDirectoryPath + "/pictograms/"
//         })();
//     }
// }

export default {
    VIDEO: RNFS.DocumentDirectoryPath + "/videos/",
    ICON: RNFS.DocumentDirectoryPath + "/icons/",
    PICTOGRAM: RNFS.DocumentDirectoryPath + "/pictograms/"
}