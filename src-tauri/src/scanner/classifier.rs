use std::path::Path;

use crate::graph::types::FileClassification;

/// Classify a file by its extension and/or name into a tool family and role.
pub fn classify_file(path: &Path) -> FileClassification {
    // Check by extension
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        let ext_lower = ext.to_lowercase();

        match ext_lower.as_str() {
            // Godot
            "tscn" => return FileClassification::GodotScene,
            "gd" => return FileClassification::GodotScript,
            "tres" => return FileClassification::GodotResource,
            "godot" => return FileClassification::GodotProject,

            // Shaders
            "glsl" | "frag" | "vert" | "geom" | "tesc" | "tese" | "comp" => {
                return FileClassification::ShaderGlsl
            }
            "hlsl" | "fx" | "fxh" => return FileClassification::ShaderHlsl,
            "cg" | "cginc" => return FileClassification::ShaderCg,

            // Unity
            "unity" => return FileClassification::UnityScene,
            "asset" => return FileClassification::UnityAsset,
            "prefab" => return FileClassification::UnityPrefab,

            // Unreal
            "uproject" => return FileClassification::UnrealProject,

            // TouchDesigner
            "toe" | "tox" => return FileClassification::TouchDesigner,

            // DAWs
            "als" => return FileClassification::AbletonSession,
            "flp" => return FileClassification::FLStudioProject,
            "logicx" => return FileClassification::LogicProSession,
            "rpp" => return FileClassification::ReaperProject,

            // Creative Coding
            "pde" => return FileClassification::ProcessingSketch,

            // Source code
            "rs" | "c" | "cpp" | "h" | "hpp" | "py" | "js" | "ts" | "jsx" | "tsx" | "go"
            | "java" | "kt" | "swift" | "cs" => return FileClassification::SourceCode,

            // Markdown / docs
            "md" | "mdx" => return FileClassification::Markdown,

            // Images
            "png" | "jpg" | "jpeg" | "gif" | "bmp" | "webp" | "svg" | "tga" | "exr" | "hdr" => {
                return FileClassification::Image
            }

            // Audio
            "wav" | "mp3" | "ogg" | "flac" | "aiff" | "aif" | "m4a" => {
                return FileClassification::Audio
            }

            // Video
            "mp4" | "mov" | "avi" | "webm" | "mkv" => return FileClassification::Video,

            // 3D Models
            "fbx" | "obj" | "gltf" | "glb" | "blend" | "dae" | "3ds" | "stl" => {
                return FileClassification::Model
            }

            _ => {}
        }
    }

    // Check by filename patterns (for extensionless files)
    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
        match name {
            "project.godot" => return FileClassification::GodotProject,
            "Makefile" | "Dockerfile" => return FileClassification::SourceCode,
            "LICENSE" | "README" => return FileClassification::Markdown,
            _ => {}
        }
    }

    FileClassification::Unknown
}
