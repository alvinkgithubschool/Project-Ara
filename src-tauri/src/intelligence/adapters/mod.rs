pub mod godot;

use super::AdapterRegistry;

/// Register all available ecosystem adapters.
pub fn register_all(registry: &mut AdapterRegistry) {
    registry.register(Box::new(godot::GodotAdapter));
    // Future tiers (see docs/sprint-plan-focused.md ecosystem matrix):
    // registry.register(Box::new(blender::BlenderAdapter));
    // registry.register(Box::new(unity::UnityAdapter));
    // registry.register(Box::new(cables::CablesGlAdapter));
    // registry.register(Box::new(touchdesigner::TouchDesignerAdapter));
    // registry.register(Box::new(ableton::AbletonAdapter));
}
