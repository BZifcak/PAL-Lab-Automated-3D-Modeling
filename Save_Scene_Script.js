/**********************************************************************
 
	This script is provided as part of the Daz Script Documentation. The
	contents of this script, and\or any portion thereof, may only be used
	in accordance with the following license:
 
	Creative Commons Attribution 3.0 Unported (CC BY 3.0)
	- http://creativecommons.org/licenses/by/3.0
 
	To contact Daz 3D or for more information about Daz Script visit the
	Daz 3D website:
 
	- http://www.daz3d.com
 
**********************************************************************/
// Source: http://docs.daz3d.com/doku.php/public/software/dazstudio/4/referenceguide/scripting/api_reference/samples/file_io/save_duf_scene/start

// Define an anonymous function;
// serves as our main loop,
// limits the scope of variables
function save(){
	
	// Initialize 'static' variables that hold modifier key state
	var s_bShiftPressed = false;
	var s_bControlPressed = false;
	var s_bAltPressed = false;
	var s_bMetaPressed = false;
	
	// If the "Action" global transient is defined, and its the correct type
	if( typeof( Action ) != "undefined" && Action.inherits( "DzScriptAction" ) ){
		// If the current key sequence for the action is not pressed
		if( !App.isKeySequenceDown( Action.shortcut ) ){
			updateModifierKeyState();
		}
	// If the "Action" global transient is not defined
	} else if( typeof( Action ) == "undefined" ) {
		updateModifierKeyState();
	}
	
	/*********************************************************************/
	// void : A function for updating the keyboard modifier state
	function updateModifierKeyState()
	{
		// Get the current modifier key state
		var nModifierState = App.modifierKeyState();
		// Update variables that hold modifier key state
		s_bShiftPressed = (nModifierState & 0x02000000) != 0;
		s_bControlPressed = (nModifierState & 0x04000000) != 0;
		s_bAltPressed = (nModifierState & 0x08000000) != 0;
		s_bMetaPressed = (nModifierState & 0x10000000) != 0;
	};
	
	/*********************************************************************/
	// void : A function for printing only if debugging
	function debug()
	{
		// If we are not debugging
		if( !s_bAltPressed ){
			// We are done...
			return;
		}
		
		// Convert the arguments object into an array
		var aArguments = [].slice.call( arguments );
		
		// Print the array
		print( aArguments.join(" ") );
	};
	
	/*********************************************************************/
	// String : A function for retrieving a translation if one exists
	function text( sText )
	{
		// If the version of the application supports qsTr()
		if( typeof( qsTr ) != "undefined" ){
			// Return the translated (if any) text
			return qsTr( sText );
		}
 
		// Return the original text
		return sText;
	};
	
	/*********************************************************************/
	// void : A function for setting the default options
	function setDefaultOptions( oSettings )
	{
		// Set the initial state of the compress file checkbox
		oSettings.setBoolValue( "CompressOutput", false );
	};
	
	/*********************************************************************/
	// void : A function for setting the required options
	function setRequiredOptions( oSettings, bShowOptions )
	{
		// Set the initial state of the compress file checkbox
		oSettings.setBoolValue( "CompressOutput", false );
		
		// Do not to show the options
		oSettings.setBoolValue( "RunSilent", !bShowOptions );
	};
	
	/*********************************************************************/
	// Get the asset IO manager
	var oAssetIOMgr = App.getAssetIOMgr();
	// Define the class name of the asset filter we want to use
	var sClassName = "DzSceneAssetFilter";
	// Find the index of the asset filter with the class name we want
	var nAssetIOFilter = oAssetIOMgr.findFilter( sClassName );
	// If we did not find an asset filter with the class name we wanted
	if( nAssetIOFilter < 0 ){
		// Inform the user
		MessageBox.critical( text( "An asset filter with the class name " +
			"\"%1\" could not be found.").arg( sClassName ),
			text( "Critical Error" ), text( "&OK" ) );
		
		// We are done...
		return;
	}
	
	// Get the asset filter at the prescribed index
	var oAssetIOFilter = oAssetIOMgr.getFilter( nAssetIOFilter );
	// If we do not have a valid asset filter
	if( !oAssetIOFilter ){
		// Inform the user
		MessageBox.critical( text( "An asset filter with the class name " +
			"\"%1\" could not be found.").arg( sClassName ),
			text( "Critical Error" ), text( "&OK" ) );
		
		// We are done...
		return;
	}
	
	// Create a settings object
	var oSettings = new DzFileIOSettings();
	
	// Get the default settings
	oAssetIOFilter.getDefaultOptions( oSettings );
	
	// Define whether or not to show options; 4.20.0.7+
	var bShowOptions = App.version64 >= 0x0004001400000007 ? s_bControlPressed : false;
	var bOptionsShown = false;
	
	// Get the content manager
	var oContentMgr = App.getContentMgr();
	
	// Get the base path - the first mapped content directory
	var sBasePath = oContentMgr.getContentDirectoryPath( 0 );
	
	// Set the default options; this can be used to set
	// options before the dialog is displayed
	setDefaultOptions( oSettings );
	
	// Debug
	debug( "Defaults:", oSettings.toJsonString() );
	
	// If we are showing options, we can override the last saved state
	// by passing in the settings we want to override;
	// if we cannot get the default/saved options for the asset filter,
	// without displaying the options dialog
	if( !oAssetIOFilter.getOptions( oSettings, bShowOptions, "" ) ){
		// We are done...
		return;
	// If we can get the options for the importer
	} else {
		// Capture that options were shown
		bOptionsShown = true;
		
		// Debug
		debug( "Get:", oSettings.toJsonString() );
	}
	
	
	// Set the required options; override user settings if needed
	setRequiredOptions( oSettings, !bOptionsShown );
	
	// Debug
	debug( "Required:", oSettings.toJsonString() );
	
	// Construct the name of the file to save to; omit file extension
	var sFile = String("%1/%2 Test").arg( sBasePath ).arg( sClassName );
	
	// Use the asset manager to save a file, using the filter and defined settings
	var oError = oAssetIOMgr.doSaveWithOptions( oAssetIOFilter, oSettings,
		false, sFile, sBasePath, "" );
	
	// If there was no error
	if( oError.valueOf() == 0x00000000 ){
		// Debug
		debug( "Saved:", sFile );
	// If there was an error
	} else {
		// Debug
		debug( "Error:", getErrorMessage( oError ) );
	}
	
	// Clean up; do not leak memory
	oAssetIOFilter.deleteLater();
	
// Finalize the function and invoke
}