# **App Name**: InfernoSim

## Core Features:

- City Generation: Procedurally generate a city with residential, commercial, industrial, and public buildings; roads (highways, main roads, alleys); parks, rivers, and bridges, and building-specific properties such as flammability, arson risk, and motives. This tool uses a cellular automaton to track state. This process excludes the agent's role.
- Fire Simulation: Simulate realistic fire propagation based on flammability, considering building destruction and burn-out states.
- Visualization: Provide a top-down city view with zoom/pan camera, color-coded buildings based on type, agent visualization with distinct colors, and fire intensity visualization using color gradients. The visualization displays current tool status, but agents won't receive assistance from AI in deciding to perform the actions
- UI Components: Offer UI components such as a side panel with a minimap showing fires/agents, a statistics dashboard displaying fires, casualties, and time, and an event log scrollable list. A bottom control bar with time/day display, pause/play controls, speed adjustment, and a placement toolbar for adding stations/agents. Visualization and interface are provided, but they don't play any part in helping the AI agent take their actions or respond.
- Agent Simulation: Arsonist agents start fires based on building motives/risks. Police agents patrol the city, report fires, and respond to incidents. Firefighter agents extinguish fires and return to stations. Civilian agents report fires and flee to safe zones.
- Event Logging: Log all simulation events, including fire ignition, fire extinguishment, building destruction, casualty reports, and agent actions.
- User Interaction: Provide interaction capabilities like right-click drag for camera panning, mouse wheel for zooming, building placement with ghost preview, and keyboard shortcuts (space pause, ESC exit).

## Style Guidelines:

- Primary color: Deep crimson (#8B0000) to represent the intensity of the fires.
- Background color: Dark gray (#333333) for a night mode feel, emphasizing the fires.
- Accent color: Bright orange (#FFA500) to highlight active fire zones and important UI elements.
- Body and headline font: 'Inter', a sans-serif font for a clean and modern look, suitable for both headlines and body text.
- Code font: 'Source Code Pro' for displaying code snippets in the event log.
- Use minimalist icons related to fire, police, civilians, and building types to enhance the information density of the interface.
- Subtle animations for fire and smoke effects, agent movements, and UI transitions to improve the visual experience.