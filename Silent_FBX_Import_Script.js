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
