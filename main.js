// Import and position function
function silentImport(pathA, pathB,event) {

    print("Clearing current scene...");
    resetScene();
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


    function applyRangeToNodes(nodes, startFrame, endFrame ) {
        for (var i = 0; i < nodes.length; i++) {
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
    var offset = determineOffset(event);

    // Character A: on +X, face LEFT (-X)
    var a = importAndTransform(
        pathA,
        offset,
        -Math.PI / 2   // -90°
    );

    // Character B: on -X, face RIGHT (+X)
    var b = importAndTransform(
        pathB,
        -offset,
        Math.PI / 2    // +90°
    );

    if (!a || !b) {
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


/***
 * camera constructor with hard coded positioning,
 * TODO: parameterize positioning
 */
function makeCamera(){
var oCam = new DzBasicCamera();
oCam.setName("My New Camera");
Scene.addNode(oCam);

    oCam.setWSPos(new DzVec3(0, 130, 400));
    oCam.setWSRot(new DzQuat(
        DzRotationOrder("XYZ"),
        new DzVec3(0, 0, 0)
    ));
}


/***
 * lookup table for positioning offset. 
 * The value is the distance each character is placed from the origin in the positive and negative direction on the x axis
 */
function determineOffset(event){
    var offsetLookup = {
        "Punching_TakingPunch" : 43,
        "Fireball_FallingDown" : 55,
        "BlowAKiss_GoalKeeprMiss" : 73
    };
    if(event in offsetLookup){
        return offsetLookup[event];
    }
    print("lookup failed");
    return -1;

}
/***
 * lookup table for the frames to cut each animation down to
 * values represent range the original set of frames
 */
function determineFrames(){}

/***
 * Clears the scene and loads in the scene with default backdrop and camera
 */
function resetScene(){
    Scene.clear();
    //loads in scene with backdrop and camera
    Scene.loadScene("C:/Users/bmzif/Downloads/DefaultScene.duf","open");
}


//file source and destination (can be changed for different machines)
var fbxFolder = "C:/Users/bmzif/Downloads/DownloadedFBXDemo"; 
var saveFolder = "C:/Users/bmzif/Downloads/DestinationFBX";


/***
 * When given a folder, returns an array of the subfolders of that folder. 
 */
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

/***
 * Utility to list all FBX files in a folder
 */
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


//Main loop: iterate through every combination of two files
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
    var actionName = comboFolders[c].split("/")[comboFolders[c].split("/").length -1];
    // Cartesian product: every A with every B
    //Discrete math was important afterall
    for (var i = 0; i < animAFiles.length; i++) {
        for (var j = 0; j < animBFiles.length; j++) {
            var nameA = animAFiles[i].split("/").pop().replace(".fbx", "");
            var nameB = animBFiles[j].split("/").pop().replace(".fbx", "");
            if (nameA ==nameB ){
                print("skipping "+ nameA + " + " +nameB + " scene." );
            } else{
            silentImport(animAFiles[i], animBFiles[j],actionName);
            saveSceneToPath(
                saveFolder,
                nameA + "_" + nameB + "_" + actionName
            );
        }
        }
    }
}

print("All animation combinations processed.");
