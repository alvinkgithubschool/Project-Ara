# Project Ara MVP 2.0 – Multi‑Domain Technical Blueprint

## 1. Updated Vision and Scope

This expansion of Project Ara targets a broader creative stack: game engines, DAWs, creative‑coding environments, collaboration tools, and cloud storage, all mapped into a single project graph and interface. The MVP focuses on **read/lookup + relationship mapping** for all tools, with deeper integrations for a few priority engines and environments.[^1][^2][^3][^4]

The goal is to make Ara the “control room” for complex creative projects: you see how Unity/Godot scenes, Ableton sessions, shaders, docs, tasks, and storage locations relate, without forcing teams to abandon their existing tools.[^3][^5][^1]


## 2. Tool Landscape and Priorities

### 2.1 Game Engines and Frameworks

Unity and Unreal remain two of the most widely used engines across 2D, 3D, mobile, and AAA, with Unity powering a majority of Steam releases and many mobile titles. Godot has become a serious open‑source alternative, especially for 2D and stylized 3D, while frameworks like Phaser and Three.js dominate browser‑based games and experiences.[^6][^7][^8][^9][^10][^1]

For Ara, priority tiers:

- **Tier A (deep metadata + connectors):** Unity, Unreal, Godot.  
- **Tier B (file‑level + light metadata):** GameMaker, Phaser, Three.js.

### 2.2 DAWs

Ableton Live, FL Studio, Logic Pro, Pro Tools, Reaper, Studio One, and Cubase remain the main DAWs recommended for modern production workflows. Ableton Live in particular is viewed as a top choice for electronic and live performance workflows, while Pro Tools continues to dominate large studio/post environments.[^2][^11][^5]

For Ara, DAWs will initially be handled at the file/session level (Tier 0), with optional metadata extraction where formats are accessible.

### 2.3 Creative Coding Environments

Processing, p5.js, openFrameworks, Three.js, TouchDesigner, Hydra, vvvv, and Cables.gl represent a mix of code‑first and node‑based environments used for generative art, installations, and interactive visuals. These tools are central to the original Ara vision, especially TouchDesigner and shader‑centric setups.[^12][^13][^14][^15]

### 2.4 Collaboration / Work Management

Tools like Slack, Discord, Zoom, Google Workspace, Notion, Trello, Asana, Jira, Figma, and Miro cover modern communication and project management workflows. Notion increasingly acts as a combined wiki, doc space, and project tracker, with project frameworks and templates for many teams.[^16][^17][^4][^18][^3]

### 2.5 Cloud Storage

Google Drive, OneDrive, Dropbox, iCloud, pCloud, Proton Drive, Sync.com, Box, and IDrive are widely used for storage and sync; several emphasize privacy and zero‑knowledge encryption.[^19][^20]

For Ara, cloud storage services are modeled primarily as **backing stores** for artifacts; Ara tracks links and sync state, without replacing these tools.


## 3. Integration Tiers and Strategy

To keep the MVP manageable, integration is structured into tiers applied across all tool categories.

### 3.1 Tier 0 – File‑Only Awareness

- Detect projects and sessions via directory scan and extension patterns (e.g., `.unity`, `.uproject`, `.tscn`, `.toe`, `.als`, `.flp`, `.logicx`).  
- Classify by tool family (Unity, Unreal, Godot, TouchDesigner, Ableton, etc.).  
- Represent each as a node in the Ara graph, with edges for simple containment (folder → file), and user‑defined links to other nodes.

Tier 0 is sufficient to give users a visual file explorer and manual relationship mapping across tools.

### 3.2 Tier 1 – File + Metadata Graph

- Parse project/session files to extract structural metadata:  
  - Unity/Unreal: scenes/levels, prefabs/blueprints, assets, scripts (via meta or serialized formats).[^7][^21]
  - Godot: project file + `.tscn` scenes and resources; map scene trees into nodes.[^9][^7]
  - TouchDesigner: networks and COMPs, panel components and connections.[^13][^14][^15]
  - Creative code: modules/packages, shader include graphs, top‑level functions.  
- Build relationships such as “scene uses shader,” “session uses audio file,” “script imports module.”[^22][^23]

Tier 1 gives Ara a machine‑readable project graph without controlling the host tools.

### 3.3 Tier 2 – APIs, Connectors, MCP

- For tools with APIs/CLIs or MCP servers, add connectors that can:  
  - Refresh metadata or live state (e.g., which scene is open, current playhead position).  
  - Open specific entities (scene, clip, track) inside the tool.  
  - Expose tool actions to agents (e.g., run test scene, generate lightmap, bounce audio).  
- MCP‑based connectors unify how Ara and agents talk to tools, sharing the same tool definitions.

Tier 2 is where Ara starts to feel like a multi‑app command center, but it can be layered gradually.


## 4. Project Scanning and Relationship Model (Baseline)

Research on file history graphs and graph‑based file systems shows that tracking files and changes as graph nodes and edges simplifies cross‑tool reasoning over personal resources. Ara builds on this idea with a structured project graph.[^24][^23][^22]

### 4.1 Scan Pipeline

For each project root:

1. **Walk the filesystem:** Collect file metadata (paths, sizes, timestamps, types).  
2. **Classify:** Apply extension and content‑based heuristics to map files to tool families and roles (scene, shader, audio, doc, task export, etc.).  
3. **Parse (Tier 1):** For supported tools, parse project/session files into structured entities and relationships.  
4. **Graph build:** Create nodes for files and higher‑level entities, edges for containment, imports, dependencies, and user‑defined links.  
5. **Persist:** Store the graph in a local SQLite DB (per project) and optionally sync to SpacetimeDB for collaboration.[^25][^26][^27]

### 4.2 Relationship Types

- `CONTAINS` (folder → file, project → scene, scene → asset).  
- `USES` (scene → shader, DAW session → sample, Processing sketch → image).  
- `DERIVED_FROM` (baked audio/stem from project, LOD asset from original).  
- `INSPIRED_BY` (user‑defined link from implementation nodes to inspiration boards).  
- `DISCUSS` (link from a Slack/Discord message or Notion page to project nodes when imported/exported).

This schema creates a strong base for agentic understanding and UI navigation.


## 5. Category-Specific Blueprints

### 5.1 Game Development

**Priority engines:** Unity, Unreal, Godot.[^10][^6][^1][^9]

MVP behaviors:

- Tier 0: Detect presence of Unity/Unreal/Godot projects by markers (e.g., `Assets/`, `.uproject`, `project.godot`) and treat them as top‑level nodes.  
- Tier 1:  
  - Extract scene/level lists and asset references where formats are accessible (e.g., Godot scenes, open‑source engine structures).[^7][^9]
  - Parse script files (C#/GDScript) for imports to form dependency subgraphs.  
- Tier 2 (later): CLI/API‑based connectors to open scenes, run test builds, or call build pipelines from Ara.

Unity’s prevalence (a majority of new games on platforms like Steam, and 25+ platform targets) makes it an anchor engine to model first, with Godot providing a simpler open‑source contrast.[^1][^9][^10]

### 5.2 DAWs and Audio

MVP behaviors:

- Tier 0: Index DAW project files (`.als`, `.flp`, `.ptx`, `.reaper`, `.song`, `.cpr`, etc.) and treat them as session nodes.  
- Link audio assets (samples, stems, exports) to sessions via folder/location heuristics.  
- Allow users to associate Ara inspiration nodes (images, notes) with DAW sessions manually.

Tier 1 can add metadata for open formats (e.g., basic structure of certain project files) where practical; industry coverage shows Ableton Live, FL Studio, Logic, and Pro Tools as dominant choices worth supporting first.[^11][^5][^2]

### 5.3 Creative Coding and Visual Tools

TouchDesigner, Processing, p5.js, openFrameworks, Three.js, Hydra, vvvv, and Cables.gl provide the backbone of visual/generative work.[^14][^15][^12][^13]

MVP behaviors:

- Tier 0: Index projects by folder structure and file types (.toe/.tox, `.pde`, `.js`, `.cpp`, `.glsl`, etc.).  
- Tier 1:  
  - For TouchDesigner, extract network and COMP hierarchies via helper tools and map UI structures into graph nodes and edges.[^15][^13][^14]
  - For code-based environments, parse imports and shader includes to build dependency graphs.[^23][^22]
- UI: Make TouchDesigner-style panel interactions a first‑class interaction model on the Ara canvas.

### 5.4 Collaboration and PM Tools

Instead of trying to fully replicate PM tools, Ara focuses on **anchors and backlinks**:

- Import/export links to Notion pages, Google Docs, Jira issues, Trello cards, etc., as nodes tied to implementation artifacts.[^17][^16][^3]
- Parse simple exports (CSV/JSON) from PM tools to reflect task status and assignments.  
- Allow agents to use PM endpoints (where available) via connectors to create/update tasks based on project graph insights.

Given Notion’s role as a multiplayer doc + PM workspace, it is a strong initial target for deeper integration (e.g., linking Notion databases to Ara clusters).[^4][^17][^3]

### 5.5 Cloud Storage

Ara treats cloud storage providers as **location providers**:

- File nodes can store information about their backing provider and relative path (e.g., project lives in Dropbox or Google Drive).  
- For self‑hosted or privacy‑focused users, Proton Drive/Sync.com and similar services remain user choices; Ara only needs to track mappings and sync state where visible.[^20][^19]


## 6. Storage, Git, and Self‑Hosted Management

### 6.1 Local Storage Layout

Each project keeps a `.ara/` directory with:

- `graph.db` – SQLite DB holding the local project graph.  
- `config.toml` – project‑level configuration (SpacetimeDB URL, Git remotes, connector settings).  
- `cache/` – derived data, thumbnails, indexes.

This mirrors patterns from graph‑based file systems and code relationship visualizers and supports incremental and offline work.[^28][^24][^22]

### 6.2 SpacetimeDB for Real‑Time Graph State

SpacetimeDB can be self‑hosted following official guidance, typically via Docker or systemd‑managed services behind a reverse proxy. Ara uses it as a real‑time state engine:[^29][^30][^31]

- Tables for nodes, edges, tags, comments, workspaces, users, and permissions.  
- Reducers for graph mutations and collaboration events.  
- Client subscriptions restricted to currently open projects/workspaces.[^26][^27][^25]

Self‑hosted users point the Ara client to their own SpacetimeDB host; hosted Ara users connect to a managed, multi‑tenant deployment.

### 6.3 Git as Artifact History

Git continues to manage code and large binary assets. Self‑hosting can be handled with simple SSH + bare repository setups as documented in Git and community best practices.[^32][^33][^34][^35]

Ara’s responsibilities:

- Expose project Git status in the UI (dirty files, current branch, ahead/behind).  
- Provide simple commands: commit, push, pull, tag, with clear mapping back to graph state.  
- Optionally store serialized snapshots of the project graph (or references to them) alongside code commits for time‑travel views.

This architecture works identically for self‑hosted and cloud‑hosted Git; Android or console CI can be layered later.


## 7. Agentic Workflows Across the Stack

With the project graph spanning engines, DAWs, creative code, docs, and PM tools, agents can perform higher‑level workflows:

- **Cross‑tool navigation:** Given an in‑game shader, find its origin TouchDesigner prototype, linked inspiration images, and related DAW cues.  
- **Documentation agent:** Traverse graph regions and produce summaries, diagrams, and doc stubs, especially into Notion or markdown.[^17][^3][^4]
- **Refactoring/planning agent:** Identify unused assets, circular dependencies, or stale docs, and propose tasks in connected PM tools.

Connectors and MCP tools define **capability boundaries**: for each project, users specify which folders, DB tables, and APIs agents can access and whether they can perform write operations or only suggest changes.


## 8. Performance and Resource Budgets

Building on the earlier MVP, Ara continues to optimize around low idle usage and responsive interaction.

- **Idle:** Minimal OS watchers and no active SpacetimeDB subscriptions; rely on Tauri’s low‑overhead runtime to keep RAM and CPU usage small compared to typical Electron apps.[^36][^37][^38]
- **Sync:** Only subscribe to the current project; leverage SpacetimeDB’s incremental replication and client‑side cache.[^27][^25][^26]
- **Browsing:** GPU‑accelerated graph rendering with level‑of‑detail (only visible nodes fully rendered).  
- **Editing/agents:** Offload heavy computations to background processes or remote services so the UI remains smooth.


## 9. Updated MVP Milestones

### 9.1 MVP v1 – Multi‑Domain Local Graph

- Implement Tier 0 scanning for all listed categories (engines, DAWs, creative coding, PM exports).  
- Implement Tier 1 for Godot, TouchDesigner, and one or two creative coding stacks (e.g., Processing + shaders).  
- Build the Ara canvas and node/edge interactions with TouchDesigner‑like UX.

### 9.2 MVP v2 – Collaboration, Git, Self‑Host

- Integrate SpacetimeDB for multi‑user graph state, following self‑hosting patterns for on‑prem users.[^30][^31][^29]
- Add Git integration for artifact history and graph snapshots.[^34][^35][^32]
- Provide first‑class configuration options for local‑only, self‑hosted, and hosted modes.

### 9.3 MVP v3 – Agents and Connectors

- Introduce a connector system with a few Tier 2 integrations (e.g., Godot/Unity build tasks, Notion/PM updates).  
- Ship initial cross‑tool agents (documentation, cartographer, planner) operating on the unified project graph.

This updated blueprint gives Ara a clear path from **file‑and‑relationship aware explorer** to a **multi‑domain, agent‑augmented project control room** that still respects open‑source and self‑hosted workflows.

---

## References

1. [Unity Game Development Guide: 2026 Edition - Juego Studios](https://www.juegostudio.com/blog/unity-game-development-guide-2025) - Explore the Unity game development guide covering Unity 6.x, AI, XR, multiplatform monetization, cas...

2. [The Best Electronic Music Production Software (2026)](https://www.electronicproduction.co.uk/post/best-electronic-music-production-software-a-producer-s-guide) - Final Thoughts on Choosing the Right DAW for Electronic Music ; Use Ableton Live if you're about spo...

3. [How to Use Notion for Project Management - A Complete 2025 Guide](https://www.smarttask.io/blog/notion-project-management) - Notion is an all-in-one workspace that lets you take notes, create knowledge bases, and collaborate ...

4. [Your connected workspace for wiki, docs & projects - Notion](https://www.notion.com/product/projects) - Manage projects from beginning to end. With Notion's connected workspace, get your projects to the f...

5. [Ableton Live vs. FL Studio: Which DAW Should You Choose in 2025?](https://rewwwind.com/portal/ableton-live-vs-fl-studio-which-daw-should-you-choose-in-2025/) - Ableton Live is renowned for its versatility, especially in live performance settings. Launched in 2...

6. [Serious Games in Digital Gaming: A Comprehensive Review of Applications,
  Game Engines and Advancements](https://arxiv.org/pdf/2311.03384.pdf) - ...have become increasingly
popular due to their ability to simultaneously educate and entertain use...

7. [An Exploratory Approach for Game Engine Architecture Recovery](https://arxiv.org/pdf/2303.02429.pdf) - ...developers with a wide range of fundamental
subsystems for creating games, such as 2D/3D graphics...

8. [Unity (game engine) - Wikipedia](https://en.wikipedia.org/wiki/Unity_(game_engine))

9. [Godot vs. Unity in 2025: Picking the Right Engine for the Games You ...](https://sunstrikestudios.com/en/godot_vs_unity_in_2025) - SunStrike Studios create 2D and 3D graphics for video games and mobile games, as well as promo video...

10. [Games made with Unity: 2025 in review | Unity Blog](https://unity.com/blog/games/games-made-with-unity-2025-releases) - Stay updated with the latest creations from the Unity community. Explore our list of standout games ...

11. [The Best 6 DAWs to Start Making Music in 2025 [After ... - YouTube](https://www.youtube.com/watch?v=apnSePIiRXI) - Cubase 14 02:04 Ableton Live 12 03:32 FL Studio 24 04:59 Logic Pro ... electronic producers, and Log...

12. [Planetary-Scale Geospatial Open Platform Based on the Unity3D Environment](https://www.mdpi.com/1424-8220/20/20/5967/pdf) - ...based on building a virtual digital city similar to a real one enables the simulation of urban ph...

13. [User Interface Components · Introduction to TouchDesigner](https://nvoid.gitbooks.io/introduction-to-touchdesigner/content/COMPs/7-3-User-Interface-Components.html)

14. [Custom User Interfaces inside TouchDesigner](https://www.youtube.com/watch?v=hHE9Znf9N1Q) - Get access to 200+ hours of TouchDesigner video training, a private Facebook group where Elburz Sork...

15. [First Things to Know about TouchDesigner | Derivative](https://derivative.ca/UserGuide/First_Things_to_Know_about_TouchDesigner) - Derivative is a software company that offers TouchDesigner, a visual development platform.

16. [Notion Projects vs Google Workspace 2025 | AI PM Tools](https://aipmtools.org/comparisons/notion-projects-vs-google-workspace) - Compare Notion Projects (95/100) vs Google Workspace (95/100). Features, pricing & governance analys...

17. [Project Management Frameworks For Every Team in One Workspace](https://www.notion.com/use-case/project-management/project-management-framework) - Explore top project management frameworks and when to use each. You can adapt each easily in Notion ...

18. [Top 31 Notion Templates for Work Management 2025 - NotionApps](https://www.notionapps.com/blog/best-notion-templates-work-management-2025/) - Discover 31 curated Notion templates for project planning, team collaboration, and task management. ...

19. [Integration of Security Architecture and Green Information Technology in the Implementation of Nextcloud in a Data Center](https://jrssem.publikasiindonesia.id/index.php/jrssem/article/view/1226) - As digital infrastructure continues to expand, institutions are increasingly seeking data storage so...

20. [A Trajectory Big Data Storage Model Incorporating Partitioning and Spatio-Temporal Multidimensional Hierarchical Organization](https://www.mdpi.com/2220-9964/11/12/621/pdf?version=1671700478) - Trajectory big data is suitable for distributed storage retrieval due to its fast update speed and h...

21. [Visualising Game Engine Subsystem Coupling](https://arxiv.org/pdf/2309.06329.pdf) - ...functionalities such
as graphics rendering or input/output device management. However, their
arch...

22. [[PDF] GraphFS: A Graph-Based Distributed File System - Florian Myter](http://myter.be/wp-content/uploads/2021/03/masterThesis.pdf) - By materialising nodes as files and edges as the relationships between these files, GraphFS is able ...

23. [Desktop content graph part 1. A content model for file linking and ...](https://tellura.co.uk/content-model-design/) - The main topic for this article is how files in the file system need to behave when incorporated int...

24. [[PDF] Using a file history graph to keep track of personal resources across ...](https://www.research-collection.ethz.ch/server/api/core/bitstreams/d7a709fc-ddce-40bd-bb02-18ea86814b0c/content) - Our dedicated end-user tool, the Memsy Companion application is a Chrome app. These apps resemble na...

25. [FAQ | SpacetimeDB docsspacetimedb.com › docs › intro › faq](https://spacetimedb.com/docs/intro/faq/) - General

26. [SpacetimeDB/README.md at master · clockworklabs/SpacetimeDB](https://github.com/clockworklabs/SpacetimeDB/blob/master/README.md) - Development at the speed of light. Contribute to clockworklabs/SpacetimeDB development by creating a...

27. [Repository Details for clockworklabs/SpacetimeDB](https://www.gitgenius.co/repos/clockworklabs/SpacetimeDB) - Development at the speed of light | clockworklabs/SpacetimeDB

28. [CodeBase Relationship Visualizer: Visualizing Relationships Between Source Code Files](https://knowledge.e.southern.edu/cgi/viewcontent.cgi?article=1007&context=mscs_reports)

29. [Self-hosting | SpacetimeDB docs](https://spacetimedb.com/docs/how-to/deploy/self-hosting/) - This tutorial will guide you through setting up SpacetimeDB on an Ubuntu 24.04 server, securing it w...

30. [SpacetimeDB: A New Era of Multiplayer Apps - DEV Community](https://dev.to/dantesbytes/spacetimedb-a-new-era-of-multiplayer-apps-386p) - Self-Hosting on SpacetimeDB. For those who prefer full control over their infrastructure, SpacetimeD...

31. [Key Architecture | SpacetimeDB docsspacetimedb.com › docs › intro › key-architecture](https://spacetimedb.com/docs/intro/key-architecture/) - Host

32. [Git hacks: self-host a minimal Git repo over SSH - DEV Community](https://dev.to/chr15m/git-hacks-self-host-a-minimal-git-repo-over-ssh-388h) - Use the steps below to set up a simple repo over SSH. All you need is SSH access to a server that yo...

33. [Self-hosted git repository for privacy and control - Lambros Petrou](https://www.lambrospetrou.com/articles/self-hosted-private-git/) - The good thing of git bare repositories is that they can be used from any system that has access to ...

34. [Getting Git on a Server](https://git-scm.com/book/en/v2/Git-on-the-Server-Getting-Git-on-a-Server) - Putting the Bare Repository on a Server. Now that you have a bare copy of your repository, all you n...

35. [Setting Up Your Bare Git Repository on the Server - DoHost](https://dohost.us/index.php/2025/12/10/setting-up-your-bare-git-repository-on-the-server/) - Unlike a standard Git repository, a bare repo does not contain the actual checked-out files; it only...

36. [Framework Wars: Tauri vs Electron vs Flutter vs React Native](https://www.moontechnolabs.com/blog/tauri-vs-electron-vs-flutter-vs-react-native/) - Compare Tauri vs Electron vs Flutter vs React Native to discover the ideal framework for your projec...

37. [Cross-Platform Development Tools Comprehensive Comparison — Flutter, React Native, Tauri, KMP, Electron, .NET MAUI Latest Trends and Selection Guide [2026 Edition]](https://codenote.net/en/posts/cross-platform-dev-tools-comparison-2026/) - A comprehensive comparison of cross-platform development tools as of March 2026. Covering Flutter, R...

38. [Crossplatform Desktop App Frameworks Key Tech Choices Explained](https://ecweb.ecer.com/topic/en/detail-255918-crossplatform_desktop_app_frameworks_key_tech_choices_explained.html) - This review compares five major cross-platform desktop frameworks: Electron, Flutter, Tauri, React N...

