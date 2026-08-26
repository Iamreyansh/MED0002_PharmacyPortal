# Domain State Machines

Core owns every domain transition. The portal renders returned state and invokes only the explicit action endpoint in the relevant story.

## Required UI behavior

- Pharmacy lifecycle guards recognize Core states such as `PENDING_KYC`, `KYC_SUBMITTED`, `ACTIVE`, `REJECTED`, and `SUSPENDED` without inventing transitions.
- GRNs follow server-returned draft/save/stock outcomes; purchase orders follow server-returned `DRAFT`, `SENT`, `RECEIVED`, or `CANCELLED` state.
- Prescription approval, rejection, and dispensing use dedicated endpoints. Illegal transitions remain server errors and never receive optimistic final state.
- Marketplace order accept/reject/status actions recover from `ORDER_ALREADY_ACTIONED` and `INVALID_STATUS_TRANSITION`, then refresh the server state.
- Long-running analytics reports and support tickets render the state returned by Core and poll only where the story explicitly authorizes it.

Buttons are derived from the current response and endpoint contract. A stale or unknown state disables mutation, explains the refresh requirement, and preserves the last confirmed server data.
