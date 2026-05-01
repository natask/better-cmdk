# master-cmdk-core

Framework-agnostic command menu engine for `master-cmdk`.

The core owns registration, search scoring, ordering, modes, and selection. It does not import React and does not read or write the DOM. UI packages adapt framework-specific component trees into this engine.
