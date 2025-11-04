

function silentImport(pathA, pathB) {

    // 🔹 Clear the current scene before importing anything
    print("Clearing current scene...");
    Scene.clear();
    print("Scene cleared.");

    function importCharacter(path, offsetX) {
        print("Importing: " + path);

        // Create a new importer instance
        var oImportMgr = App.getImportMgr();
        var sClassName = "DzFbxImporter";
        var oImporter = oImportMgr.findImporterByClassName(sClassName);
        if (!oImporter) {
            MessageBox.critical("Importer not found", "Could not find FBX importer", "&OK");
            return;
        }

        // Snapshot of current nodes
        var oldNodes = Scene.getNodeList();

        // Prepare importer settings
        var oSettings = new DzFileIOSettings();
        var bShowOptions = true;
        var bOptionsBeforeFile = (bShowOptions && App.version64 >= 0x0004000900030016);
        if (!oImporter.getOptions(oSettings, bShowOptions && bOptionsBeforeFile, "")) {
            print("Failed to initialize importer options.");
            oImporter.deleteLater();
            return;
        }

        oSettings.setStringValue("Take", "mixamo.com");
        if (App.version64 >= 0x0004000900030016) {
            oSettings.setBoolValue("ShowIndividualSettings", true);
        }
        oSettings.setIntValue("RunSilent", (bShowOptions && !bOptionsBeforeFile ? 0 : 1));
        oSettings.setBoolValue("MergeSkeletons", false);
        oSettings.setBoolValue("MergeClothing", false);

        // Perform import
        var result = oImporter.readFile(path, oSettings);
        oImporter.deleteLater();
        if (!result) {
            MessageBox.warning("Import failed", "FBX import failed for: " + path, "&OK");
            return;
        }

        // Detect newly imported nodes
        var newNodes = Scene.getNodeList();
        var importedNodes = [];
        for (var i = 0; i < newNodes.length; i++) {
            if (oldNodes.indexOf(newNodes[i]) === -1) {
                importedNodes.push(newNodes[i]);
            }
        }

        if (importedNodes.length > 0) {
            // Pick the first node with children, or first node if none
            var rootNode = importedNodes[0];
            for (var i = 0; i < importedNodes.length; i++) {
                if (importedNodes[i].getNumChildren && importedNodes[i].getNumChildren() > 0) {
                    rootNode = importedNodes[i];
                    break;
                }
            }

            // Move character
            rootNode.setWSPos(new DzVec3(offsetX, 0, 0));
            print("Imported node: " + rootNode.getLabel() + " moved to X=" + offsetX);
        } else {
            MessageBox.warning("Import detection failed", "No new node detected for: " + path, "&OK");
        }
    }

    // Import two characters independently
    importCharacter(pathA, 100);  // Example: "C:/Users/bmzif/Downloads/KickToTheGroin(2).fbx"
    importCharacter(pathB, -100); // Example: "C:/Users/bmzif/Downloads/MmaKick.fbx"

    print("Multi-FBX import complete with animations and offsets.");
}

function saveSceneToPath(saveFolderPath, fileNameWithoutExtension) {
    var oAssetIOMgr = App.getAssetIOMgr();
    var sClassName = "DzSceneAssetFilter";
    var nAssetIOFilter = oAssetIOMgr.findFilter(sClassName);
    if (nAssetIOFilter < 0) {
        MessageBox.critical("Scene filter not found", "Error", "&OK");
        return;
    }

    var oAssetIOFilter = oAssetIOMgr.getFilter(nAssetIOFilter);
    if (!oAssetIOFilter) {
        MessageBox.critical("Scene filter not valid", "Error", "&OK");
        return;
    }

    // Create save options
    var oSettings = new DzFileIOSettings();
    oAssetIOFilter.getDefaultOptions(oSettings);
    oSettings.setBoolValue("CompressOutput", false);
    oSettings.setBoolValue("RunSilent", true);

    // Construct full path with extension
    var sFullPath = saveFolderPath + "/" + fileNameWithoutExtension + ".duf";

    // Perform the save
    var oError = oAssetIOMgr.doSaveWithOptions(
        oAssetIOFilter,
        oSettings,
        false,      // showOptionsDialog
        sFullPath,
        "",         // base path (unused for scenes)
        ""
    );

    // Print result
    if (oError.valueOf() === 0x00000000) {
        print("Scene saved to: " + sFullPath);
    } else {
        print("Error saving scene (" + oError.valueOf() + "): " + App.errorString(oError));
    }

    // Cleanup
    oSettings.deleteLater();
    oAssetIOFilter.deleteLater();
}


silentImport("C:/Users/bmzif/Downloads/KickToTheGroin(2).fbx","C:/Users/bmzif/Downloads/MmaKick.fbx");
var saveLocation = "C:/Users/bmzif/OneDrive/Documents/DAZ 3D/Studio/My Library/Scenes"
saveSceneToPath(saveLocation, "Demo1");