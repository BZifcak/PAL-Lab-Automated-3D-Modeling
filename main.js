function trimPropertyKeysToFrameRange(prop, startFrame, endFrame, rebase) {
    if (typeof prop.getNumKeys !== "function" || typeof prop.getKeyTime !== "function" || typeof prop.deleteKeys !== "function") return;

    var ticksPerFrame = Scene.getTimeStep().valueOf(); // usually 160
    var keepStartTick = startFrame * ticksPerFrame;
    var keepEndTick = endFrame * ticksPerFrame;
    var shiftTicks = (startFrame - rebase) * ticksPerFrame;        
    var keys = [];
    for (var i = prop.getNumKeys() - 1; i >= 0; --i) {
        var t = prop.getKeyTime(i).valueOf(); // tick time
        if (t < keepStartTick || t > keepEndTick) {
            prop.deleteKeys(i,i); // index delete, safe in reverse
        } else {
                keys.push({
                time: prop.getKeyTime(i).valueOf(),
                value: prop.getKeyValue(i),
                });
                prop.deleteKeys(i,i);
        }
    }
    for(var i = 0; i < keys.length; i++){
        prop.setValue(new DzTime(keys[i].time - shiftTicks), keys[i].value);
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
function applyRangeToNodes(node, startFrame, endFrame, rebase ) {
        var props = [];
        getPropsOfChildren(node, props);
        for (var p = 0; p < props.length; p++) {
            var prop = props[p];
            trimPropertyKeysToFrameRange(prop, startFrame, endFrame,rebase);
        }
}
function importAndTransform(path, offset, yRotationRadians, startFrame, endFrame, rebase) {

    print("Importing: " + path);

    var importMgr = App.getImportMgr();
    var importer = importMgr.findImporterByClassName("DzFbxImporter");
    if (!importer) {
        MessageBox.critical("Importer not found", "Could not find FBX importer", "&OK");
        return null;
    }

    // Snapshot before import
    var oldNodes = Scene.getNodeList();
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

    //Node object
    var importedNodes = [];
    for (var i = oldNodes.length; i < newNodes.length; i++) {
        importedNodes.push(newNodes[i]);
    }
    var rootNode = importedNodes.length ? importedNodes[0] : null;
    //setting range for frames
    applyRangeToNodes(rootNode, startFrame, endFrame, rebase);
    if (!rootNode) {
        print("No root node detected for " + path);
        return null;
    }

    // Position
    rootNode.setWSPos(new DzVec3(offset.x, offset.y, offset.z));

    // Rotate (do NOT touch animation data)
    var quat = new DzQuat(
        DzRotationOrder("XYZ"),
        new DzVec3(0, yRotationRadians, 0)
    );
    rootNode.setWSRot(quat);

    print(
        "Imported & transformed: " + rootNode.getLabel() +
        " | XYZ=" + offset.x +","+offset.y +","+offset.z  +","+
        " | Y-rot=" + (yRotationRadians * 180 / Math.PI) + "°"
    );


    var props = rootNode.getPropertyList();
    return { rootNode: rootNode, nodes: importedNodes };;
    
}


function silentImport(pathA, pathB, event) {

    print("Clearing current scene...");
    resetScene();
    var cameraPos = determineCameraPos(event)[0];
    var cameraRot = determineCameraPos(event)[1];
    makeCamera(cameraPos,cameraRot);

    print("Scene cleared.");

    var offset = determineOffset(event);
    var Frames = determineFrames(event);


    // Character A: on +X, face LEFT (-X)
    var a = importAndTransform(
        pathA,
        offset[0],
        0,
        Frames[0].start,
        Frames[0].end,
        Frames[0].rebase   
    );

    // Character B: on -X, face RIGHT (+X)
    var b = importAndTransform(
        pathB,
        offset[1],
        Math.PI,
        Frames[1].start,
        Frames[1].end,
        Frames[1].rebase

    );
    var animRange = determineAnimationRange(event);
    Scene.setAnimRange(animRange);
    print("post-import + modification play range: " + Scene.getPlayRange());
    print("post-import + modification animation range: " + Scene.getAnimRange());
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
function makeCamera(cameraPosition, cameraRotation){
    var oCam = new DzBasicCamera();
    oCam.setName("Dynamic Camera");
    Scene.addNode(oCam);
    oCam.setWSPos(new DzVec3(cameraPosition.x, cameraPosition.y, cameraPosition.z));
    oCam.setWSRot(new DzQuat(
        DzRotationOrder("XYZ"),
        new DzVec3(cameraRotation.x, cameraRotation.y, cameraRotation.z)
    ));
}


/***
 * lookup table for positioning offset. 
 * The value is an array containing objects with XYZ positions for the first and second characters respectively distance each character is placed from the origin in the positive and negative direction on the x axis
 */
function determineOffset(event){
    var offsetLookup = {
        "Punching_TakingPunch" : [{x: 30, y: 10, z: 3},{x: 15,y: 0, z: 0}],
        "Fireball_FallingDown" : [{x: 27, y: 10, z: 3},{x: 27,y: 0, z: 0}],
        "BlowAKiss_GoalKeeprMiss" : [{x: 36, y: 10, z: 3},{x: 36,y: 0, z: 0}],
    };
    if(event in offsetLookup){
        return offsetLookup[event];
    }
    print("determineOffset lookup failed");
    return -1;

}

/***
 * lookup table for camera positioning
 * The value is an array containing two objects with XYZ fields, 
 * the first object is the cameras positioning in the scene, 
 * the second object is the cameras xyz rotations
 */
function determineCameraPos(event){
	var posLookup = {
		 "Punching_TakingPunch" : [{x: 30, y: 10, z: 3},{x: 15,y: 0, z: 0}],
        "Fireball_FallingDown" : [{x: 27, y: 10, z: 3},{x: 27,y: 0, z: 0}],
        "BlowAKiss_GoalKeeprMiss" : [{x: 36, y: 10, z: 3},{x: 36,y: 0, z: 0}],
	};
	if(event in posLookup){
		return posLookup[event]
	}
    print("determineCameraPos lookup failed");
    return -1;
}
/***
 * lookup table for AnimationRanges
 * The lookup tables value is a Daz Time object containing the frame range for the final animation in the form
 * (start frame * the timeStep (in scene rate of time), endFrame * the timeStep)
 * this is determined by event name for the whole scene, not by character
 */
function determineAnimationRange(event){
	var rangeLookup = {
		 "Punching_TakingPunch" : new DzTimeRange( new DzTime(0 * Scene.getTimeStep().valueOf()), new DzTime(60 * Scene.getTimeStep().valueOf())),
        "Fireball_FallingDown" : new DzTimeRange( new DzTime(0 * Scene.getTimeStep().valueOf()), new DzTime(60 * Scene.getTimeStep().valueOf())),
        "BlowAKiss_GoalKeeprMiss" : new DzTimeRange( new DzTime(0 * Scene.getTimeStep().valueOf()), new DzTime(60 * Scene.getTimeStep().valueOf()))
	};
	if(event in rangeLookup){
		return rangeLookup[event]
	}
    print("determineAnimationRange lookup failed");
    return -1;
}
/***
 * lookup table for the frames to cut each animation down to
 * values represent range the original set of frames
 * values are arrays, where the array elements are the frame ranges for the first and second characters respectively, followed by the frame that the animation will begin playing
 */
function determineFrames(event){
    var frameLookup = {
        "Punching_TakingPunch" : [{start: 0, end: 30, rebase: 0},{start: 0,end: 15, rebase: 15}],
        "Fireball_FallingDown" : [{start: 0, end: 30, rebase: 0},{start: 0,end: 15, rebase: 15}],
        "BlowAKiss_GoalKeeprMiss" : [{start: 0, end: 30, rebase: 0},{start: 0,end: 15, rebase: 15}]
    }
    if(event in frameLookup){
        return frameLookup[event];
    }
    print("determineFrames lookup failed");
    return -1;
}

/***
 * Clears the scene and loads in the scene with default backdrop and camera
 */
function resetScene(){
    Scene.clear();
    //loads in scene with backdrop and camera
    Scene.loadScene("C:/Users/bmzif/Downloads/DefaultScene.duf","open");
}


//file source and destination (can be changed for different machines)
var fbxFolder = "C:/Users/bmzif/Downloads/DownloadedSmallerDemo"; 
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
