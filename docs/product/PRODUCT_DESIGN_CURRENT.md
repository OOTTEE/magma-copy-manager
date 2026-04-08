# Current Product Design: Direct Nexudus Linking (Admin)

## Context
Magma identifies users from the print server automatically, but they exist in a "partially disconnected" state until they are linked to a Nexudus coworker. The Admin needs a frictionless, high-visibility method to perform this linking to ensure billing flows correctly.

## Design Vision: "The Bridge Discovery"
Transforming a static "Pending" state into a proactive action. The UI should guide the Orchestrator to resolve identity gaps with a single click, using a specialized discovery modal that bridges the two systems conceptually and technically.

## Happy Path
1. **Trigger**: Admin identifies a user with a red "Vincular Nexudus" action in the User Table.
2. **Opening**: Clicking the button opens the `LinkNexudusModal`.
3. **Context**: The modal displays the Magma user being linked (e.g., "Vincular a: user_print_123") to maintain focus.
4. **Search**: Admin types a name or email. Results from Nexudus appear in real-time with premium hover effects.
5. **Selection**: Admin selects the correct coworker. A "Linked" badge confirms the selection visually.
6. **Persistence**: Clicking "Vincular" saves the ID and refreshes the table, where the user now shows their full Nexudus name and email.

## Strategic Alignment
- **Pilar**: Sincronía con el Ecosistema.
- **User Persona**: El Administrador (The Orchestrator).
- **Decision**: Optional Nexudus ID (permite reconciliación posterior).

---
*Este documento refleja el diseño acordado durante la sesión de /product-design el 2026-04-08.*
