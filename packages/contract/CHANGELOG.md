# Changelog

Every change to the contract is a tagged version with a line here. The field
app, the web labs and the office side say which version they follow.

## v1 — 2026-10-13

The first contract: eleven entities (user, building, entrance, photo,
comment, route, routeStop, trackingSession, position, conversation,
message), the shared id/timestamp/sync rules, the local-only columns,
`contract.ts` (zod 4) and `contract.dart` (dart:core only) checked by the same
fixtures in `test/`.
