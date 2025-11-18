// Can be updated for running on different machines
var fbxFolder = "C:/Users/bmzif/Downloads/DownloadedFBXDemo"; 
var saveFolder = "C:/Users/bmzif/OneDrive/Documents/DAZ 3D/Studio/My Library/Scenes";

// Utility to list all FBX files in a folder
function getFBXFiles(folderPath) {
    var folder = new DzFile(folderPath);
    var files = folder.entryList(); // returns array of file names
    var fbxFiles = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].toLowerCase().endsWith(".fbx")) {
            fbxFiles.push(folderPath + "/" + files[i]);
        }
    }
    return fbxFiles;
}

// Import & save function as before
function silentImport(pathA, pathB) {
    print("Clearing current scene...");
    Scene.clear();
    print("Scene cleared.");

    function importCharacter(path, offsetX) {
        print("Importing: " + path);
        var oImportMgr = App.getImportMgr();
        var oImporter = oImportMgr.findImporterByClassName("DzFbxImporter");
        if (!oImporter) {
            MessageBox.critical("Importer not found", "Could not find FBX importer", "&OK");
            return;
        }

        var oldNodes = Scene.getNodeList();
        var oSettings = new DzFileIOSettings();
        oSettings.setStringValue("Take", "mixamo.com");
        oSettings.setBoolValue("RunSilent", true);
        oSettings.setBoolValue("MergeSkeletons", false);
        oSettings.setBoolValue("MergeClothing", false);

        var result = oImporter.readFile(path, oSettings);
        oImporter.deleteLater();
        if (!result) {
            MessageBox.warning("Import failed", "FBX import failed for: " + path, "&OK");
            return;
        }

        var newNodes = Scene.getNodeList();
        var importedNodes = [];
        for (var i = 0; i < newNodes.length; i++) {
            if (oldNodes.indexOf(newNodes[i]) === -1) {
                importedNodes.push(newNodes[i]);
            }
        }

        if (importedNodes.length > 0) {
            var rootNode = importedNodes[0];
            for (var i = 0; i < importedNodes.length; i++) {
                if (importedNodes[i].getNumChildren && importedNodes[i].getNumChildren() > 0) {
                    rootNode = importedNodes[i];
                    break;
                }
            }
            rootNode.setWSPos(new DzVec3(offsetX, 0, 0));
        }
    }

    importCharacter(pathA, 100);
    importCharacter(pathB, -100);
    print("Imported pair: " + pathA + " + " + pathB);
}

// Save function as before
function saveSceneToPath(saveFolderPath, fileNameWithoutExtension) {
    var oAssetIOMgr = App.getAssetIOMgr();
    var nAssetIOFilter = oAssetIOMgr.findFilter("DzSceneAssetFilter");
    if (nAssetIOFilter < 0) {
        MessageBox.critical("Scene filter not found", "Error", "&OK");
        return;
    }

    var oAssetIOFilter = oAssetIOMgr.getFilter(nAssetIOFilter);
    var oSettings = new DzFileIOSettings();
    oAssetIOFilter.getDefaultOptions(oSettings);
    oSettings.setBoolValue("CompressOutput", false);
    oSettings.setBoolValue("RunSilent", true);

    var sFullPath = saveFolderPath + "/" + fileNameWithoutExtension + ".duf";
    var oError = oAssetIOMgr.doSaveWithOptions(oAssetIOFilter, oSettings, false, sFullPath, "", "");

    if (oError.valueOf() === 0x00000000) {
        print("Scene saved to: " + sFullPath);
    } else {
        print("Error saving scene (" + oError.valueOf() + "): " + App.errorString(oError));
    }

    oSettings.deleteLater();
    oAssetIOFilter.deleteLater();
}

// 🔹 Main loop: iterate through every combination of two files
var fbxFiles = getFBXFiles(fbxFolder);

for (var i = 0; i < fbxFiles.length; i++) {
    for (var j = i + 1; j < fbxFiles.length; j++) {
        silentImport(fbxFiles[i], fbxFiles[j]);
        var nameA = fbxFiles[i].split("/").pop().replace(".fbx", "");
        var nameB = fbxFiles[j].split("/").pop().replace(".fbx", "");
        saveSceneToPath(saveFolder, nameA + "_" + nameB);
    }
}

print("All combinations processed.");