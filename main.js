// Import and position function
function silentImport(pathA, pathB) {

    print("Clearing current scene...");
    Scene.clear();
    print("Scene cleared.");

    function importAndTransform(path, offsetX, yRotationRadians) {

        print("Importing: " + path);

        var importMgr = App.getImportMgr();
        var importer = importMgr.findImporterByClassName("DzFbxImporter");
        if (!importer) {
            MessageBox.critical("Importer not found", "Could not find FBX importer", "&OK");
            return null;
        }

        // Snapshot before import
        var oldNodes = Scene.getNodeList();
		print(oldNodes.length);
        var settings = new DzFileIOSettings();
        importer.getOptions(settings, true, "");

        settings.setStringValue("Take", "mixamo.com");
        settings.setBoolValue("RunSilent", true);
        settings.setBoolValue("MergeSkeletons", false);
        settings.setBoolValue("MergeClothing", false);
        settings.setBoolValue("LoadAnimation", true); // KEEP animation

        var ok = importer.readFile(path, settings);
        importer.deleteLater();

        if (!ok) {
            MessageBox.warning("Import failed", path, "&OK");
            return null;
        }

        // Detect new nodes
        var newNodes = Scene.getNodeList();
        print(newNodes.length);
        var rootNode = newNodes[oldNodes.length];
        

        if (!rootNode) {
            print("No root node detected for " + path);
            return null;
        }

        // Position
        rootNode.setWSPos(new DzVec3(offsetX, 0, 0));

        // Rotate (do NOT touch animation data)
        var quat = new DzQuat(
            DzRotationOrder("XYZ"),
            new DzVec3(0, yRotationRadians, 0)
        );
        rootNode.setWSRot(quat);

        print(
            "Imported & transformed: " + rootNode.getLabel() +
            " | X=" + offsetX +
            " | Y-rot=" + (yRotationRadians * 180 / Math.PI) + "°"
        );

        return rootNode;
    }

    // Character A: on +X, face LEFT (-X)
    var nodeA = importAndTransform(
        pathA,
        100,
        -Math.PI / 2   // -90°
    );

    // Character B: on -X, face RIGHT (+X)
    var nodeB = importAndTransform(
        pathB,
        -100,
        Math.PI / 2    // +90°
    );

    if (!nodeA || !nodeB) {
        print("Import failed.");
        return;
    }

    print("Both characters imported, positioned, rotated, and animated correctly.");
    print("done.");
}

// Save function 
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

//file source and destination (can be changed for different machines)
var fbxFolder = "C:/Users/bmzif/Downloads/DownloadedFBXDemo"; 
var saveFolder = "C:/Users/bmzif/Downloads/DestinationFBX";
//
function getSubFolders(folderPath) {
    var dir = new DzDir(folderPath);
    var entries = dir.entryList();
    var folders = [];

    for (var i = 0; i < entries.length; i++) {
        if (entries[i] === "." || entries[i] === "..") continue;
        var subPath = folderPath + "/" + entries[i];
        var subDir = new DzDir(subPath);
        if (subDir.exists()) {
            folders.push(subPath);
        }
    }
    return folders;
}

// Utility to list all FBX files in a folder
function getFBXFiles(folderPath) {
    var folder = new DzDir(folderPath);
    var files = folder.entryList(); // returns array of file names
    var fbxFiles = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i].toLowerCase().endsWith(".fbx")) {
            fbxFiles.push(folderPath + "/" + files[i]);
        }
    }
    return fbxFiles;
}


// 🔹 Main loop: iterate through every combination of two files
var comboFolders = getSubFolders(fbxFolder);

for (var c = 0; c < comboFolders.length; c++) {

    print("Processing combo folder: " + comboFolders[c]);

    // Expect exactly two animation subfolders
    var animationFolders = getSubFolders(comboFolders[c]);

    if (animationFolders.length !== 2) {
        print("Skipping (expected 2 animation folders): " + comboFolders[c]);
        continue;
    }

    var animAFolder = animationFolders[0];
    var animBFolder = animationFolders[1];

    var animAFiles = getFBXFiles(animAFolder);
    var animBFiles = getFBXFiles(animBFolder);

    if (animAFiles.length === 0 || animBFiles.length === 0) {
        print("Skipping (missing FBX files): " + comboFolders[c]);
        continue;
    }

    // Cartesian product: every A with every B
    for (var i = 0; i < animAFiles.length; i++) {
        for (var j = 0; j < animBFiles.length; j++) {

            silentImport(animAFiles[i], animBFiles[j]);

            var nameA = animAFiles[i].split("/").pop().replace(".fbx", "");
            var nameB = animBFiles[j].split("/").pop().replace(".fbx", "");

            saveSceneToPath(
                saveFolder,
                nameA + "_" + nameB
            );
        }
    }
}

print("All animation combinations processed.");
