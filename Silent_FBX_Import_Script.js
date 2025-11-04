

function silentImport( pathA,  pathB) {

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
    importCharacter(pathA, 100); //"C:/Users/bmzif/Downloads/KickToTheGroin(2).fbx"
    importCharacter(pathB, -100); //"C:/Users/bmzif/Downloads/MmaKick.fbx"

    print("Multi-FBX import complete with animations and offsets.");

}

function save(){
	
	var s_bShiftPressed = false;
	var s_bControlPressed = false;
	var s_bAltPressed = false;
	var s_bMetaPressed = false;
		if( typeof( Action ) != "undefined" && Action.inherits( "DzScriptAction" ) ){
		if( !App.isKeySequenceDown( Action.shortcut ) ){
			updateModifierKeyState();
		}
	} else if( typeof( Action ) == "undefined" ) {
		updateModifierKeyState();
	}
	
	function updateModifierKeyState()
	{
		
		var nModifierState = App.modifierKeyState();
		s_bShiftPressed = (nModifierState & 0x02000000) != 0;
		s_bControlPressed = (nModifierState & 0x04000000) != 0;
		s_bAltPressed = (nModifierState & 0x08000000) != 0;
		s_bMetaPressed = (nModifierState & 0x10000000) != 0;
	};
	
	function debug()
	{
		if( !s_bAltPressed ){
			return;
		}
		var aArguments = [].slice.call( arguments );
		print( aArguments.join(" ") );
	};
	function text( sText )
	{
		if( typeof( qsTr ) != "undefined" ){
			return qsTr( sText );
		}
 		return sText;
	};
	function setDefaultOptions( oSettings )
	{
		oSettings.setBoolValue( "CompressOutput", false );
	};
	function setRequiredOptions( oSettings, bShowOptions )
	{
		oSettings.setBoolValue( "CompressOutput", false );
		oSettings.setBoolValue( "RunSilent", !bShowOptions );
	};
	var oAssetIOMgr = App.getAssetIOMgr();
	var sClassName = "DzSceneAssetFilter";
	var nAssetIOFilter = oAssetIOMgr.findFilter( sClassName );
	if( nAssetIOFilter < 0 ){
		MessageBox.critical( text( "An asset filter with the class name " +
			"\"%1\" could not be found.").arg( sClassName ),
			text( "Critical Error" ), text( "&OK" ) );
		return;
	}
	var oAssetIOFilter = oAssetIOMgr.getFilter( nAssetIOFilter );
	if( !oAssetIOFilter ){
		MessageBox.critical( text( "An asset filter with the class name " +
			"\"%1\" could not be found.").arg( sClassName ),
			text( "Critical Error" ), text( "&OK" ) );
		return;
	}
	var oSettings = new DzFileIOSettings();
	oAssetIOFilter.getDefaultOptions( oSettings );
	var bShowOptions = App.version64 >= 0x0004001400000007 ? s_bControlPressed : false;
	var bOptionsShown = false;
	var oContentMgr = App.getContentMgr();
	var sBasePath = oContentMgr.getContentDirectoryPath( 0 );
	setDefaultOptions( oSettings );
	debug( "Defaults:", oSettings.toJsonString() );
	if( !oAssetIOFilter.getOptions( oSettings, bShowOptions, "" ) ){
		return;
	} else {
		bOptionsShown = true;
		debug( "Get:", oSettings.toJsonString() );
	}
	setRequiredOptions( oSettings, !bOptionsShown );
	debug( "Required:", oSettings.toJsonString() );
	var sFile = String("%1/%2 Test").arg( sBasePath ).arg( sClassName );
	var oError = oAssetIOMgr.doSaveWithOptions( oAssetIOFilter, oSettings,
		false, sFile, sBasePath, "" );
	if( oError.valueOf() == 0x00000000 ){
		debug( "Saved:", sFile );
	} else {
		debug( "Error:", getErrorMessage( oError ) );
	}
	oAssetIOFilter.deleteLater();
}

silentImport("C:/Users/bmzif/Downloads/KickToTheGroin(2).fbx","C:/Users/bmzif/Downloads/MmaKick.fbx");
save();