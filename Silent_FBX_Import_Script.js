function silentImport(pathA, pathB) {

    print("Clearing current scene...");
    Scene.clear();
    print("Scene cleared.");

    function trimPropertyKeysToFrameRange(prop, startFrame, endFrame) {
        if (typeof prop.getNumKeys !== "function" || typeof prop.getKeyTime !== "function" || typeof prop.deleteKeys !== "function") return;

        var ticksPerFrame = Scene.getTimeStep().valueOf();
        var keepStart = Math.round(startFrame * ticksPerFrame);
        var keepEnd = Math.round(endFrame * ticksPerFrame);

        var kr = prop.getKeyRange();
        if (!kr) return;
        print("keyRange start and end: " + kr.start + " " + kr.end + "\n and frames being kept are " + keepStart + " to " + keepEnd);
        // delete before keep window
        if (kr.start < keepStart) {
            prop.deleteKeys(kr.start, keepStart - 1);
        }

        // delete after keep window
 
        kr = prop.getKeyRange(); // refresh after first delete
        if (kr && kr.end > keepEnd) {
            prop.deleteKeys(keepEnd + 1, kr.end);
        }
    }


    function applyRangeToNodes(nodes, startFrame, endFrame ) {
        for (var i = 0; i < 10; i++) {
            //replace '10' with nodes.length
            var props = nodes[i].getPropertyList();
            for (var p = 0; p < props.length; p++) {
                var prop = props[p];
                if (typeof prop.getNumKeys !== "function" || typeof prop.getKeyTime !== "function") continue;
                trimPropertyKeysToFrameRange(prop, startFrame, endFrame);
            }
        }
    }
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

        //Node object
        var importedNodes = [];
        for (var i = oldNodes.length; i < newNodes.length; i++) {
            importedNodes.push(newNodes[i]);
        }
        var rootNode = importedNodes.length ? importedNodes[0] : null;
        //setting range for frames
        var startFrame = 0;
        var endFrame= 30;  
        applyRangeToNodes(importedNodes, startFrame, endFrame);

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


        var props = rootNode.getPropertyList();
        print(props);
        print("props length: " + props.length);
        return { rootNode: rootNode, nodes: importedNodes };;
        
    }

    var a = importAndTransform(pathA, 100, -Math.PI / 2);
    var b = importAndTransform(pathB, -100, Math.PI / 2);

    if (!a || !b) {
        print("Import failed.");
        return;
    }

    print("Both characters imported, positioned, rotated, and animated correctly.");
    print("done.");
}

// RUN
silentImport(
    "C:/Users/bmzif/Downloads/Two Handed Sword Death.fbx",
    "C:/Users/bmzif/Downloads/Bayonet Stab.fbx"
);
