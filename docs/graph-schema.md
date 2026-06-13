# Graph Schema — Project Ara

## Overview

The Ara graph is stored in a per-project SQLite database at `.ara/graph.db`. It uses a simple node-edge model with typed nodes and relationship edges.

## Tables

### `nodes`

Stores every entity in the project graph: projects, folders, files, and parsed entities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `node_type` | TEXT | NOT NULL | `project`, `folder`, `file`, or `parsed_entity` |
| `label` | TEXT | NOT NULL | Human-readable name |
| `file_path` | TEXT | NULLABLE | Absolute path to the file/folder (NULL for parsed entities) |
| `classification` | TEXT | NULLABLE | File classification (e.g., `godot_scene`, `shader_glsl`) |
| `metadata` | TEXT | NOT NULL DEFAULT '{}' | JSON blob for arbitrary key-value data |
| `created_at` | TEXT | NOT NULL | ISO 8601 timestamp |
| `updated_at` | TEXT | NOT NULL | ISO 8601 timestamp |

**Indexes**:
- `idx_nodes_type` on `node_type`
- `idx_nodes_path` on `file_path`

### `edges`

Stores directed relationships between nodes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `edge_type` | TEXT | NOT NULL | `contains`, `uses`, `derived_from`, `inspired_by`, or `discuss` |
| `source_id` | TEXT | NOT NULL | FK → `nodes.id` |
| `target_id` | TEXT | NOT NULL | FK → `nodes.id` |
| `label` | TEXT | NULLABLE | Optional human-readable edge label |
| `metadata` | TEXT | NOT NULL DEFAULT '{}' | JSON blob for arbitrary key-value data |

**Indexes**:
- `idx_edges_source` on `source_id`
- `idx_edges_target` on `target_id`

**Foreign keys**: Both `source_id` and `target_id` reference `nodes(id)` with `ON DELETE CASCADE`.

## Node types

| Type | Description | Example |
|------|-------------|---------|
| `project` | Top-level project node | "My Game" |
| `folder` | Directory within the project | "src/", "assets/textures/" |
| `file` | Any file in the project | "main.tscn", "shader.glsl" |
| `parsed_entity` | Entity extracted from a file by a Tier 1 parser | Scene node "Player (CharacterBody2D)", resource "ShaderMaterial(1)" |

## Edge types

| Type | Direction | Meaning |
|------|-----------|---------|
| `contains` | parent → child | Structural containment (folder → file, project → folder, scene → node) |
| `uses` | user → dependency | References or imports (scene → resource, shader → include, source → import) |
| `derived_from` | derived → source | Build/bake/generation relationship (exported audio → DAW session) |
| `inspired_by` | implementation → inspiration | User-defined creative link |
| `discuss` | artifact → discussion | Links to Slack/Discord messages or Notion pages |

## File classifications (Tier 0)

Complete list of classifications produced by the scanner:

| Classification | Extensions / Markers | Tool Family |
|---------------|---------------------|-------------|
| `godot_scene` | `.tscn` | Godot |
| `godot_script` | `.gd` | Godot |
| `godot_resource` | `.tres` | Godot |
| `godot_project` | `project.godot` | Godot |
| `shader_glsl` | `.glsl`, `.frag`, `.vert`, `.geom`, `.tesc`, `.tese`, `.comp` | Shaders |
| `shader_hlsl` | `.hlsl`, `.fx`, `.fxh` | Shaders |
| `shader_cg` | `.cg`, `.cginc` | Shaders |
| `unity_scene` | `.unity` | Unity |
| `unity_asset` | `.asset` | Unity |
| `unity_prefab` | `.prefab` | Unity |
| `unreal_project` | `.uproject` | Unreal |
| `touchdesigner` | `.toe`, `.tox` | TouchDesigner |
| `ableton_session` | `.als` | Ableton Live |
| `flstudio_project` | `.flp` | FL Studio |
| `logic_pro` | `.logicx` | Logic Pro |
| `reaper_project` | `.rpp` | Reaper |
| `processing_sketch` | `.pde` | Processing |
| `source_code` | `.rs`, `.c`, `.cpp`, `.h`, `.hpp`, `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.go`, `.java`, `.kt`, `.swift`, `.cs` | Various |
| `markdown` | `.md`, `.mdx` | Documentation |
| `image` | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.webp`, `.svg`, `.tga`, `.exr`, `.hdr` | Art/Assets |
| `audio` | `.wav`, `.mp3`, `.ogg`, `.flac`, `.aiff`, `.aif`, `.m4a` | Audio |
| `video` | `.mp4`, `.mov`, `.avi`, `.webm`, `.mkv` | Video |
| `model` | `.fbx`, `.obj`, `.gltf`, `.glb`, `.blend`, `.dae`, `.3ds`, `.stl` | 3D Assets |
| `unknown` | Everything else | — |

## Tier 1 parsed entity classifications

Additional classifications produced by parsers:

| Classification | Source | Description |
|---------------|--------|-------------|
| `godot_scene_node` | `.tscn` parser | A node within a Godot scene tree |
| `godot_resource` | `.tscn` parser | A sub-resource or external resource referenced by a scene |
| `shader_include` | Shader parser | A `#include` dependency in a shader file |
| `code_dependency` | Source parser | An import/use dependency in source code |

## Example graph structure

```
Project: "My Game"
  └─[contains]→ Folder: "scenes/"
      └─[contains]→ File: "main.tscn" (godot_scene)
          ├─[contains_node]→ Scene Node: "World" (Node2D)
          │   └─[parent_of]→ Scene Node: "Player" (CharacterBody2D)
          └─[uses_resource]→ Resource: "player_sprite.png" (1)
  └─[contains]→ Folder: "shaders/"
      └─[contains]→ File: "water.glsl" (shader_glsl)
          └─[includes]→ dep: "common.glsl"
```

## Metadata conventions

### File nodes
```json
{
  "size": 12345,
  "extension": "tscn"
}
```

### Godot scene nodes
```json
{
  "node_name": "Player",
  "node_type": "CharacterBody2D",
  "parent": "World",
  "source_file": "/path/to/main.tscn"
}
```

### Shader dependencies
```json
{
  "included_path": "common.glsl",
  "line": 5,
  "source_file": "/path/to/water.glsl"
}
```

### Source code dependencies
```json
{
  "dependency": "react",
  "line": 1,
  "source_file": "/path/to/App.tsx",
  "language": "tsx"
}
```

## Future considerations

- **SpacetimeDB**: The SQLite schema is designed to map cleanly to SpacetimeDB table definitions. Node and edge types use string enums compatible with SpacetimeDB's type system.
- **Versioning**: The `metadata` JSON column allows adding fields without schema migrations. Breaking changes should be handled via schema versioning in `config.toml`.
- **Performance**: For projects with >100K files, consider adding a `project_id` column to support multiple projects in a single database (SpacetimeDB mode) or sharding.
