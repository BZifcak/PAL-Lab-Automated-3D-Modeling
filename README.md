# PAL Lab Automated 3D Modeling
Automates 3D video generation in Daz Studio by merging two pre-existing animations into a single scene, synchronizing timelines, aligning characters and cameras, and producing final rendered videos. It provides Daz Script modules, example DUF scenes, orchestration wrappers, and CI-ready rendering presets to support reproducible, extensible pipelines for research-grade stimulus creation.
# Purpose
This project supports the Perception and Language Lab at the University of Delaware by enabling dependable, automated creation of multi-character and multi-animation stimuli for experiments and demos. It is designed for repeatable stimulus generation, parameter sweeps, and batch rendering to accelerate perceptual and language research workflows.
# Product Requirements Document (PRD) #

## Two-Character Automated FBX Import, Alignment & Scene Export Tool for DAZ Studio

---

## 1. Overview

This project automates the process of importing two Mixamo-style FBX animation files into DAZ Studio, placing the characters into a shared scene, aligning them spatially, rotating them to face each other, and exporting the result as a clean `.duf` scene file—**without copying or saving the original FBX files** into the output directory.

The tool is intended for users who frequently generate paired-animation scenes (fighting, dancing, interacting) and need a fast, error-free workflow.

---

## 2. Goals & Objectives

### Primary Goals

1. **Automatically import two characters with Mixamo animations** using DAZ’s `DzFbxImporter`.
2. **Preserve all animation data** with no skeleton or clothing merges.
3. **Auto-place both characters** at symmetrical X-axis offsets.
4. **Rotate characters to face each other** automatically.
5. **Use fully parameterized file paths** for flexible workflows.
6. **Save only the final scene** (`.duf`) to a specified directory.
7. **Run in silent mode** with no import/save dialogs.

---

## 3. Non-Goals

* No GUI or DAZ UI integration (script-only tool).
* No batch processing beyond two characters.
* No material or retargeting enhancements.
* No rendering or preview generation.

---

## 4. Behavioral Requirements

### 4.1. Error Handling

* If importer is missing → show critical error, abort.
* If import fails → warn user.
* If save directory does not exist → show error.
* If node detection fails → warning, but continue.

### 4.2. Performance

* Should import each FBX within ~2 seconds.
* No simulation, rendering, or material recalculation.

---

## 5. Technical Specifications

### 5.1. DAZ SDK Components Used

* `DzFbxImporter`
* `DzFileIOSettings`
* `DzSceneAssetFilter`
* `AssetIOMgr.doSaveWithOptions()`
* `Scene.getNodeList()`
* `Scene.clear()`
* `setWSPos()`, `setWSRot()` or `setYRot()`

---

### 5.2. Character Facing Logic

Characters should face toward each other:

| Character | Position     | Y Rotation  |
| --------- | ------------ | ----------- |
| A         | (+100, 0, 0) | 180° or 90° |
| B         | (−100, 0, 0) | 0° or −90°  |

Final angles depend on DAZ's native facing direction.

---

## 6. Future Enhancements (v2+)

* Batch FBX pair processing.
* Custom offsets and rotation parameters.
* Automatic scale matching.
* Auto-render preview output.
* Logging to file.
* Support for 3+ characters.

---

## 7. Success Criteria

The tool is complete when:

1. Both FBX files import correctly with animation.
2. Characters appear at opposite X positions.
3. Characters reliably face each other.
4. Animation plays correctly for both.
5. No additional files are created or copied.
6. The `.duf` scene saves correctly to the specified directory.
7. No dialogs appear during import or save.

---

