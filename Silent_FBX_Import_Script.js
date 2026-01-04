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

// RUN
silentImport(
    "C:/Users/bmzif/Downloads/DownloadedFBXDemo/KickToTheGroin(2).fbx",
    "C:/Users/bmzif/Downloads/DownloadedFBXDemo/MmaKick.fbx"
);
