function silentImport(pathA, pathB) {

    print("Clearing current scene...");
    Scene.clear();
    print("Scene cleared.");

    function trimPropertyKeysToFrameRange(prop, startFrame, endFrame) {
        if (typeof prop.getNumKeys !== "function" || typeof prop.getKeyTime !== "function" || typeof prop.deleteKeys !== "function") return;

		var ticksPerFrame = Scene.getTimeStep().valueOf(); // usually 160
		var keepStartTick = startFrame * ticksPerFrame;
		var keepEndTick = endFrame * ticksPerFrame;        

        for (var i = prop.getNumKeys() - 1; i >= 0; --i) {
            var t = prop.getKeyTime(i).valueOf(); // tick time
            if (t < keepStartTick || t > keepEndTick) {
                prop.deleteKeys(i,i); // index delete, safe in reverse
            }
        }
    }
	//recursively appends to props
	function getPropsOfChildren(node,props){
		//adds nodes properties to props
		props.push( node.getPropertyList()); 		
		if(node.getNumNodeChildren() ==0){ 
			//terminates if there are no children
			return ;
		}
	    var children = node.getNodeChildren(true);
	    for (var i = 0; i < children.length; i++) {
	        Array.prototype.push.apply(props, children[i].getPropertyList());
	    }
	}
    function applyRangeToNodes(node, startFrame, endFrame ) {
            var props = [];
            getPropsOfChildren(node, props);
            for (var p = 0; p < props.length; p++) {
                var prop = props[p];
                print(prop);
                //if (typeof prop.getNumKeys !== "function" || typeof prop.getKeyTime !== "function") continue;
                trimPropertyKeysToFrameRange(prop, startFrame, endFrame);
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
        var startFrame = 25;
        var endFrame= 30;  
        applyRangeToNodes(rootNode, startFrame, endFrame);
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
