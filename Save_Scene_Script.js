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

